"use client";

import React, { useState } from 'react';
import { useReading } from '@/lib/store';
import { FileText, Layers, BookOpen, Clock, Tag } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function MyPage() {
    const { currentUser, journalPosts, books } = useReading();
    const [activeTab, setActiveTab] = useState<'journal' | 'materials'>('journal');

    if (!currentUser) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText size={32} className="text-gray-400" />
                </div>
                <h1 className="text-2xl font-bold text-[#37352F] mb-2">로그인이 필요합니다</h1>
                <p className="text-[#787774]">나의 활동 기록을 보려면 먼저 로그인해 주세요.</p>
            </div>
        );
    }

    // Filter posts by current user
    const myPosts = journalPosts.filter(p => p.user_id === currentUser.id);

    // Split into Journal (not idea) and Materials (idea)
    const myJournals = myPosts.filter(p => p.category !== 'idea').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const myMaterials = myPosts.filter(p => p.category === 'idea').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const getBookTitle = (bookId?: string) => {
        if (!bookId) return '자유 주제';
        return books.find(b => b.id === bookId)?.title || '삭제된 도서';
    };

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'question': return '질문';
            case 'feeling': return '느낀점';
            case 'memo': return '메모';
            case 'idea': return '아이디어';
            default: return '기타';
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto px-6 py-10 md:px-12 md:py-16">
            {/* Header / Profile */}
            <div className="flex items-end justify-between mb-10 border-b border-[#EBEBEB] pb-8">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-[#37352F] rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                        {currentUser.name?.charAt(0) || '나'}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#37352F] mb-1">{currentUser.name}님의 기록</h1>
                        <p className="text-[#787774] text-sm">
                            총 <span className="font-bold text-[#37352F]">{myPosts.length}</span>개의 활동 내역이 있습니다.
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#EBEBEB] mb-8">
                <button
                    onClick={() => setActiveTab('journal')}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all",
                        activeTab === 'journal'
                            ? "border-[#37352F] text-[#37352F]"
                            : "border-transparent text-[#787774] hover:text-[#37352F]"
                    )}
                >
                    <FileText size={16} />
                    내 독서기록장
                    <span className="ml-1 text-xs bg-gray-100 px-2 py-0.5 rounded-full">{myJournals.length}</span>
                </button>
                <button
                    onClick={() => setActiveTab('materials')}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all",
                        activeTab === 'materials'
                            ? "border-[#37352F] text-[#37352F]"
                            : "border-transparent text-[#787774] hover:text-[#37352F]"
                    )}
                >
                    <Layers size={16} />
                    내 수업자료
                    <span className="ml-1 text-xs bg-gray-100 px-2 py-0.5 rounded-full">{myMaterials.length}</span>
                </button>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(activeTab === 'journal' ? myJournals : myMaterials).map((post) => (
                    <div key={post.id} className="bg-white border border-[#EBEBEB] rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-[280px]">
                        <div className="flex items-center justify-between mb-4">
                            <span className={cn(
                                "px-2.5 py-1 text-[10px] font-bold rounded uppercase",
                                post.category === 'question' ? "bg-rose-50 text-rose-600" :
                                    post.category === 'idea' ? "bg-amber-50 text-amber-600" :
                                        post.category === 'feeling' ? "bg-green-50 text-green-600" :
                                            "bg-gray-100 text-gray-600"
                            )}>
                                {getCategoryLabel(post.category)}
                            </span>
                            <span className="text-[11px] text-[#A1A1A1] flex items-center gap-1">
                                <Clock size={12} />
                                {format(new Date(post.created_at), 'yyyy.MM.dd', { locale: ko })}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-[#37352F] mb-2 line-clamp-2 leading-tight min-h-[3rem]">
                            {post.title}
                        </h3>

                        <div className="flex items-center gap-1.5 mb-4 text-[#787774] text-xs">
                            <BookOpen size={14} className="text-blue-500" />
                            <span className="truncate">{getBookTitle(post.book_id)}</span>
                        </div>

                        <div
                            className="text-sm text-[#787774] line-clamp-3 mb-auto"
                            dangerouslySetInnerHTML={{ __html: post.content.replace(/<[^>]+>/g, '') }}
                        />

                        {/* Footer / Actions */}
                        <div className="pt-4 mt-4 border-t border-[#F1F1F0] flex items-center justify-between">
                            <div className="flex gap-1">
                                {post.material_tags?.slice(0, 2).map(tag => (
                                    <span key={tag} className="px-2 py-0.5 bg-gray-50 text-gray-500 text-[10px] rounded">#{tag}</span>
                                ))}
                            </div>
                            <Link
                                href={activeTab === 'journal' ? `/journal?bookId=${post.book_id}` : '/contents'}
                                className="text-xs font-bold text-blue-600 hover:underline"
                            >
                                자세히 보기 →
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {(activeTab === 'journal' ? myJournals : myMaterials).length === 0 && (
                <div className="py-20 text-center border-2 border-dashed border-[#F1F1F0] rounded-3xl text-[#A1A1A1]">
                    <p>등록된 {activeTab === 'journal' ? '독서 기록이' : '수업 자료가'} 없습니다.</p>
                </div>
            )}
        </div>
    );
}
