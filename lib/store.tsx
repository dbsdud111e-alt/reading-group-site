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
    addBook: (book: any) => void;
    updateBook: (bookId: string, updates: Partial<Book>) => void;
    deleteBook: (bookId: string) => void;
    addSchedule: (schedule: Schedule) => void;
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
    // Auth
    currentUser: User | null;
    isLoading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    updateProfile: (updates: { name: string }) => Promise<void>;
}

const ReadingContext = createContext<ReadingContextType | undefined>(undefined);

export function ReadingProvider({ children }: { children: React.ReactNode }) {
    const [books, setBooks] = useState<Partial<Book>[]>([]);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [journalPosts, setJournalPosts] = useState<JournalPost[]>([]);
    const [materialTags, setMaterialTags] = useState<string[]>(['공통수학', '미적분', '기하', '활동지', '발표자료', '도구']);
    const [globalFilterTags, setGlobalFilterTags] = useState<string[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadInitialData = async () => {
        try {
            // Fetch Books
            const { data: dbBooks } = await supabase.from('books').select('*').order('created_at', { ascending: false });
            if (dbBooks) setBooks(dbBooks);

            // Fetch Schedules
            const { data: dbSchedules } = await supabase.from('schedules').select('*');
            if (dbSchedules) setSchedules(dbSchedules);

            // Fetch Journal Posts with Comments
            const { data: dbPosts } = await supabase
                .from('journals')
                .select('*, comments(*)')
                .order('created_at', { ascending: false });
            if (dbPosts) setJournalPosts(dbPosts as any);

            // Fetch Registered Users
            const { data: dbUsers } = await supabase.from('users').select('*');
            if (dbUsers) {
                setUsers(dbUsers.map(u => ({
                    id: u.id,
                    name: u.display_name || '익명',
                    avatar_url: u.avatar_url,
                    email: u.email
                })));
            }
        } catch (err) {
            console.error('Initial fetch failed:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchProfile = async (supabaseUser: SupabaseUser) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', supabaseUser.id)
                .single();

            if (data) {
                setCurrentUser({
                    id: data.id,
                    name: data.display_name || supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || '',
                    avatar_url: data.avatar_url || supabaseUser.user_metadata?.avatar_url,
                    email: supabaseUser.email
                });
            } else {
                // Auto-create profile on first login for DB integrity
                const initialProfile = {
                    id: supabaseUser.id,
                    display_name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || '익명',
                    avatar_url: supabaseUser.user_metadata?.avatar_url,
                    role: 'teacher'
                };

                await supabase.from('users').insert([initialProfile]);

                setCurrentUser({
                    id: supabaseUser.id,
                    name: initialProfile.display_name,
                    avatar_url: initialProfile.avatar_url,
                    email: supabaseUser.email
                });

                loadInitialData(); // Refresh users list
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    };

    useEffect(() => {
        loadInitialData();

        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) fetchProfile(session.user);
        });

        // REALTIME SUBSCRIPTIONS
        const journalsChannel = supabase
            .channel('db_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'journals' }, () => loadInitialData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => loadInitialData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, () => loadInitialData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => loadInitialData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => loadInitialData())
            .subscribe();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                await fetchProfile(session.user);
                loadInitialData();
            } else {
                setCurrentUser(null);
            }
        });

        return () => {
            subscription.unsubscribe();
            supabase.removeChannel(journalsChannel);
        };
    }, []);

    useEffect(() => {
        localStorage.setItem('math-material-tags', JSON.stringify(materialTags));
        localStorage.setItem('math-global-filter-tags', JSON.stringify(globalFilterTags));
    }, [materialTags, globalFilterTags]);

    const addBook = async (newBook: any) => {
        if (!currentUser) return;

        const { data, error } = await supabase.from('books').insert([{
            ...newBook,
            created_at: new Date().toISOString()
        }]).select().single();

        if (!error && data) {
            setBooks(prev => [data, ...prev]);
        }
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

    const addSchedule = async (schedule: Schedule) => {
        const { error } = await supabase.from('schedules').insert([schedule]);
        if (!error) {
            setSchedules(prev => [...prev, schedule]);
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
            currentUser,
            isLoading,
            signInWithGoogle,
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
