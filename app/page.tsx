"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Lightbulb, BookOpen, Calendar, Clock, User, ChevronRight, CheckCircle, Check, Users, X } from 'lucide-react';
import { CategoryCard } from '@/components/dashboard/DashboardCards';
import { useReading } from '@/lib/store';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { journalPosts, books, schedules, users, currentUser, trackerRecords, toggleTrackerCompletion } = useReading();
  const [showAllStatus, setShowAllStatus] = useState(false);

  // Get most recent posts (all shared posts), excluding private memos and private posts from others
  const recentPosts = [...journalPosts]
    .filter(p => !(p.category === 'memo' && !p.book_id))
    .filter(p => !p.is_private || (currentUser && p.user_id === currentUser.id))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);

  // Get upcoming schedules
  const upcomingSchedules = [...schedules]
    .filter(s => new Date(s.end_date) >= new Date())
    .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())
    .slice(0, 2);

  // Get current reading book (most recent)
  const currentBook = books.filter(b => b.status === 'reading')[0] || books[0];

  const getUserName = (userId: string) => {
    // Check store users
    const storeUser = users.find(u => u.id === userId);
    if (storeUser) return storeUser.name;

    // Check current auth user
    if (currentUser?.id === userId) return currentUser.name;

    return '알 수 없음';
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'question': return 'rose';
      case 'idea': return 'amber';
      case 'memo': return 'gray';
      case 'feeling': return 'green';
      default: return 'blue';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'question': return '질문';
      case 'idea': return '아이디어';
      case 'memo': return '메모';
      case 'feeling': return '느낀점';
      default: return '기타';
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10 md:px-12 md:py-16">
      {/* Header */}
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#37352F] mb-2">대시보드</h1>
          <p className="text-[#787774]">오늘의 수학 독서와 수업 아이디어를 확인하세요.</p>
        </div>
      </div>

      {/* Reading Tracker for Current Book */}
      {currentBook && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-500" size={24} />
              <h2 className="text-xl font-bold text-[#37352F]">나의 독서 트래커</h2>
            </div>
            <button
              onClick={() => setShowAllStatus(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#F5F5F0] hover:bg-[#EBEBEB] text-[#37352F] text-xs font-bold rounded-lg transition-colors"
            >
              <Users size={14} />
              전체 독서현황 보기
            </button>
          </div>
          <div className="bg-white border border-[#EBEBEB] rounded-2xl p-6 shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 mb-6">
              <img src={currentBook.cover_url} alt={currentBook.title} className="w-10 h-14 object-cover rounded shadow-sm border border-[#EBEBEB]" />
              <div>
                <h3 className="font-bold text-[#37352F]">{currentBook.title}</h3>
                <p className="text-xs text-[#A1A1A1]">{currentBook.author}</p>
              </div>
            </div>

            <div className="w-full overflow-x-auto pb-2">
              <div className="flex items-center gap-2 min-w-max">
                {schedules
                  .filter(s => s.book_id === currentBook.id)
                  .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
                  .map((schedule, idx) => {
                    const isCompleted = trackerRecords.some(r => r.user_id === currentUser?.id && r.schedule_id === schedule.id);
                    return (
                      <button
                        key={schedule.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleTrackerCompletion(schedule.id);
                        }}
                        className={cn(
                          "relative group flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all min-w-[100px] h-[80px]",
                          isCompleted
                            ? "bg-[#D4EDDA] border-[#C3E6CB] shadow-sm z-10"
                            : "bg-white border-[#EBEBEB] hover:border-blue-300 hover:bg-gray-50 text-[#A1A1A1] hover:text-[#37352F]"
                        )}
                      >
                        {idx > 0 && (
                          <div className={cn(
                            "absolute left-0 top-1/2 -translate-x-full w-2 h-0.5 pointer-events-none",
                            isCompleted ? "bg-[#C3E6CB]" : "bg-[#EBEBEB]"
                          )} style={{ left: '-4px' }} />
                        )}

                        <div className="text-[9px] font-bold mb-0.5 opacity-70">
                          ~ {new Date(schedule.end_date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                        </div>
                        <div className={cn(
                          "text-xs font-bold text-center px-1 break-keep leading-tight",
                          isCompleted ? "text-[#155724]" : "text-inherit"
                        )}>
                          {schedule.range_text}
                        </div>
                        <div className={cn(
                          "mt-2 w-5 h-5 rounded-full flex items-center justify-center transition-all",
                          isCompleted ? "bg-[#155724] text-white" : "bg-[#F1F1F0] text-[#D1D1D1]"
                        )}>
                          <Check size={12} strokeWidth={4} />
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prominent Schedule Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {upcomingSchedules.length > 0 ? (
          upcomingSchedules.map((schedule) => (
            <Link
              href="/calendar"
              key={schedule.id}
              className="group flex items-center gap-4 p-5 bg-white border border-[#EBEBEB] rounded-2xl hover:border-blue-200 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 flex-shrink-0 bg-blue-50 rounded-xl flex flex-col items-center justify-center border border-blue-100 group-hover:bg-blue-100 transition-colors">
                <span className="text-[10px] text-blue-600 font-bold uppercase">{new Date(schedule.end_date).toLocaleString('default', { month: 'short' })}</span>
                <span className="text-lg font-bold text-[#37352F] leading-none">{new Date(schedule.end_date).getDate()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-blue-600 px-1.5 py-0.5 bg-blue-50 rounded">일정</span>
                  <span className="text-xs text-[#787774] truncate">{schedule.book_title}</span>
                </div>
                <div className="text-sm font-bold text-[#37352F] truncate">{schedule.range_text}</div>
              </div>
              <ChevronRight size={18} className="text-[#EBEBEB] group-hover:text-blue-400 transition-colors" />
            </Link>
          ))
        ) : (
          <div className="md:col-span-2 p-10 bg-gray-50/50 border border-dashed border-[#EBEBEB] rounded-2xl text-center">
            <Calendar className="mx-auto mb-2 text-[#A1A1A1]" size={24} />
            <p className="text-sm text-[#A1A1A1]">현재 등록된 일정이 없습니다.</p>
          </div>
        )}
      </div>

      {/* Featured Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <CategoryCard
          title="질문 & 토론"
          count={journalPosts.filter(p => p.category === 'question' && books.some(b => b.id === p.book_id)).length}
          icon={MessageSquare}
          color="bg-rose-500"
          description="수학적 개념에 대한 깊이 있는 질문과 통찰을 공유합니다."
          href="/journal"
          className="md:col-span-1 border-rose-100"
        />
        <CategoryCard
          title="수업 아이디어"
          count={journalPosts.filter(p => p.category === 'idea' && books.some(b => b.id === p.book_id)).length}
          icon={Lightbulb}
          color="bg-amber-500"
          description="교실에서 바로 활용할 수 있는 창의적인 수학 수업을 설계합니다."
          href="/journal"
          className="md:col-span-1 border-amber-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Updates */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                <h2 className="text-xl font-bold text-[#37352F]">최근 업데이트</h2>
              </div>
              <Link href="/journal" className="text-sm text-[#787774] hover:text-[#37352F] flex items-center gap-1">
                전체보기 <ChevronRight size={14} />
              </Link>
            </div>

            <div className="space-y-4">
              {recentPosts.length > 0 ? (
                recentPosts.map((post) => (
                  <Link
                    href="/journal"
                    key={post.id}
                    className="block p-5 bg-white border border-[#EBEBEB] rounded-2xl hover:border-blue-100 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 text-[10px] font-bold rounded uppercase",
                          post.category === 'question' ? "bg-rose-50 text-rose-600" :
                            post.category === 'idea' ? "bg-amber-50 text-amber-600" :
                              "bg-blue-50 text-blue-600"
                        )}>
                          {getCategoryLabel(post.category)}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-[#A1A1A1]">
                          <User size={10} /> {getUserName(post.user_id)}
                        </div>
                      </div>
                      <span className="text-[10px] text-[#A1A1A1] flex items-center gap-1">
                        <Clock size={10} /> {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-bold text-[#37352F] mb-2">{post.title}</h4>
                    <p
                      className="text-sm text-[#787774] line-clamp-2 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: post.content.replace(/<[^>]+>/g, '') }}
                    />
                  </Link>
                ))
              ) : (
                <div className="py-20 text-center border-2 border-dashed border-[#F1F1F0] rounded-2xl text-[#A1A1A1]">
                  게시글이 아직 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Current Reading */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
              <h2 className="text-xl font-bold text-[#37352F]">함께 읽는 책</h2>
            </div>

            {currentBook ? (
              <Link href="/books" className="block relative group overflow-hidden rounded-2xl border border-[#EBEBEB] bg-white hover:shadow-lg transition-all duration-300">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={currentBook.cover_url}
                    alt={currentBook.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-white text-xs font-bold">책 상세 보기 →</span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={cn(
                      "px-2 py-0.5 text-[10px] font-bold rounded-full",
                      currentBook.status === 'reading' ? "bg-blue-50 text-blue-600" :
                        currentBook.status === 'completed' ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-600"
                    )}>
                      {currentBook.status === 'reading' ? '읽는 중' :
                        currentBook.status === 'completed' ? '완독' : '읽고 싶은'}
                    </span>
                  </div>
                  <h4 className="font-bold text-[#37352F] text-lg mb-1">{currentBook.title}</h4>
                  <p className="text-xs text-[#787774] mb-3">{currentBook.author}</p>

                  <div className="flex flex-wrap gap-1">
                    {currentBook.tags?.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="text-[10px] bg-gray-100 text-[#787774] px-2 py-0.5 rounded">#{tag}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ) : (
              <div className="p-10 border-2 border-dashed border-[#F1F1F0] rounded-2xl text-center text-[#A1A1A1]">
                <BookOpen size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">서재가 비어있습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All Status Modal */}
      {showAllStatus && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowAllStatus(false)}>
          <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-8 py-6 border-b border-[#EBEBEB] bg-white z-10">
              <h3 className="text-xl font-bold text-[#37352F] flex items-center gap-2">
                <Users className="text-blue-500" />
                전체 멤버 독서 현황
              </h3>
              <button onClick={() => setShowAllStatus(false)} className="p-2 hover:bg-[#F5F5F0] rounded-full">
                <X size={20} className="text-[#A1A1A1]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-[#F9F9F8]">
              <div className="space-y-12">
                {books.map(book => {
                  const bookSchedules = schedules
                    .filter(s => s.book_id === book.id)
                    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

                  if (bookSchedules.length === 0) return null;

                  return (
                    <div key={book.id}>
                      <div className="flex items-center gap-3 mb-5 pl-2">
                        <img src={book.cover_url} alt={book.title} className="w-8 h-12 object-cover rounded shadow-sm" />
                        <h4 className="font-bold text-xl text-[#37352F]">{book.title}</h4>
                      </div>
                      <div className="bg-white border border-[#EBEBEB] rounded-2xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-center border-collapse">
                            <thead>
                              <tr className="bg-[#FBFBFA] border-b border-[#EBEBEB]">
                                <th className="sticky left-0 z-10 bg-[#FBFBFA] p-4 text-left min-w-[120px] font-bold text-[#787774] border-r border-[#EBEBEB]">
                                  멤버
                                </th>
                                {bookSchedules.map(s => (
                                  <th key={s.id} className="p-3 min-w-[100px] font-medium text-[#787774] border-r border-[#EBEBEB] last:border-r-0">
                                    <div className="text-xs mb-1 bg-white inline-block px-2 py-0.5 rounded border border-[#EBEBEB]">
                                      ~ {new Date(s.end_date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                                    </div>
                                    <div className="text-[#37352F] font-bold text-xs">{s.range_text}</div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {users
                                .filter(u => u.name !== 'admin' && u.name !== '관리자')
                                .map(user => (
                                  <tr key={user.id} className="border-b border-[#EBEBEB] hover:bg-[#FDFDFD] transition-colors last:border-b-0">
                                    <td className="sticky left-0 z-10 bg-white p-4 text-left font-bold text-[#37352F] border-r border-[#EBEBEB] flex items-center gap-3 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                      {user.avatar_url ? (
                                        <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full border border-gray-100" />
                                      ) : (
                                        <div className="w-8 h-8 bg-[#F5F5F0] rounded-full flex items-center justify-center text-xs text-[#787774]">
                                          {user.name.charAt(0)}
                                        </div>
                                      )}
                                      <span className="truncate">{user.name}</span>
                                    </td>
                                    {bookSchedules.map(s => {
                                      const completed = trackerRecords.some(r => r.user_id === user.id && r.schedule_id === s.id);
                                      return (
                                        <td key={s.id} className="p-3 border-r border-[#EBEBEB] last:border-r-0 bg-white">
                                          <div className="flex justify-center">
                                            {completed ? (
                                              <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                                <Check size={14} strokeWidth={3} />
                                              </div>
                                            ) : (
                                              <div className="w-6 h-6 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center border border-gray-100">
                                                <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
