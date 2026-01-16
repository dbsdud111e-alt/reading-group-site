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
    Shield,
    FileText,
    User,
    Menu,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReading } from '@/lib/store';
import { AuthStatus } from '../auth/AuthStatus';

const navItems = [
    { name: '대시보드', href: '/', icon: Home },
    { name: '서재', href: '/books', icon: BookOpen },
    { name: '전체 독서기록장', href: '/journal', icon: FileText },
    { name: '마이 페이지', href: '/my', icon: User },
    { name: '캘린더', href: '/calendar', icon: Calendar },
    { name: '수업 자료', href: '/contents', icon: Layers },
    { name: '관리자', href: '/admin', icon: Shield, adminOnly: true },
];

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const pathname = usePathname();
    const { books, journalPosts, currentUser } = useReading();

    // Close mobile menu on path change
    React.useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    // Check if current user is admin
    const isAdmin = currentUser?.email === 'admin@math-reading.com' ||
        currentUser?.email === 'admin.math@gmail.com' || // Corresponds to ID: admin
        currentUser?.id === 'admin';

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

    const renderNavItems = (isMobile = false) => (
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
                                ? "bg-gradient-to-r from-[#FFF4D9] to-[#FFE8C2] text-[#4A4A3A] font-medium shadow-sm"
                                : "text-[#8B8B7A] hover:bg-[#FFF9E6]",
                            !isMobile && collapsed ? "justify-center" : "px-3"
                        )}
                    >
                        <item.icon
                            size={18}
                            className={cn(
                                isActive ? "text-[#FFB84D]" : "text-[#8B8B7A] group-hover:text-[#FFB84D]"
                            )}
                        />
                        {(isMobile || !collapsed) && <span className="text-sm">{item.name}</span>}
                    </Link>
                );
            })}
        </nav>
    );

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-[#FFFCF5] border-b border-[#F5E6D3] sticky top-0 z-40 w-full shrink-0">
                <div className="flex items-center gap-2 font-semibold text-[#4A4A3A]">
                    <div className="w-6 h-6 bg-gradient-to-br from-[#FFD97D] to-[#FFB84D] rounded flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        M
                    </div>
                    <span>수학 독서 모임</span>
                </div>
                <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="p-2 text-[#4A4A3A] hover:bg-[#FFF9E6] rounded-md transition-colors shadow-sm border border-[#F5E6D3] flex items-center gap-1.5"
                >
                    <span className="text-xs font-bold text-[#8B8B7A]">MENU</span>
                    <Menu size={18} />
                </button>
            </div>

            {/* Mobile Drawer */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden font-sans">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
                    <div className="fixed inset-y-0 left-0 w-[80%] max-w-xs bg-[#FFFCF5] shadow-2xl flex flex-col border-r border-[#F5E6D3]">
                        <div className="p-4 flex items-center justify-between border-b border-[#F5E6D3] bg-[#FFFCF5]">
                            <div className="flex items-center gap-2 font-semibold text-[#4A4A3A]">
                                <div className="w-6 h-6 bg-gradient-to-br from-[#FFD97D] to-[#FFB84D] rounded flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                    M
                                </div>
                                <span>수학 독서 모임</span>
                            </div>
                            <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-[#F1F1F0] rounded-full text-[#8B8B7A]">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4">
                            <button
                                onClick={() => { setIsSearchOpen(true); setMobileMenuOpen(false); }}
                                className="w-full flex items-center gap-2 p-3 bg-white border border-[#EBEBEB] text-[#8B8B7A] rounded-xl text-left shadow-sm hover:border-[#F5E6D3] transition-colors"
                            >
                                <Search size={18} />
                                <span className="text-sm">검색...</span>
                            </button>
                        </div>

                        {renderNavItems(true)}

                        <div className="p-4 border-t border-[#F5E6D3] mt-auto bg-[#FFFCF5]">
                            <AuthStatus />
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Sidebar */}
            <div
                className={cn(
                    "hidden md:flex flex-col h-screen bg-[#FFFCF5] border-r border-[#F5E6D3] transition-all duration-300 ease-in-out sticky top-0",
                    collapsed ? "w-16" : "w-64"
                )}
            >
                {/* User / Workspace Header */}
                <div className="p-4 flex items-center justify-between">
                    {!collapsed && (
                        <div className="flex items-center gap-2 font-semibold text-[#4A4A3A]">
                            <div className="w-6 h-6 bg-gradient-to-br from-[#FFD97D] to-[#FFB84D] rounded flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                M
                            </div>
                            <span className="truncate">수학 독서 모임</span>
                        </div>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1 hover:bg-[#FFF9E6] rounded-md text-[#8B8B7A] transition-colors"
                    >
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>

                {/* Quick Search / Actions */}
                <div className="px-2 mb-4">
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className={cn(
                            "w-full flex items-center gap-2 p-2 text-[#8B8B7A] hover:bg-[#FFF9E6] rounded-md transition-colors text-left",
                            collapsed ? "justify-center" : "px-3"
                        )}
                    >
                        <Search size={18} />
                        {!collapsed && <span className="text-sm">검색...</span>}
                    </button>
                </div>

                {/* Navigation */}
                {renderNavItems(false)}

                {/* Bottom Profile */}
                <div className="p-4 border-t border-[#EBEBEB] mt-auto">
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
                        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-[#EBEBEB] overflow-hidden mx-4"
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
                                                        <img src={book.cover_url} className="w-full h-full object-cover" />
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
                                                    href={`/journal?postId=${post.id}`}
                                                    onClick={() => setIsSearchOpen(false)}
                                                    className="flex items-center gap-3 p-3 hover:bg-[#F1F1F0] rounded-lg transition-colors"
                                                >
                                                    <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center text-blue-500">
                                                        <Search size={14} />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-[#37352F]">{post.title}</div>
                                                        <div className="text-[11px] text-[#787774] line-clamp-1">{post.content?.substring(0, 50)}</div>
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
