"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Book, Schedule } from '@/types';
import { supabase } from './supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

export interface Comment {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
}

export interface TrackerRecord {
    id: string;
    user_id: string;
    schedule_id: string;
    completed_at: string;
}

export interface JournalPost {
    id: string;
    user_id: string;
    book_id?: string;
    category: 'memo' | 'question' | 'feeling' | 'idea';
    title: string;
    content: string;
    files?: { url: string; name: string }[]; // Multiple files
    links?: string[]; // Multiple links
    material_status?: 'draft' | 'finished'; // For 'idea' category
    material_tags?: string[]; // Subject, Document style, etc.
    references?: string[]; // Array of other JournalPost IDs
    comments?: Comment[];
    created_at: string;
    updated_at: string;
    is_private?: boolean;
}

export interface User {
    id: string;
    name: string;
    avatar_url?: string;
    email?: string;
}

interface ReadingContextType {
    books: Partial<Book>[];
    schedules: Schedule[];
    journalPosts: JournalPost[];
    users: User[];
    trackerRecords: TrackerRecord[];
    addBook: (book: any) => Promise<Partial<Book> | null>;
    updateBook: (bookId: string, updates: Partial<Book>) => void;
    deleteBook: (bookId: string) => void;
    addSchedule: (schedule: Omit<Schedule, 'id'>) => void;
    updateSchedule: (id: string, updates: Partial<Schedule>) => void;
    deleteSchedule: (id: string) => void;
    addJournalPost: (post: JournalPost) => void;
    updateJournalPost: (id: string, updates: Partial<JournalPost>) => void;
    deleteJournalPost: (id: string) => void;
    addComment: (postId: string, comment: Comment) => void;
    deleteComment: (postId: string, commentId: string) => void;
    updateUserName: (userId: string, newName: string) => void;
    addUser: (user: User) => void;
    materialTags: string[];
    addMaterialTag: (tag: string) => void;
    deleteMaterialTag: (tag: string) => void;
    globalFilterTags: string[];
    setGlobalFilterTags: (tags: string[]) => void;
    toggleTrackerCompletion: (scheduleId: string) => Promise<void>;
    // Auth
    currentUser: User | null;
    isLoading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithId: (userId: string, memberNumber: string) => Promise<{ error: any }>;
    signUpWithId: (userId: string, memberNumber: string, nickname: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    updateProfile: (updates: { name: string }) => Promise<void>;
}

const ReadingContext = createContext<ReadingContextType | undefined>(undefined);

export function ReadingProvider({ children }: { children: React.ReactNode }) {
    const [books, setBooks] = useState<Partial<Book>[]>([]);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [journalPosts, setJournalPosts] = useState<JournalPost[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [trackerRecords, setTrackerRecords] = useState<TrackerRecord[]>([]);
    const [materialTags, setMaterialTags] = useState<string[]>(['공통수학', '미적분', '기하', '활동지', '발표자료', '도구']);
    const [globalFilterTags, setGlobalFilterTags] = useState<string[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const isFetching = React.useRef(false);

    const loadInitialData = async () => {
        if (isFetching.current) return;
        isFetching.current = true;

        try {
            // Fetch essentials first, limit journals to 40 to prevent hang
            const [
                { data: dbBooks },
                { data: dbSchedules },
                { data: dbPosts },
                { data: dbUsers },
                { data: dbTrackerRecords }
            ] = await Promise.all([
                supabase.from('books').select('*').order('created_at', { ascending: false }),
                supabase.from('schedules').select('*'),
                supabase.from('journals').select('*, comments(*)').order('created_at', { ascending: false }).limit(20),
                supabase.from('users').select('id, display_name, avatar_url').limit(50),
                supabase.from('tracker_completions').select('*')
            ]);

            if (dbBooks) setBooks(dbBooks);
            if (dbSchedules) {
                // Enrich schedules with book info
                const enrichedSchedules = dbSchedules.map((s: any) => {
                    const book = dbBooks?.find(b => b.id === s.book_id);
                    return {
                        ...s,
                        book_title: book?.title,
                        book_cover: book?.cover_url
                    };
                });
                setSchedules(enrichedSchedules);
            }
            if (dbPosts) setJournalPosts(dbPosts as any);
            if (dbUsers) {
                setUsers(dbUsers.map(u => ({
                    id: u.id,
                    name: u.display_name || '익명',
                    avatar_url: u.avatar_url,
                })));
            }
            if (dbTrackerRecords) setTrackerRecords(dbTrackerRecords as any);
        } catch (err) {
            console.error('Initial fetch failed:', err);
        } finally {
            isFetching.current = false;
            // setIsLoading(false); // Removed as it's handled by auth state or initial check
        }
    };

    const fetchProfile = async (supabaseUser: SupabaseUser) => {
        // Step 1: Set basic info IMMEDIATELY (Non-blocking)
        const initialUser = {
            id: supabaseUser.id,
            name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || '익명',
            avatar_url: supabaseUser.user_metadata?.avatar_url,
            email: supabaseUser.email
        };
        setCurrentUser(initialUser);
        setIsLoading(false);

        // Step 2: Background profile/DB check
        try {
            const { data } = await supabase.from('users').select('display_name, avatar_url').eq('id', supabaseUser.id).maybeSingle();

            if (data) {
                setCurrentUser(prev => prev ? {
                    ...prev,
                    name: data.display_name || prev.name,
                    avatar_url: data.avatar_url || prev.avatar_url
                } : null);
            } else {
                // Create profile if missing
                await supabase.from('users').insert([{
                    id: supabaseUser.id,
                    display_name: initialUser.name,
                    avatar_url: initialUser.avatar_url,
                    role: 'teacher'
                }]);
                await loadInitialData();
            }
        } catch (err) {
            console.error('BG Profile Fetch Error:', err);
        }
    };

    useEffect(() => {
        let isMounted = true;

        // Load data in background immediately
        loadInitialData();

        // One-time session check
        const checkInitialSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session && isMounted) {
                    fetchProfile(session.user);
                } else if (isMounted) {
                    setIsLoading(false);
                }
            } catch (err) {
                if (isMounted) setIsLoading(false);
            }
        };

        checkInitialSession();

        // Safety timeout (reduced to 500ms for even faster feel)
        const loadingTimeout = setTimeout(() => {
            if (isMounted) setIsLoading(false);
        }, 500);

        // REALTIME SUBSCRIPTIONS
        const journalsChannel = supabase
            .channel('db_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'journals' }, () => loadInitialData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => loadInitialData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, () => loadInitialData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => loadInitialData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => loadInitialData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tracker_completions' }, () => loadInitialData())
            .subscribe();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session && isMounted) {
                if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                    fetchProfile(session.user);
                    // Only load data if not already loading
                    if (!isFetching.current) loadInitialData();
                }
            } else if (event === 'SIGNED_OUT' && isMounted) {
                setCurrentUser(null);
                setIsLoading(false);
            }
        });

        return () => {
            isMounted = false;
            clearTimeout(loadingTimeout);
            subscription.unsubscribe();
            supabase.removeChannel(journalsChannel);
        };
    }, []);

    useEffect(() => {
        localStorage.setItem('math-material-tags', JSON.stringify(materialTags));
        localStorage.setItem('math-global-filter-tags', JSON.stringify(globalFilterTags));
    }, [materialTags, globalFilterTags]);

    const addBook = async (newBook: any) => {
        if (!currentUser) {
            console.error('addBook: No current user');
            return null;
        }

        // 1. Try insert WITH user_id (User-specific books)
        const payload = {
            ...newBook,
            user_id: currentUser.id,
            created_at: new Date().toISOString()
        };

        let { data, error } = await supabase.from('books').insert([payload]).select().single();

        // 2. Fallback: If 'user_id' column doesn't exist, try WITHOUT it (Shared books)
        if (error && error.message?.includes('user_id')) {
            console.warn('addBook: user_id column missing, retrying without it.');
            const { user_id, ...payloadWithoutUser } = payload;
            const retry = await supabase.from('books').insert([payloadWithoutUser]).select().single();
            data = retry.data;
            error = retry.error;
        }

        if (error) {
            console.error('addBook failed:', error);
            alert(`도서 등록 실패: ${error.message}`); // Show specific error to user
            return null;
        }

        if (data) {
            setBooks(prev => [data, ...prev]);
            return data;
        }
        return null;
    };

    const updateBook = async (bookId: string, updates: Partial<Book>) => {
        const { error } = await supabase.from('books').update(updates).eq('id', bookId);
        if (!error) {
            setBooks(prev => prev.map(b => b.id === bookId ? { ...b, ...updates } : b));
        }
    };

    const deleteBook = async (bookId: string) => {
        const { error } = await supabase.from('books').delete().eq('id', bookId);
        if (!error) {
            setBooks(prev => prev.filter(b => b.id !== bookId));
            setSchedules(prev => prev.filter(s => s.book_id !== bookId));
            setJournalPosts(prev => prev.filter(p => p.book_id !== bookId));
        }
    };

    const addSchedule = async (schedule: Omit<Schedule, 'id'>) => {
        // 1. Prepare payload (remove display-only fields for DB)
        const { book_title, book_cover, ...dbPayloadBase } = schedule;

        // 2. Try insert WITH user_id (if available)
        const payload = currentUser ? { ...dbPayloadBase, user_id: currentUser.id } : dbPayloadBase;

        let { data, error } = await supabase.from('schedules').insert([payload]).select().single();

        // 3. Fallback: If 'user_id' column missing, try WITHOUT it
        if (error && error.message?.includes('user_id')) {
            console.warn('addSchedule: user_id column missing, retrying without it.');
            const { user_id, ...payloadWithoutUser } = payload as any;
            const retry = await supabase.from('schedules').insert([payloadWithoutUser]).select().single();
            data = retry.data;
            error = retry.error;
        }

        if (error) {
            console.error('addSchedule failed:', error);
            // Ignore "column does not exist" for optional fields just in case, but book_cover caused error.
            if (error.message?.includes('book_cover')) {
                alert('DB 스키마 불일치: book_cover 컬럼이 없습니다. 개발자에게 문의하세요.');
            } else {
                alert(`일정 등록 실패: ${error.message}`);
            }
            return;
        }

        if (data) {
            // Merge with input display fields for local state
            const newSchedule = { ...data, book_title, book_cover };
            setSchedules(prev => [...prev, newSchedule]);
        }
    };

    const updateSchedule = async (id: string, updates: Partial<Schedule>) => {
        const { error } = await supabase.from('schedules').update(updates).eq('id', id);
        if (!error) {
            setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
        }
    };

    const deleteSchedule = async (id: string) => {
        const { error } = await supabase.from('schedules').delete().eq('id', id);
        if (!error) {
            setSchedules(prev => prev.filter(s => s.id !== id));
        }
    };

    const addJournalPost = async (post: JournalPost) => {
        if (!currentUser) {
            alert('로그인이 필요합니다.');
            return;
        }

        const { id, created_at, updated_at, ...postData } = post;

        // Ensure the post has the correct authenticated user_id
        const finalPost = {
            ...postData,
            user_id: currentUser.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase.from('journals').insert([finalPost]).select().single();

        if (!error && data) {
            setJournalPosts(prev => [data as any, ...prev]);
        } else if (error) {
            console.error('Error adding post:', error.message);
            alert('게시글 저장 실패: ' + error.message);
        }
    };

    const updateJournalPost = async (id: string, updates: Partial<JournalPost>) => {
        const { error } = await supabase.from('journals').update(updates).eq('id', id);
        if (!error) {
            setJournalPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p));
        }
    };

    const deleteJournalPost = async (id: string) => {
        const { error } = await supabase.from('journals').delete().eq('id', id);
        if (!error) {
            setJournalPosts(prev => prev.filter(p => p.id !== id));
        }
    };

    const addComment = async (postId: string, comment: Comment) => {
        const { error } = await supabase.from('comments').insert([{
            journal_id: postId,
            user_id: comment.user_id,
            content: comment.content,
            created_at: comment.created_at
        }]);

        if (!error) {
            setJournalPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, comments: [...(p.comments || []), comment] } : p
            ));
        }
    };

    const deleteComment = async (postId: string, commentId: string) => {
        const { error } = await supabase.from('comments').delete().eq('id', commentId);
        if (!error) {
            setJournalPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, comments: (p.comments || []).filter(c => c.id !== commentId) } : p
            ));
        }
    };

    const updateUserName = (userId: string, newName: string) => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, name: newName } : u));
    };

    const addUser = (user: User) => {
        setUsers(prev => [...prev, user]);
    };

    const addMaterialTag = async (tag: string) => {
        // For simplicity, keeping tags local for now as they are project-wide defaults
        // but could be moved to DB if needed.
        setMaterialTags(prev => prev.includes(tag) ? prev : [...prev, tag]);
    };

    const deleteMaterialTag = async (tag: string) => {
        setMaterialTags(prev => prev.filter(t => t !== tag));
    };

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) console.error('Error signing in:', error.message);
    };

    // Helper for timeouts
    const withTimeout = <T,>(promise: Promise<T> | PromiseLike<T>, ms: number = 7000): Promise<T> => {
        return Promise.race([
            Promise.resolve(promise),
            new Promise<T>((_, reject) =>
                setTimeout(() => reject(new Error('서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.')), ms)
            )
        ]);
    };

    // Simple ID-based login with Timeout
    const signInWithId = async (userId: string, memberNumber: string) => {
        try {
            const cleanId = userId.trim().replace(/\s+/g, '').toLowerCase();
            const internalEmail = `${cleanId}.math@gmail.com`;

            // Apply timeout
            const { error } = await withTimeout(
                supabase.auth.signInWithPassword({
                    email: internalEmail,
                    password: memberNumber,
                })
            );
            return { error };
        } catch (err) {
            console.error('Login Exception:', err);
            return { error: err };
        }
    };

    const signUpWithId = async (userId: string, memberNumber: string, nickname: string) => {
        try {
            const cleanId = userId.trim().replace(/\s+/g, '').toLowerCase();
            const cleanNickname = nickname.trim();
            const internalEmail = `${cleanId}.math@gmail.com`;

            // 1. Sign up to Auth (with Timeout)
            const { data, error: authError } = await withTimeout(
                supabase.auth.signUp({
                    email: internalEmail,
                    password: memberNumber,
                    options: {
                        data: {
                            full_name: cleanNickname
                        }
                    }
                })
            );

            if (authError) return { error: authError };

            // 2. Create profile in users table (with Timeout)
            // 2. Create profile in users table (with Timeout)
            if (data.user) {
                const { error: profileError } = await withTimeout<any>(
                    supabase.from('users').upsert({
                        id: data.user.id,
                        display_name: cleanNickname,
                        updated_at: new Date().toISOString()
                    })
                );
                if (profileError) console.error('Profile creation error:', profileError.message);
            }

            return { error: null };
        } catch (err: any) {
            console.error('Signup Exception:', err);
            return { error: err };
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const updateProfile = async (updates: { name: string }) => {
        if (!currentUser) return;

        const { error } = await supabase
            .from('users')
            .upsert({
                id: currentUser.id,
                display_name: updates.name,
                updated_at: new Date().toISOString()
            });

        if (!error) {
            setCurrentUser(prev => prev ? { ...prev, name: updates.name } : null);
        } else {
            console.error('Error updating profile:', error.message);
            throw new Error(error.message);
        }
    };

    const toggleTrackerCompletion = async (scheduleId: string) => {
        if (!currentUser) {
            alert("로그인이 필요합니다.");
            return;
        }

        const existingRecord = trackerRecords.find(r => r.user_id === currentUser.id && r.schedule_id === scheduleId);

        if (existingRecord) {
            // Optimistic Remove
            setTrackerRecords(prev => prev.filter(r => r.id !== existingRecord.id));

            const { error } = await supabase.from('tracker_completions').delete().eq('id', existingRecord.id);
            if (error) {
                console.error("Failed to delete tracker record:", error);
                // Revert
                setTrackerRecords(prev => [...prev, existingRecord]);
                alert("삭제에 실패했습니다. 다시 시도해주세요.");
            }
        } else {
            // Optimistic Add
            const tempId = `temp-${Date.now()}`;
            const newRecord: TrackerRecord = {
                id: tempId,
                user_id: currentUser.id,
                schedule_id: scheduleId,
                completed_at: new Date().toISOString()
            };
            setTrackerRecords(prev => [...prev, newRecord]);

            const { data, error } = await supabase.from('tracker_completions').insert([{
                user_id: currentUser.id,
                schedule_id: scheduleId,
                completed_at: new Date().toISOString()
            }]).select().single();

            if (error) {
                console.error("Failed to insert tracker record:", error);
                // Revert
                setTrackerRecords(prev => prev.filter(r => r.id !== tempId));
                alert("저장에 실패했습니다. 다시 시도해주세요.");
            } else if (data) {
                // Update temp ID to real ID
                setTrackerRecords(prev => prev.map(r => r.id === tempId ? (data as any) : r));
            }
        }
    };

    return (
        <ReadingContext.Provider value={{
            books,
            schedules,
            journalPosts,
            users,
            addBook,
            updateBook,
            deleteBook,
            addSchedule,
            updateSchedule,
            deleteSchedule,
            addJournalPost,
            updateJournalPost,
            deleteJournalPost,
            addComment,
            deleteComment,
            updateUserName,
            addUser,
            materialTags,
            addMaterialTag,
            deleteMaterialTag,
            globalFilterTags,
            setGlobalFilterTags,
            trackerRecords,
            toggleTrackerCompletion,
            currentUser,
            isLoading,
            signInWithGoogle,
            signInWithId,
            signUpWithId,
            signOut,
            updateProfile
        }}>
            {children}
        </ReadingContext.Provider>
    );
}

export function useReading() {
    const context = useContext(ReadingContext);
    if (context === undefined) {
        throw new Error('useReading must be used within a ReadingProvider');
    }
    return context;
}
