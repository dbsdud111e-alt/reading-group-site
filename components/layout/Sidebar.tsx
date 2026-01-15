"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    BookOpen,
    Calendar,
    Layers,
    Settings,
    ChevronLeft,
    ChevronRight,
    Plus,
    Search,
    Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReading } from '@/lib/store';
import { AuthStatus } from '../auth/AuthStatus';

const navItems = [
    { name: '대시보드', href: '/', icon: Home },
    { name: '서재', href: '/books', icon: BookOpen },
    { name: '캘린더', href: '/calendar', icon: Calendar },
    { name: '수업 자료', href: '/contents', icon: Layers },
    { name: '관리자', href: '/admin', icon: Shield, adminOnly: true },
];

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const pathname = usePathname();
    const { books, journalPosts, currentUser } = useReading();

    // Check if current user is admin
    const isAdmin = currentUser?.email === 'admin@math-reading.com' || currentUser?.id === 'admin';

    const filteredBooks = books.filter(b =>
        b.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.author?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredPosts = journalPosts.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter nav items based on admin status
    const visibleNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

    return (
        <>
            <div
                className={cn(
                    "flex flex-col h-screen bg-[#FBFBFA] border-r border-[#EBEBEB] transition-all duration-300 ease-in-out sticky top-0",
                    collapsed ? "w-16" : "w-64"
                )}
            >
                {/* User / Workspace Header */}
                <div className="p-4 flex items-center justify-between">
                    {!collapsed && (
                        <div className="flex items-center gap-2 font-semibold text-[#37352F]">
                            <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs">
                                M
                            </div>
                            <span className="truncate">수학 독서 모임</span>
                        </div>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1 hover:bg-[#EFEFEF] rounded-md text-[#A1A1A1]"
                    >
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>

                {/* Quick Search / Actions */}
                <div className="px-2 mb-4">
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className={cn(
                            "w-full flex items-center gap-2 p-2 text-[#787774] hover:bg-[#EFEFEF] rounded-md transition-colors text-left",
                            collapsed ? "justify-center" : "px-3"
                        )}
                    >
                        <Search size={18} />
                        {!collapsed && <span className="text-sm">검색...</span>}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-2 space-y-0.5">
                    {visibleNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-2 p-2 rounded-md transition-colors group",
                                    isActive
                                        ? "bg-[#EFEFEF] text-[#37352F] font-medium"
                                        : "text-[#787774] hover:bg-[#F1F1F0]",
                                    collapsed ? "justify-center" : "px-3"
                                )}
                            >
                                <item.icon
                                    size={18}
                                    className={cn(
                                        isActive ? "text-[#37352F]" : "text-[#787774] group-hover:text-[#37352F]"
                                    )}
                                />
                                {!collapsed && <span className="text-sm">{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Profile */}
                <div className="p-4 border-t border-[#EBEBEB]">
                    {collapsed ? (
                        <div className="flex justify-center">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">
                                M
                            </div>
                        </div>
                    ) : (
                        <AuthStatus />
                    )}
                </div>
            </div>

            {/* Global Search Modal */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/20 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)}>
                    <div
                        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-[#EBEBEB] overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 p-4 border-b border-[#EBEBEB]">
                            <Search size={20} className="text-[#A1A1A1]" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="무엇을 찾으시나요?"
                                className="flex-1 outline-none text-base text-[#37352F]"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <div className="text-[10px] text-[#A1A1A1] border border-[#EBEBEB] px-1.5 py-0.5 rounded shadow-sm">ESC</div>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto p-2">
                            {searchTerm ? (
                                <>
                                    {filteredBooks.length > 0 && (
                                        <div className="mb-4">
                                            <div className="px-3 py-1.5 text-[10px] font-bold text-[#A1A1A1] uppercase">서재</div>
                                            {filteredBooks.map(book => (
                                                <Link
                                                    key={book.id}
                                                    href={`/journal?bookId=${book.id}`}
                                                    onClick={() => setIsSearchOpen(false)}
                                                    className="flex items-center gap-3 p-3 hover:bg-[#F1F1F0] rounded-lg transition-colors"
                                                >
                                                    <div className="w-8 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                                        {book.cover_url && <img src={book.cover_url} className="w-full h-full object-cover" />}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-[#37352F]">{book.title}</div>
                                                        <div className="text-[11px] text-[#787774]">{book.author}</div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}

                                    {filteredPosts.length > 0 && (
                                        <div className="mb-4">
                                            <div className="px-3 py-1.5 text-[10px] font-bold text-[#A1A1A1] uppercase">게시글</div>
                                            {filteredPosts.map(post => (
                                                <Link
                                                    key={post.id}
                                                    href="/journal"
                                                    onClick={() => setIsSearchOpen(false)}
                                                    className="flex items-center gap-3 p-3 hover:bg-[#F1F1F0] rounded-lg transition-colors"
                                                >
                                                    <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center text-blue-500">
                                                        <Search size={14} />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-[#37352F]">{post.title}</div>
                                                        <div className="text-[11px] text-[#787774] line-clamp-1">{post.content}</div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}

                                    {filteredBooks.length === 0 && filteredPosts.length === 0 && (
                                        <div className="py-12 text-center text-[#A1A1A1] text-sm italic">
                                            검색 결과가 없습니다.
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="py-20 text-center">
                                    <div className="text-[#A1A1A1] text-sm mb-1">제목, 작가, 또는 내용으로 검색해보세요.</div>
                                    <div className="text-[10px] text-[#EBEBEB]">예: 수학, 상민, 아이디어</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
