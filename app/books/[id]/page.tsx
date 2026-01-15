"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Plus, X, Edit2, Check, Trash2 } from 'lucide-react';
import { useReading } from '@/lib/store';
import { cn } from '@/lib/utils';
import { SUBJECT_TAGS } from '@/lib/aladdin/mockApi';

export default function BookDetailPage() {
    const params = useParams();
    const router = useRouter();
    const bookId = (params?.id as string) || '';

    const { books, schedules, updateBook, addSchedule, updateSchedule, deleteSchedule } = useReading();

    const book = books.find(b => b.id === bookId);
    const bookSchedules = schedules.filter(s => s.book_id === bookId);

    const [isEditingStatus, setIsEditingStatus] = useState(false);
    const [isEditingTags, setIsEditingTags] = useState(false);
    const [isAddingSchedule, setIsAddingSchedule] = useState(false);
    const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

    // Schedule form states
    const [newSchedules, setNewSchedules] = useState<{ start_date: string; end_date: string; range_text: string; }[]>([
        { start_date: '', end_date: '', range_text: '' }
    ]);

    if (!book) {
        return (
            <div className="max-w-[1200px] mx-auto px-6 py-10 md:px-12 md:py-16">
                <div className="text-center py-20">
                    <p className="text-[#A1A1A1] mb-4">책을 찾을 수 없습니다.</p>
                    <Link href="/books" className="text-blue-600 hover:underline">서재로 돌아가기</Link>
                </div>
            </div>
        );
    }

    const handleStatusChange = (newStatus: 'want' | 'reading' | 'completed') => {
        updateBook(bookId, { status: newStatus });
        setIsEditingStatus(false);
    };

    const handleTagToggle = (tag: string) => {
        const currentTags = book.tags || [];
        const newTags = currentTags.includes(tag)
            ? currentTags.filter(t => t !== tag)
            : [...currentTags, tag];
        updateBook(bookId, { tags: newTags });
    };

    const addScheduleField = () => {
        setNewSchedules(prev => [...prev, { start_date: '', end_date: '', range_text: '' }]);
    };

    const removeScheduleField = (index: number) => {
        setNewSchedules(prev => prev.filter((_, i) => i !== index));
    };

    const updateScheduleField = (index: number, field: string, value: string) => {
        setNewSchedules(prev => prev.map((s, i) =>
            i === index ? { ...s, [field]: value } : s
        ));
    };

    const handleAddSchedules = () => {
        const validSchedules = newSchedules.filter(s => s.start_date && s.end_date);
        validSchedules.forEach(schedule => {
            addSchedule({
                id: Math.random().toString(36).substr(2, 9),
                book_id: bookId,
                book_title: book.title!,
                book_cover: book.cover_url!,
                start_date: schedule.start_date,
                end_date: schedule.end_date,
                range_text: schedule.range_text || "독서 시작",
                created_at: new Date().toISOString()
            });
        });
        setNewSchedules([{ start_date: '', end_date: '', range_text: '' }]);
        setIsAddingSchedule(false);
    };

    const handleDeleteSchedule = (scheduleId: string) => {
        if (confirm('이 일정을 삭제하시겠습니까?')) {
            deleteSchedule(scheduleId);
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto px-6 py-10 md:px-12 md:py-16">
            <Link href="/books" className="flex items-center gap-1 text-sm text-[#787774] hover:text-[#37352F] mb-6 transition-colors">
                <ChevronLeft size={16} /> 서재로 돌아가기
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Book Info */}
                <div className="lg:col-span-1">
                    <div className="bg-white border border-[#EBEBEB] rounded-xl p-6 sticky top-6">
                        <img
                            src={book.cover_url}
                            alt={book.title}
                            className="w-full aspect-[3/4] object-cover rounded-lg shadow-md mb-4"
                        />
                        <h1 className="text-2xl font-bold text-[#37352F] mb-2">{book.title}</h1>
                        <p className="text-sm text-[#787774] mb-1">{book.author}</p>
                        <p className="text-xs text-[#A1A1A1] mb-4">{book.publisher}</p>

                        {book.description && (
                            <p className="text-xs text-[#787774] leading-relaxed mb-4 p-3 bg-[#FBFBFA] rounded border border-[#EBEBEB]">
                                {book.description}
                            </p>
                        )}

                        {/* Status */}
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-[#787774] mb-2 uppercase tracking-wider">독서 상태</label>
                            {!isEditingStatus ? (
                                <div className="flex items-center justify-between">
                                    <span className={cn(
                                        "px-3 py-1.5 text-sm font-bold rounded",
                                        book.status === 'reading' ? "bg-blue-100 text-blue-700" :
                                            book.status === 'completed' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                    )}>
                                        {book.status === 'reading' ? '읽는 중' :
                                            book.status === 'completed' ? '완독' : '읽고 싶은'}
                                    </span>
                                    <button
                                        onClick={() => setIsEditingStatus(true)}
                                        className="text-xs text-blue-600 hover:underline"
                                    >
                                        변경
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {[
                                        { id: 'want', label: '읽고 싶은', color: 'bg-amber-100 text-amber-700' },
                                        { id: 'reading', label: '읽는 중', color: 'bg-blue-100 text-blue-700' },
                                        { id: 'completed', label: '완독', color: 'bg-green-100 text-green-700' }
                                    ].map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleStatusChange(item.id as any)}
                                            className={cn(
                                                "w-full py-2 px-3 rounded text-sm font-bold transition-all border",
                                                book.status === item.id
                                                    ? `${item.color} border-current`
                                                    : "bg-white text-[#787774] border-[#EBEBEB] hover:bg-[#F9F9F8]"
                                            )}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setIsEditingStatus(false)}
                                        className="w-full py-1 text-xs text-[#787774] hover:text-[#37352F]"
                                    >
                                        취소
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Tags */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-bold text-[#787774] uppercase tracking-wider">과목 태그</label>
                                <button
                                    onClick={() => setIsEditingTags(!isEditingTags)}
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    {isEditingTags ? '완료' : '편집'}
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {isEditingTags ? (
                                    SUBJECT_TAGS.map((tag) => (
                                        <button
                                            key={tag}
                                            onClick={() => handleTagToggle(tag)}
                                            className={cn(
                                                "px-2 py-1 rounded text-xs transition-all border",
                                                book.tags?.includes(tag)
                                                    ? "bg-[#37352F] text-white border-[#37352F]"
                                                    : "bg-white text-[#787774] border-[#EBEBEB] hover:border-[#37352F]"
                                            )}
                                        >
                                            {tag}
                                        </button>
                                    ))
                                ) : (
                                    book.tags && book.tags.length > 0 ? (
                                        book.tags.map((tag: string) => (
                                            <span key={tag} className="px-2 py-1 bg-[#FBFBFA] border border-[#EBEBEB] text-[#787774] rounded text-xs">
                                                {tag}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-[#A1A1A1]">태그 없음</span>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Schedules */}
                <div className="lg:col-span-2">
                    <div className="bg-white border border-[#EBEBEB] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-[#37352F]">독서 일정</h2>
                            <button
                                onClick={() => setIsAddingSchedule(!isAddingSchedule)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#37352F] text-white rounded-lg text-sm font-bold hover:bg-black transition-all"
                            >
                                <Plus size={16} /> 일정 추가
                            </button>
                        </div>

                        {isAddingSchedule && (
                            <div className="mb-6 p-4 bg-blue-50/30 rounded-xl border border-blue-100 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider">새 일정 추가</h4>
                                    <button
                                        type="button"
                                        onClick={addScheduleField}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        + 일정 추가
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {newSchedules.map((schedule, index) => (
                                        <div key={index} className="p-3 bg-white rounded-lg border border-blue-100 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-blue-600">일정 {index + 1}</span>
                                                {newSchedules.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeScheduleField(index)}
                                                        className="text-rose-500 hover:text-rose-700"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-[10px] text-[#A1A1A1] mb-1">시작일</label>
                                                    <input
                                                        type="date"
                                                        className="w-full p-2 bg-white border border-[#EBEBEB] rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                                        value={schedule.start_date}
                                                        onChange={(e) => updateScheduleField(index, 'start_date', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-[#A1A1A1] mb-1">종료일</label>
                                                    <input
                                                        type="date"
                                                        className="w-full p-2 bg-white border border-[#EBEBEB] rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                                        value={schedule.end_date}
                                                        onChange={(e) => updateScheduleField(index, 'end_date', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-[#A1A1A1] mb-1">목표 (예: 1부까지, 3장까지)</label>
                                                <input
                                                    type="text"
                                                    placeholder="독서 계획을 입력하세요"
                                                    className="w-full p-2 bg-white border border-[#EBEBEB] rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                                    value={schedule.range_text}
                                                    onChange={(e) => updateScheduleField(index, 'range_text', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleAddSchedules}
                                        className="flex-1 py-2 bg-blue-500 text-white rounded text-sm font-bold hover:bg-blue-600 transition-all"
                                    >
                                        저장
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsAddingSchedule(false);
                                            setNewSchedules([{ start_date: '', end_date: '', range_text: '' }]);
                                        }}
                                        className="px-4 py-2 bg-gray-200 text-[#787774] rounded text-sm font-medium hover:bg-gray-300 transition-all"
                                    >
                                        취소
                                    </button>
                                </div>
                            </div>
                        )}

                        {bookSchedules.length === 0 ? (
                            <div className="py-16 text-center text-[#A1A1A1] border-2 border-dashed border-[#F1F1F0] rounded-xl">
                                <p>등록된 독서 일정이 없습니다.</p>
                                <p className="text-sm mt-2">위의 버튼을 눌러 일정을 추가해보세요.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {bookSchedules.map((schedule) => (
                                    <div key={schedule.id} className="p-4 bg-[#FBFBFA] border border-[#EBEBEB] rounded-lg hover:shadow-sm transition-all">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-sm font-bold text-[#37352F]">{schedule.range_text}</span>
                                                </div>
                                                <div className="text-xs text-[#787774]">
                                                    {new Date(schedule.start_date).toLocaleDateString('ko-KR')} - {new Date(schedule.end_date).toLocaleDateString('ko-KR')}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteSchedule(schedule.id)}
                                                className="p-1.5 hover:bg-rose-100 rounded text-rose-600 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
