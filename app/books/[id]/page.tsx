"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Plus, X, Edit2, Check, Trash2, HelpCircle, Lightbulb, List, Heart, User, MessageSquare, BookOpen, FileText, Link as LinkIcon, Send, ImageIcon } from 'lucide-react';
import { useReading, JournalPost } from '@/lib/store';
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

    // Journal/Record states
    const [isWriting, setIsWriting] = useState(false);
    const [editingPost, setEditingPost] = useState<string | null>(null);
    const [viewingPostId, setViewingPostId] = useState<string | null>(null);
    const [content, setContent] = useState('');
    const [materialStatus, setMaterialStatus] = useState<'draft' | 'finished'>('draft');
    const [formMaterialTags, setFormMaterialTags] = useState<string[]>([]);
    const [links, setLinks] = useState<string[]>(['']);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const editorRef = React.useRef<HTMLDivElement>(null);

    const { users, journalPosts, addJournalPost, updateJournalPost, deleteJournalPost, addComment, deleteComment, materialTags } = useReading();
    const bookPosts = journalPosts.filter(p => p.book_id === bookId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const categories = [
        { id: 'question', label: '질문', icon: HelpCircle, color: 'text-rose-600' },
        { id: 'idea', label: '수업 아이디어 및 콘텐츠', icon: Lightbulb, color: 'text-amber-600' },
        { id: 'memo', label: '메모 및 요약정리', icon: List, color: 'text-gray-600' },
        { id: 'feeling', label: '느낀점', icon: Heart, color: 'text-green-600' },
    ];

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

    const handleWriteSubmit = async () => {
        const editorHtml = editorRef.current?.innerHTML || '';
        const editorText = editorRef.current?.innerText || '';

        if (!editorText.trim() && !editorHtml.includes('<img')) {
            alert('내용을 입력해주세요.');
            return;
        }

        if (!currentUser) {
            alert('로그인이 필요합니다.');
            return;
        }

        const textLines = editorText.split('\n').filter(l => l.trim() !== '');
        const extractedTitle = textLines[0]?.trim() || '제목 없음';

        const validLinks = links.filter(link => link.trim() !== '');
        const fileData = uploadedFiles.map(file => ({ url: URL.createObjectURL(file), name: file.name }));

        if (editingPost) {
            updateJournalPost(editingPost, {
                title: extractedTitle,
                content: editorHtml,
                links: validLinks.length > 0 ? validLinks : undefined,
                files: fileData.length > 0 ? fileData : undefined,
                material_status: materialStatus,
                material_tags: formMaterialTags,
            });
        } else {
            addJournalPost({
                id: '',
                user_id: currentUser.id,
                book_id: bookId,
                category: 'memo', // Default for bookshelf record
                title: extractedTitle,
                content: editorHtml,
                links: validLinks.length > 0 ? validLinks : undefined,
                files: fileData.length > 0 ? fileData : undefined,
                material_status: materialStatus,
                material_tags: formMaterialTags,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
        }

        setIsWriting(false);
        setEditingPost(null);
        setContent('');
        setLinks(['']);
    };

    const getUserName = (userId: string) => {
        const storeUser = users.find(u => u.id === userId);
        return storeUser ? storeUser.name : '익명';
    };

    const { currentUser } = useReading();

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

                {/* Records Section */}
                <div className="bg-white border border-[#EBEBEB] rounded-xl p-6 mt-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-[#37352F]">독서 기록 ({bookPosts.length})</h2>
                        <button
                            onClick={() => {
                                setEditingPost(null);
                                setContent('');
                                setMaterialStatus('draft');
                                setIsWriting(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-[#37352F] text-white rounded-lg text-sm font-bold hover:bg-black transition-all shadow-sm"
                        >
                            <Plus size={16} /> 기록 작성
                        </button>
                    </div>

                    {bookPosts.length === 0 ? (
                        <div className="py-12 text-center text-[#A1A1A1] border-2 border-dashed border-[#F1F1F0] rounded-xl">
                            <p>아직 작성된 기록이 없습니다.</p>
                            <p className="text-sm mt-2">이 책에 대한 소중한 생각을 남겨보세요.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {bookPosts.map((post) => (
                                <div key={post.id} className="p-4 bg-[#FBFBFA] border border-[#EBEBEB] rounded-xl hover:shadow-md transition-all cursor-pointer group" onClick={() => setViewingPostId(post.id)}>
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="font-bold text-[#37352F] group-hover:text-blue-600 transition-colors">{post.title}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-[#A1A1A1]">{new Date(post.created_at).toLocaleDateString()}</span>
                                                <span className="text-[10px] font-bold text-[#37352F]">{getUserName(post.user_id)}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            {currentUser?.id === post.user_id && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingPost(post.id);
                                                        setContent(post.content);
                                                        setIsWriting(true);
                                                    }}
                                                    className="p-1 text-[#A1A1A1] hover:text-blue-500"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-xs text-[#787774] line-clamp-2" dangerouslySetInnerHTML={{ __html: post.content }} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>


            {/* Write Modal */}
            {
                isWriting && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <div className="w-full max-w-4xl max-h-[90vh] bg-[#FFFEF9] rounded-[32px] shadow-2xl overflow-y-auto p-8 md:p-12 relative">
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#F5E6D3]">
                                <h2 className="text-2xl font-black text-[#37352F]">{editingPost ? '기록 수정' : '새로운 독서 기록'}</h2>
                                <button onClick={() => setIsWriting(false)} className="p-2 hover:bg-rose-50 rounded-xl text-rose-500 transition-all">
                                    <X size={24} />
                                </button>
                            </div>

                            <div
                                ref={editorRef}
                                contentEditable
                                onInput={(e) => setContent(e.currentTarget.innerHTML)}
                                className="w-full min-h-[300px] max-h-[500px] bg-white border border-[#F5E6D3] rounded-2xl px-6 py-8 focus:outline-none transition-all rich-editor text-lg leading-relaxed text-[#37352F] shadow-inner overflow-y-auto mb-8"
                                style={{ outline: 'none' }}
                                dangerouslySetInnerHTML={editingPost ? { __html: content } : undefined}
                            />

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIsWriting(false)}
                                    className="flex-1 py-4 bg-white text-[#787774] rounded-2xl text-sm font-bold border border-[#EBEBEB] hover:bg-[#F9F9F8] transition-all"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleWriteSubmit}
                                    className="flex-[2] py-4 bg-[#37352F] text-white rounded-2xl text-sm font-bold hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    <Check size={18} /> 완료하기
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* View Modal */}
            {
                viewingPostId && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <div className="w-full max-w-4xl max-h-[90vh] bg-[#FFFEF9] rounded-[32px] shadow-2xl overflow-y-auto p-8 md:p-12 relative">
                            {(() => {
                                const post = journalPosts.find(p => p.id === viewingPostId);
                                if (!post) return null;

                                return (
                                    <>
                                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#F5E6D3]">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded">독서 기록</span>
                                                {post.material_status && (
                                                    <span className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5 rounded",
                                                        post.material_status === 'draft' ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"
                                                    )}>
                                                        {post.material_status === 'draft' ? '아이디어' : '완성본'}
                                                    </span>
                                                )}
                                            </div>
                                            <button onClick={() => setViewingPostId(null)} className="p-2 hover:bg-gray-100 rounded-xl">
                                                <X size={24} />
                                            </button>
                                        </div>
                                        <h2 className="text-3xl font-black text-[#37352F] mb-6">{post.title}</h2>
                                        <div className="text-lg text-[#37352F] mb-12 rich-content leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />

                                        <div className="bg-[#FFFCF5] rounded-[32px] border border-[#F5E6D3] p-8">
                                            <h3 className="font-bold mb-4">댓글 {post.comments?.length || 0}</h3>
                                            <div className="space-y-3">
                                                {post.comments?.map(comment => (
                                                    <div key={comment.id} className="bg-white p-4 rounded-xl border border-[#F5E6D3]">
                                                        <div className="flex justify-between text-[10px] font-bold mb-1">
                                                            <span>{getUserName(comment.user_id)}</span>
                                                            <span className="text-[#A1A1A1]">{new Date(comment.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-sm">{comment.content}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                )
            }
        </div >
    );
}
