"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Edit2, Check, CheckCircle, Circle, Users, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReading } from '@/lib/store';
import { Schedule } from '@/types';

export default function CalendarPage() {
    const { schedules, books, updateSchedule, trackerRecords, toggleTrackerCompletion, users, currentUser } = useReading();
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [editingSchedule, setEditingSchedule] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [showAllStatus, setShowAllStatus] = useState(false);

    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const startDay = 3; // Wednesday

    const getSchedulesForDate = (day: number) => {
        const dateStr = `2026-01-${String(day).padStart(2, '0')}`;
        return schedules.filter(s => {
            const bookExists = books.some(b => b.id === s.book_id);
            const start = new Date(s.start_date);
            const end = new Date(s.end_date);
            const current = new Date(dateStr);
            return bookExists && current >= start && current <= end;
        });
    };

    const handleDateClick = (day: number) => {
        const dateStr = `2026-01-${String(day).padStart(2, '0')}`;
        setSelectedDate(dateStr);
    };

    const selectedSchedules = selectedDate ? schedules.filter(s => {
        const bookExists = books.some(b => b.id === s.book_id);
        const start = new Date(s.start_date);
        const end = new Date(s.end_date);
        const current = new Date(selectedDate);
        return bookExists && current >= start && current <= end;
    }) : [];

    const handleEditSchedule = (schedule: Schedule) => {
        setEditingSchedule(schedule.id);
        setEditText(schedule.range_text);
    };

    const handleSaveEdit = (scheduleId: string) => {
        updateSchedule(scheduleId, { range_text: editText });
        setEditingSchedule(null);
    };

    return (
        <div className="max-w-[1200px] mx-auto px-6 py-10 md:px-12 md:py-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-bold text-[#37352F] mb-2">캘린더</h1>
                    <p className="text-[#787774]">모임원들의 독서 진도와 학부 일정을 한눈에 확인하세요.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white border border-[#EBEBEB] rounded-lg overflow-hidden">
                        <button className="p-2 hover:bg-[#F1F1F0] transition-colors"><ChevronLeft size={18} /></button>
                        <div className="px-4 py-2 text-sm font-bold border-x border-[#EBEBEB]">2026년 1월</div>
                        <button className="p-2 hover:bg-[#F1F1F0] transition-colors"><ChevronRight size={18} /></button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-white border border-[#EBEBEB] rounded-2xl overflow-hidden shadow-sm">
                        {/* Calendar Header */}
                        <div className="grid grid-cols-7 bg-[#FBFBFA] border-b border-[#EBEBEB]">
                            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                                <div key={d} className={cn(
                                    "p-4 text-center text-xs font-bold",
                                    i === 0 ? "text-rose-500" : i === 6 ? "text-blue-500" : "text-[#787774]"
                                )}>
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Body */}
                        <div className="grid grid-cols-7 auto-rows-[120px]">
                            {Array.from({ length: startDay }).map((_, i) => (
                                <div key={`empty-${i}`} className="border-r border-b border-[#EBEBEB] bg-[#FBFBFA]/30" />
                            ))}
                            {days.map((day) => {
                                const daySchedules = getSchedulesForDate(day);
                                const currentData = new Date();
                                const isToday = day === currentData.getDate() &&
                                    currentData.getMonth() === 0 && // January (0-indexed)
                                    currentData.getFullYear() === 2026;
                                return (
                                    <div
                                        key={day}
                                        onClick={() => handleDateClick(day)}
                                        className="p-2 border-r border-b border-[#EBEBEB] hover:bg-[#F9F9F8] transition-colors relative group cursor-pointer"
                                    >
                                        <span className={cn(
                                            "text-sm font-medium block text-center mb-2",
                                            isToday ? "w-6 h-6 flex items-center justify-center bg-blue-500 text-white rounded-full mx-auto" : "text-[#37352F]"
                                        )}>
                                            {day}
                                        </span>

                                        {/* Display schedules */}
                                        <div className="space-y-1">
                                            {daySchedules.slice(0, 2).map((schedule) => (
                                                <div
                                                    key={schedule.id}
                                                    className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded truncate"
                                                >
                                                    📖 {schedule.range_text}
                                                </div>
                                            ))}
                                            {daySchedules.length > 2 && (
                                                <div className="text-[9px] text-[#A1A1A1] text-center">+{daySchedules.length - 2}개</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Selected Date Details */}
                <div className="lg:col-span-1">
                    <div className="bg-white border border-[#EBEBEB] rounded-2xl p-6 sticky top-6">
                        {selectedDate ? (
                            <>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-[#37352F]">
                                        {new Date(selectedDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                                    </h3>
                                    <button onClick={() => setSelectedDate(null)} className="p-1 hover:bg-[#F1F1F0] rounded">
                                        <X size={16} className="text-[#A1A1A1]" />
                                    </button>
                                </div>

                                {selectedSchedules.length === 0 ? (
                                    <div className="py-8 text-center text-[#A1A1A1] text-sm">
                                        이 날짜에 등록된 일정이 없습니다.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {selectedSchedules.map((schedule) => (
                                            <div key={schedule.id} className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                                <div className="flex items-start gap-3 mb-3">
                                                    <img
                                                        src={schedule.book_cover}
                                                        alt={schedule.book_title}
                                                        className="w-12 h-16 object-cover rounded shadow-sm"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold text-[#37352F] line-clamp-2 mb-1">
                                                            {schedule.book_title}
                                                        </h4>
                                                        <p className="text-[10px] text-[#787774]">
                                                            {new Date(schedule.start_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} - {new Date(schedule.end_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>

                                                {editingSchedule === schedule.id ? (
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={editText}
                                                            onChange={(e) => setEditText(e.target.value)}
                                                            className="flex-1 px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            autoFocus
                                                        />
                                                        <button
                                                            onClick={() => handleSaveEdit(schedule.id)}
                                                            className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingSchedule(null)}
                                                            className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between bg-white/70 px-3 py-2 rounded border border-blue-100">
                                                        <span className="text-xs text-blue-700 font-medium">📝 {schedule.range_text}</span>
                                                        <button
                                                            onClick={() => handleEditSchedule(schedule)}
                                                            className="p-1 hover:bg-blue-100 rounded transition-colors"
                                                        >
                                                            <Edit2 size={12} className="text-blue-600" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="py-12 text-center text-[#A1A1A1]">
                                <p className="text-sm mb-2">날짜를 선택하세요</p>
                                <p className="text-xs">독서 일정을 확인하고 수정할 수 있습니다.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Reading Tracker Section */}
            <div className="mt-16 border-t border-[#EBEBEB] pt-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-[#37352F] flex items-center gap-2">
                            <CheckCircle className="text-green-500" />
                            나의 독서 트래커
                        </h2>
                        <p className="text-[#787774] mt-1 text-sm">일정별 독서 완료 현황을 체크하세요.</p>
                    </div>
                    <button
                        onClick={() => setShowAllStatus(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#F5F5F0] hover:bg-[#EBEBEB] text-[#37352F] text-xs font-bold rounded-lg transition-colors"
                    >
                        <Users size={14} />
                        전체 독서현황 보기
                    </button>
                </div>

                <div className="space-y-8">
                    {books.map(book => {
                        const bookSchedules = schedules
                            .filter(s => s.book_id === book.id)
                            .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

                        if (bookSchedules.length === 0) return null;

                        return (
                            <div key={book.id} className="bg-white border border-[#EBEBEB] rounded-2xl overflow-hidden shadow-sm">
                                <div className="p-4 bg-[#FBFBFA] border-b border-[#EBEBEB] flex items-center gap-3">
                                    <img src={book.cover_url} alt={book.title} className="w-10 h-14 object-cover rounded border border-[#EBEBEB]" />
                                    <h3 className="font-bold text-[#37352F]">{book.title}</h3>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {bookSchedules.map(schedule => {
                                        const isCompleted = trackerRecords.some(r => r.user_id === currentUser?.id && r.schedule_id === schedule.id);
                                        return (
                                            <button
                                                key={schedule.id}
                                                onClick={() => toggleTrackerCompletion(schedule.id)}
                                                className={cn(
                                                    "flex items-center justify-between p-4 rounded-xl border transition-all text-left group",
                                                    isCompleted
                                                        ? "bg-[#C1E1C1]/30 border-[#C1E1C1] hover:bg-[#C1E1C1]/50" // Pastel Green
                                                        : "bg-white border-[#EBEBEB] hover:border-blue-300 hover:shadow-sm"
                                                )}
                                            >
                                                <div className="flex-1 min-w-0 mr-3">
                                                    <div className="text-xs font-bold text-[#787774] mb-1">
                                                        {new Date(schedule.end_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}까지
                                                    </div>
                                                    <div className={cn("font-bold truncate", isCompleted ? "text-green-800" : "text-[#37352F]")}>
                                                        {schedule.range_text}
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors",
                                                    isCompleted
                                                        ? "bg-[#C1E1C1] border-[#C1E1C1] text-green-700"
                                                        : "border-[#EBEBEB] group-hover:border-blue-300"
                                                )}>
                                                    {isCompleted && <Check size={14} strokeWidth={3} />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                    {schedules.length === 0 && (
                        <div className="text-center py-12 text-[#A1A1A1] border-2 border-dashed border-[#F1F1F0] rounded-2xl">
                            등록된 일정이 없습니다.
                        </div>
                    )}
                </div>
            </div>

            {/* All Status Modal */}
            {showAllStatus && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowAllStatus(false)}>
                    <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-8 py-6 border-b border-[#EBEBEB]">
                            <h3 className="text-xl font-bold text-[#37352F] flex items-center gap-2">
                                <Users className="text-blue-500" />
                                전체 멤버 독서 현황
                            </h3>
                            <button onClick={() => setShowAllStatus(false)} className="p-2 hover:bg-[#F5F5F0] rounded-full">
                                <X size={20} className="text-[#A1A1A1]" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 bg-[#F9F9F8]">
                            <div className="space-y-10">
                                {books.map(book => {
                                    const bookSchedules = schedules
                                        .filter(s => s.book_id === book.id)
                                        .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

                                    if (bookSchedules.length === 0) return null;

                                    return (
                                        <div key={book.id}>
                                            <div className="flex items-center gap-3 mb-4">
                                                <img src={book.cover_url} alt={book.title} className="w-8 h-12 object-cover rounded shadow-sm" />
                                                <h4 className="font-bold text-lg text-[#37352F]">{book.title}</h4>
                                            </div>
                                            <div className="bg-white border border-[#EBEBEB] rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="bg-[#FBFBFA] border-b border-[#EBEBEB] text-[#787774] font-medium">
                                                        <tr>
                                                            <th className="px-6 py-4 w-32 sticky left-0 bg-[#FBFBFA] border-r border-[#EBEBEB]">멤버</th>
                                                            {bookSchedules.map(s => (
                                                                <th key={s.id} className="px-4 py-3 min-w-[120px] text-center whitespace-nowrap">
                                                                    <div>{s.range_text}</div>
                                                                    <div className="text-[10px] font-normal mt-0.5">
                                                                        ~ {new Date(s.end_date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                                                                    </div>
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[#EBEBEB]">
                                                        {users.map(user => (
                                                            <tr key={user.id} className="hover:bg-[#F9F9F8]">
                                                                <td className="px-6 py-4 font-bold text-[#37352F] sticky left-0 bg-white border-r border-[#EBEBEB] flex items-center gap-2">
                                                                    {user.avatar_url ? (
                                                                        <img src={user.avatar_url} alt={user.name} className="w-6 h-6 rounded-full" />
                                                                    ) : (
                                                                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px] text-gray-500">
                                                                            {user.name.charAt(0)}
                                                                        </div>
                                                                    )}
                                                                    <span className="truncate max-w-[80px]">{user.name}</span>
                                                                </td>
                                                                {bookSchedules.map(s => {
                                                                    const completed = trackerRecords.some(r => r.user_id === user.id && r.schedule_id === s.id);
                                                                    return (
                                                                        <td key={s.id} className="px-4 py-3 text-center">
                                                                            {completed ? (
                                                                                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600">
                                                                                    <Check size={14} strokeWidth={3} />
                                                                                </div>
                                                                            ) : (
                                                                                <div className="inline-block w-1.5 h-1.5 rounded-full bg-[#EBEBEB]" />
                                                                            )}
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
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
