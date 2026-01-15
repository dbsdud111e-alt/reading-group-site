"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Edit2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReading } from '@/lib/store';
import { Schedule } from '@/types';

export default function CalendarPage() {
    const { schedules, books, updateSchedule } = useReading();
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [editingSchedule, setEditingSchedule] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

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
                                const isToday = day === 12;
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
        </div>
    );
}
