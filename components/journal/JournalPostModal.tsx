"use client";

import React from 'react';
import { X, User, BookOpen, Link as LinkIcon, FileText, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReading, JournalPost } from '@/lib/store';
import { List, HelpCircle, Heart, Lightbulb } from 'lucide-react';

type Category = 'memo' | 'question' | 'feeling' | 'idea';
const categories: { id: Category; label: string; icon: any; color: string }[] = [
    { id: 'question', label: '질문', icon: HelpCircle, color: 'text-rose-600' },
    { id: 'idea', label: '수업 아이디어 및 콘텐츠', icon: Lightbulb, color: 'text-amber-600' },
    { id: 'memo', label: '메모 및 요약정리', icon: List, color: 'text-gray-600' },
    { id: 'feeling', label: '느낀점', icon: Heart, color: 'text-green-600' },
];

interface JournalPostModalProps {
    post: JournalPost;
    onClose: () => void;
}

export function JournalPostModal({ post, onClose }: JournalPostModalProps) {
    const { users, books, currentUser, addComment, deleteComment } = useReading();

    const getUserName = (userId: string) => {
        const storeUser = users.find(u => u.id === userId);
        if (storeUser) return storeUser.name;
        if (currentUser?.id === userId) return currentUser.name;
        return '알 수 없음';
    };

    const getBookTitle = (bookId: string | undefined) => {
        if (!bookId) return '도서 연결 없음';
        return books.find(b => b.id === bookId)?.title || '알 수 없는 도서';
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="w-full max-w-4xl max-h-[90vh] bg-[#FFFEF9] rounded-[32px] shadow-2xl flex flex-col overflow-hidden relative">
                {/* Header */}
                <div className="flex-none flex items-center justify-between px-8 py-6 md:px-12 md:py-8 border-b border-[#F5E6D3] bg-[#FFFEF9]">
                    <div className="flex items-center gap-3">
                        <span className={cn(
                            "px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-bold uppercase"
                        )}>
                            {categories.find(c => c.id === post.category)?.label || '기록'}
                        </span>
                        {post.material_status && (
                            <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                                post.material_status === 'draft' ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"
                            )}>
                                {post.material_status === 'draft' ? '아이디어' : '완성본'}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white border border-[#EBEBEB] text-[#A1A1A1] hover:text-rose-500 hover:border-rose-200 rounded-xl transition-all shadow-sm"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-[#FFFEF9]">
                    <h2 className="text-3xl font-black text-[#37352F] mb-6 tracking-tight">{post.title}</h2>

                    {/* Content Area */}
                    <div
                        className="text-lg text-[#37352F] mb-12 rich-content leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />

                    {/* Meta Section */}
                    <div className="flex flex-wrap gap-4 pt-8 border-t border-[#F5E6D3] mb-12">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-[#F5E6D3] rounded-xl text-xs font-bold text-[#37352F]">
                            <User size={14} className="text-[#A1A1A1]" /> {getUserName(post.user_id)}
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-[#F5E6D3] rounded-xl text-xs font-bold text-[#A1A1A1]">
                            {new Date(post.created_at).toLocaleString('ko-KR')}
                        </div>
                        {post.book_id && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl text-xs font-bold text-blue-600">
                                <BookOpen size={14} /> {getBookTitle(post.book_id)}
                            </div>
                        )}
                    </div>

                    {/* Links & Files */}
                    {((post.links && post.links.length > 0) || (post.files && post.files.length > 0)) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                            {post.links && post.links.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-[#787774] uppercase tracking-widest px-2">연관 링크</h4>
                                    <div className="space-y-2">
                                        {post.links.map((link, idx) => (
                                            <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 text-xs font-bold rounded-xl border border-blue-100 hover:bg-blue-100 transition-all">
                                                <LinkIcon size={14} /> 링크 {idx + 1}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {post.files && post.files.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-[#787774] uppercase tracking-widest px-2">첨부 파일</h4>
                                    <div className="space-y-2">
                                        {post.files.map((file, idx) => (
                                            <a key={idx} href={file.url} download={file.name} className="flex items-center gap-2 px-4 py-3 bg-green-50 text-green-600 text-xs font-bold rounded-xl border border-green-100 hover:bg-green-100 transition-all">
                                                <FileText size={14} /> {file.name}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Comments */}
                    <div className="bg-[#FFFCF5] rounded-[32px] border border-[#F5E6D3] p-8 md:p-10 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-white border border-[#F5E6D3] rounded-xl flex items-center justify-center text-[#FFB84D] shadow-sm">
                                <MessageSquare size={20} />
                            </div>
                            <h3 className="text-xl font-black text-[#37352F] tracking-tight">댓글 {post.comments?.length || 0}</h3>
                        </div>

                        <div className="space-y-4 mb-8">
                            {post.comments?.map(comment => (
                                <div key={comment.id} className="bg-white p-5 rounded-2xl border border-[#F5E6D3] shadow-sm flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black text-[#37352F]">{getUserName(comment.user_id)}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold text-[#A1A1A1]">{new Date(comment.created_at).toLocaleDateString('ko-KR')}</span>
                                            {(currentUser?.id === comment.user_id || currentUser?.id === post.user_id) && (
                                                <button onClick={() => deleteComment(post.id, comment.id)} className="text-[#A1A1A1] hover:text-rose-500 transition-colors">
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-[#4A4A3A] leading-relaxed">{comment.content}</p>
                                </div>
                            ))}
                            {(!post.comments || post.comments.length === 0) && (
                                <div className="text-center py-10 text-[#A1A1A1] border-2 border-dashed border-[#F5E6D3] rounded-2xl">
                                    첫 번째 댓글을 남겨보세요!
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <input
                                type="text"
                                placeholder="따뜻한 댓글로 응원해주세요..."
                                className="w-full px-6 py-4 bg-white border border-[#F5E6D3] rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FFD97D]/20 focus:border-[#FFD97D] transition-all shadow-sm pr-20"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.currentTarget.value.trim() && currentUser) {
                                        addComment(post.id, {
                                            id: Math.random().toString(36).substr(2, 9),
                                            user_id: currentUser.id,
                                            content: e.currentTarget.value.trim(),
                                            created_at: new Date().toISOString()
                                        });
                                        e.currentTarget.value = '';
                                    }
                                }}
                            />
                            <button
                                onClick={(e) => {
                                    const inputEl = e.currentTarget.parentElement?.querySelector('input');
                                    if (inputEl && inputEl.value.trim() && currentUser) {
                                        addComment(post.id, {
                                            id: Math.random().toString(36).substr(2, 9),
                                            user_id: currentUser.id,
                                            content: inputEl.value.trim(),
                                            created_at: new Date().toISOString()
                                        });
                                        inputEl.value = '';
                                    }
                                }}
                                className="absolute right-2 top-2 bottom-2 px-5 bg-[#37352F] text-white rounded-xl text-xs font-bold hover:bg-black transition-all active:scale-95"
                            >
                                게시
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
