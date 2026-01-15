"use client";

import React, { useState } from 'react';
import { BookRegistrationForm } from '@/components/books/BookRegistrationForm';
import { Book } from '@/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useReading } from '@/lib/store';

export default function BooksPage() {
    const { books, addBook, addSchedule, deleteBook } = useReading();
    const [activeTab, setActiveTab] = useState('전체');

    const handleAddBook = async (bookData: any) => {
        const newBook = {
            ...bookData.book,
            status: bookData.status,
            tags: bookData.tags,
            created_at: new Date().toISOString()
        };

        // Add book first and wait for the response with the generated ID
        await addBook(newBook);

        // Wait a moment for the book to be added to the state
        setTimeout(async () => {
            // Get the most recently added book (should be the one we just added)
            const addedBook = books[0];

            // If there are schedules, add them all to the calendar
            if (bookData.schedules && bookData.schedules.length > 0 && addedBook?.id) {
                for (const schedule of bookData.schedules) {
                    await addSchedule({
                        book_id: addedBook.id,
                        book_title: addedBook.title!,
                        book_cover: addedBook.cover_url!,
                        start_date: schedule.start_date,
                        end_date: schedule.end_date,
                        range_text: schedule.range_text || "독서 시작",
                        created_at: new Date().toISOString()
                    });
                }
            }

            const scheduleCount = bookData.schedules?.length || 0;
            alert(`"${bookData.book.title}"이(가) 서재에 추가되었습니다.${scheduleCount > 0 ? ` ${scheduleCount}개의 일정이 캘린더에 등록되었습니다.` : ''}`);
        }, 500);
    };

    const filteredBooks = books.filter(book => {
        if (activeTab === '전체') return true;
        if (activeTab === '읽는 중') return book.status === 'reading';
        if (activeTab === '완독') return book.status === 'completed';
        if (activeTab === '읽고 싶은') return book.status === 'want';
        return true;
    });

    return (
        <div className="max-w-[1200px] mx-auto px-6 py-10 md:px-12 md:py-16">
            <div className="mb-10">
                <h1 className="text-4xl font-bold text-[#37352F] mb-2">서재</h1>
                <p className="text-[#787774]">읽고 있는 책을 관리하고 새로운 수학 도서를 찾아보세요.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1">
                    <BookRegistrationForm onAddBook={handleAddBook} />
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-white border border-[#EBEBEB] rounded-xl p-6 min-h-[500px]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-[#37352F]">내 서재 ({filteredBooks.length})</h2>
                            <div className="flex gap-2">
                                {['전체', '읽는 중', '완독', '읽고 싶은'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={cn(
                                            "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                                            activeTab === tab ? "bg-[#37352F] text-white" : "text-[#787774] hover:bg-[#F1F1F0]"
                                        )}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filteredBooks.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center text-[#A1A1A1] border-2 border-dashed border-[#F1F1F0] rounded-xl">
                                <p>아직 등록된 책이 없습니다.</p>
                                <p className="text-sm">왼쪽 폼에서 책을 검색해 추가해 보세요.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                {filteredBooks.map((book) => (
                                    <div key={book.id} className="group cursor-pointer relative">
                                        <Link href={`/journal?bookId=${book.id}`} className="block">
                                            <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-[#EBEBEB] mb-3 transition-all group-hover:shadow-md group-hover:-translate-y-1">
                                                <img
                                                    src={book.cover_url}
                                                    alt={book.title}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className={cn(
                                                    "absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold text-white rounded shadow-sm",
                                                    book.status === 'reading' ? "bg-blue-500" :
                                                        book.status === 'completed' ? "bg-green-500" : "bg-amber-500"
                                                )}>
                                                    {book.status === 'reading' ? '읽는 중' :
                                                        book.status === 'completed' ? '완독' : '읽고 싶은'}
                                                </div>
                                            </div>
                                            <h4 className="text-sm font-bold text-[#37352F] line-clamp-1 mb-1">{book.title}</h4>
                                            <p className="text-[11px] text-[#A1A1A1]">{book.author}</p>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {book.tags?.map((tag: string) => (
                                                    <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-[#FBFBFA] border border-[#EBEBEB] text-[#787774] rounded">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </Link>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                window.location.href = `/books/${book.id}`;
                                            }}
                                            className="absolute top-2 left-2 p-1.5 bg-blue-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600 z-10"
                                            title="수정"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (confirm(`"${book.title}"을(를) 서재에서 삭제하시겠습니까?`)) {
                                                    deleteBook(book.id!);
                                                }
                                            }}
                                            className="absolute top-2 left-10 p-1.5 bg-rose-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 z-10"
                                            title="삭제"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 6h18"></path>
                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                            </svg>
                                        </button>
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
