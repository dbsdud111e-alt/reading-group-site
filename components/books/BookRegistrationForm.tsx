"use client";

import React, { useState } from 'react';
import { Search, Loader2, Book as BookIcon, Plus, X } from 'lucide-react';
import { searchBooks, SUBJECT_TAGS } from '@/lib/aladdin/mockApi';
import { Book } from '@/types';
import { cn } from '@/lib/utils';

interface BookRegistrationFormProps {
    onAddBook: (bookData: {
        book: Partial<Book>;
        status: Book['status'];
        tags: string[];
        schedules?: { start_date: string; end_date: string; range_text: string; }[]
    }) => void;
}

export function BookRegistrationForm({ onAddBook }: BookRegistrationFormProps) {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<Partial<Book>[]>([]);
    const [selectedBook, setSelectedBook] = useState<Partial<Book> | null>(null);
    const [status, setStatus] = useState<Book['status']>('want');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // Schedule states - now an array
    const [schedules, setSchedules] = useState<{ start_date: string; end_date: string; range_text: string; }[]>([
        { start_date: '', end_date: '', range_text: '' }
    ]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query) return;

        setIsSearching(true);
        try {
            const data = await searchBooks(query);
            setResults(data);
        } finally {
            setIsSearching(false);
        }
    };

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const addSchedule = () => {
        setSchedules(prev => [...prev, { start_date: '', end_date: '', range_text: '' }]);
    };

    const removeSchedule = (index: number) => {
        setSchedules(prev => prev.filter((_, i) => i !== index));
    };

    const updateSchedule = (index: number, field: string, value: string) => {
        setSchedules(prev => prev.map((s, i) =>
            i === index ? { ...s, [field]: value } : s
        ));
    };

    const handleSubmit = () => {
        if (!selectedBook) return;

        const validSchedules = schedules.filter(s => s.start_date && s.end_date);

        onAddBook({
            book: selectedBook,
            status,
            tags: selectedTags,
            schedules: status === 'reading' && validSchedules.length > 0 ? validSchedules : undefined
        });

        // Reset form
        setSelectedBook(null);
        setResults([]);
        setQuery('');
        setSelectedTags([]);
        setStatus('want');
        setSchedules([{ start_date: '', end_date: '', range_text: '' }]);
    };

    return (
        <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden">
            <div className="p-6 border-b border-[#EBEBEB]">
                <h2 className="text-xl font-bold text-[#37352F] mb-4">도서 등록</h2>

                <form onSubmit={handleSearch} className="relative">
                    <input
                        type="text"
                        placeholder="책 제목 또는 저자 검색"
                        className="w-full pl-10 pr-4 py-2 bg-[#FBFBFA] border border-[#EBEBEB] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 text-[#A1A1A1]" size={18} />
                    <button
                        type="submit"
                        className="absolute right-2 top-1.5 px-3 py-1 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
                        disabled={isSearching}
                    >
                        {isSearching ? <Loader2 size={14} className="animate-spin" /> : "검색"}
                    </button>
                </form>
            </div>

            <div className="p-6 space-y-8">
                {/* Search Results */}
                {results.length > 0 && !selectedBook && (
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-[#787774] uppercase tracking-wider">검색 결과</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {results.map((book, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedBook(book)}
                                    className="flex items-center gap-4 p-3 border border-[#EBEBEB] rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                                >
                                    <img src={book.cover_url} alt={book.title} className="w-10 h-14 object-cover rounded shadow-sm" />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-[#37352F] text-sm truncate">{book.title}</div>
                                        <div className="text-xs text-[#787774]">{book.author} | {book.publisher}</div>
                                    </div>
                                    <Plus size={18} className="text-[#A1A1A1] group-hover:text-blue-500 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Selected Book & Detail Form */}
                {selectedBook && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex gap-6 mb-8 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                            <img src={selectedBook.cover_url} alt={selectedBook.title} className="w-24 h-32 object-cover rounded-lg shadow-md" />
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-bold text-[#37352F]">{selectedBook.title}</h3>
                                    <button onClick={() => setSelectedBook(null)} className="text-xs text-[#A1A1A1] hover:text-rose-500 underline">변경</button>
                                </div>
                                <p className="text-sm text-[#787774] mb-2">{selectedBook.author} | {selectedBook.publisher}</p>
                                <div className="text-xs text-[#787774] line-clamp-2 bg-white/50 p-2 rounded border border-blue-100/50 italic">{selectedBook.description}</div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Status Selection */}
                            <div>
                                <label className="block text-sm font-bold text-[#37352F] mb-3">독서 상태</label>
                                <div className="flex gap-2">
                                    {[
                                        { id: 'want', label: '읽고 싶은 책', color: 'bg-amber-100 text-amber-700' },
                                        { id: 'reading', label: '읽는 중', color: 'bg-blue-100 text-blue-700' },
                                        { id: 'completed', label: '완독', color: 'bg-green-100 text-green-700' }
                                    ].map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setStatus(item.id as any)}
                                            className={cn(
                                                "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all border",
                                                status === item.id
                                                    ? `${item.color} border-current shadow-sm`
                                                    : "bg-white text-[#787774] border-[#EBEBEB] hover:bg-[#F9F9F8]"
                                            )}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Reading Plan Section (Visible only when 'reading' is selected) */}
                            {status === 'reading' && (
                                <div className="p-4 bg-blue-50/30 rounded-xl border border-blue-100 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider">독서 일정 계획</h4>
                                        <button
                                            type="button"
                                            onClick={addSchedule}
                                            className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white text-[10px] font-bold rounded hover:bg-blue-600 transition-colors"
                                        >
                                            <Plus size={12} /> 일정 추가
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {schedules.map((schedule, index) => (
                                            <div key={index} className="p-3 bg-white rounded-lg border border-blue-100 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-blue-600">일정 {index + 1}</span>
                                                    {schedules.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeSchedule(index)}
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
                                                            onChange={(e) => updateSchedule(index, 'start_date', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] text-[#A1A1A1] mb-1">종료일</label>
                                                        <input
                                                            type="date"
                                                            className="w-full p-2 bg-white border border-[#EBEBEB] rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                                            value={schedule.end_date}
                                                            onChange={(e) => updateSchedule(index, 'end_date', e.target.value)}
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
                                                        onChange={(e) => updateSchedule(index, 'range_text', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Math Subject Tags */}
                            <div>
                                <label className="block text-sm font-bold text-[#37352F] mb-3">과목 태그</label>
                                <div className="flex flex-wrap gap-2">
                                    {SUBJECT_TAGS.map((tag) => (
                                        <button
                                            key={tag}
                                            onClick={() => toggleTag(tag)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-full text-xs transition-all border",
                                                selectedTags.includes(tag)
                                                    ? "bg-[#37352F] text-white border-[#37352F] shadow-sm"
                                                    : "bg-white text-[#787774] border-[#EBEBEB] hover:border-[#37352F]"
                                            )}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                className="w-full py-3 bg-[#37352F] text-white rounded-lg font-bold hover:bg-black transition-all shadow-md active:scale-[0.98]"
                            >
                                서재에 추가하기
                            </button>
                        </div>
                    </div>
                )}

                {!selectedBook && results.length === 0 && (
                    <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                        <BookIcon size={48} className="mb-4 text-[#A1A1A1]" />
                        <p className="text-sm text-[#787774]">책을 검색하여 수업 아이디어를 기록할 서재를 채워보세요.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
