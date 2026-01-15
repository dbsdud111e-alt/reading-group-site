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
    const [users, setUsers] = useState<User[]>([
        { id: 'user1', name: '상민' },
        { id: 'user2', name: '윤영' }
    ]);
    const [materialTags, setMaterialTags] = useState<string[]>(['공통수학', '미적분', '기하', '활동지', '발표자료', '도구']);
    const [globalFilterTags, setGlobalFilterTags] = useState<string[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const savedBooks = localStorage.getItem('math-books');
        const savedSchedules = localStorage.getItem('math-schedules');
        const savedPosts = localStorage.getItem('math-journal-posts');
        const savedUsers = localStorage.getItem('math-users');
        const savedMaterialTags = localStorage.getItem('math-material-tags');
        const savedGlobalTags = localStorage.getItem('math-global-filter-tags');

        if (savedBooks) setBooks(JSON.parse(savedBooks));
        if (savedSchedules) setSchedules(JSON.parse(savedSchedules));
        if (savedPosts) setJournalPosts(JSON.parse(savedPosts));
        if (savedUsers) setUsers(JSON.parse(savedUsers));
        if (savedMaterialTags) setMaterialTags(JSON.parse(savedMaterialTags));
        if (savedGlobalTags) setGlobalFilterTags(JSON.parse(savedGlobalTags));

        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                fetchProfile(session.user);
            } else {
                setIsLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                fetchProfile(session.user);
            } else {
                setCurrentUser(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (supabaseUser: SupabaseUser) => {
        setIsLoading(true);
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
                // Initial login, profile doesn't exist yet
                setCurrentUser({
                    id: supabaseUser.id,
                    name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || '',
                    avatar_url: supabaseUser.user_metadata?.avatar_url,
                    email: supabaseUser.email
                });
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        localStorage.setItem('math-books', JSON.stringify(books));
        localStorage.setItem('math-schedules', JSON.stringify(schedules));
        localStorage.setItem('math-journal-posts', JSON.stringify(journalPosts));
        localStorage.setItem('math-users', JSON.stringify(users));
        localStorage.setItem('math-material-tags', JSON.stringify(materialTags));
        localStorage.setItem('math-global-filter-tags', JSON.stringify(globalFilterTags));
    }, [books, schedules, journalPosts, users, materialTags, globalFilterTags]);

    const addBook = (newBook: any) => {
        setBooks(prev => [
            {
                ...newBook,
                id: Math.random().toString(36).substr(2, 9),
                created_at: new Date().toISOString()
            },
            ...prev
        ]);
    };

    const updateBook = (bookId: string, updates: Partial<Book>) => {
        setBooks(prev => prev.map(b => b.id === bookId ? { ...b, ...updates } : b));
    };

    const deleteBook = (bookId: string) => {
        setBooks(prev => prev.filter(b => b.id !== bookId));
        // Also delete related schedules and journal posts
        setSchedules(prev => prev.filter(s => s.book_id !== bookId));
        setJournalPosts(prev => prev.filter(p => p.book_id !== bookId));
    };

    const addSchedule = (schedule: Schedule) => {
        setSchedules(prev => [...prev, schedule]);
    };

    const updateSchedule = (id: string, updates: Partial<Schedule>) => {
        setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const deleteSchedule = (id: string) => {
        setSchedules(prev => prev.filter(s => s.id !== id));
    };

    const addJournalPost = (post: JournalPost) => {
        setJournalPosts(prev => [...prev, post]);
    };

    const updateJournalPost = (id: string, updates: Partial<JournalPost>) => {
        setJournalPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p));
    };

    const deleteJournalPost = (id: string) => {
        setJournalPosts(prev => prev.filter(p => p.id !== id));
    };

    const addComment = (postId: string, comment: Comment) => {
        setJournalPosts(prev => prev.map(p =>
            p.id === postId ? { ...p, comments: [...(p.comments || []), comment] } : p
        ));
    };

    const deleteComment = (postId: string, commentId: string) => {
        setJournalPosts(prev => prev.map(p =>
            p.id === postId ? { ...p, comments: (p.comments || []).filter(c => c.id !== commentId) } : p
        ));
    };

    const updateUserName = (userId: string, newName: string) => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, name: newName } : u));
    };

    const addUser = (user: User) => {
        setUsers(prev => [...prev, user]);
    };

    const addMaterialTag = (tag: string) => {
        setMaterialTags(prev => prev.includes(tag) ? prev : [...prev, tag]);
    };

    const deleteMaterialTag = (tag: string) => {
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
