"use client";

import React, { useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { ChevronLeft, List, HelpCircle, Heart, Lightbulb, Plus, Edit2, Trash2, X, Check, Image as ImageIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useReading, JournalPost } from '@/lib/store';

type Category = 'memo' | 'question' | 'feeling' | 'idea';

const categories: { id: Category; label: string; icon: any; color: string }[] = [
    { id: 'question', label: '질문', icon: HelpCircle, color: 'text-rose-600' },
    { id: 'idea', label: '수업 아이디어 및 콘텐츠', icon: Lightbulb, color: 'text-amber-600' },
    { id: 'memo', label: '메모 및 요약정리', icon: List, color: 'text-gray-600' },
    { id: 'feeling', label: '느낀점', icon: Heart, color: 'text-green-600' },
];

function JournalPageContent() {
    const { users, journalPosts, books, addJournalPost, updateJournalPost, deleteJournalPost, updateUserName, addComment, deleteComment, materialTags, addMaterialTag, deleteMaterialTag, globalFilterTags, setGlobalFilterTags, currentUser } = useReading();

    const searchParams = useSearchParams();
    const initialBookId = searchParams?.get('bookId');

    const [activeUser, setActiveUser] = useState<string>('all');
    const [activeBook, setActiveBook] = useState<string>(initialBookId || 'all');
    const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
    const [isWriting, setIsWriting] = useState(false);
    const [viewingPostId, setViewingPostId] = useState<string | null>(null);
    const [editingPost, setEditingPost] = useState<string | null>(null);
    const [editingUserName, setEditingUserName] = useState<string | null>(null);
    const [tempUserName, setTempUserName] = useState('');

    // Form states
    const [content, setContent] = useState('');
    const [materialStatus, setMaterialStatus] = useState<'draft' | 'finished'>('draft');
    const [formMaterialTags, setFormMaterialTags] = useState<string[]>([]);
    const [links, setLinks] = useState<string[]>(['']);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [uploadedImages, setUploadedImages] = useState<{ file: File; preview: string }[]>([]);
    const editorRef = useRef<HTMLDivElement>(null);

    const currentPosts = journalPosts.filter(p => {
        const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
        const matchesUser = activeUser === 'all' || p.user_id === activeUser;
        const matchesBook = activeBook === 'all' || p.book_id === activeBook;

        // Tag filtering
        const matchesTags = globalFilterTags.length === 0 || (p.material_tags && globalFilterTags.every(tag => p.material_tags!.includes(tag)));

        return matchesCategory && matchesUser && matchesBook && matchesTags;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setUploadedFiles(prev => [...prev, ...files]);
    };

    const removeFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));

        const editor = editorRef.current;
        if (!editor) return;

        editor.focus();

        for (const file of imageFiles) {
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });

            // Insert image directly into HTML
            const imgHtml = `<p><img src="${base64}" alt="${file.name}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; border: 1px solid #F5E6D3;" /></p><p><br></p>`;
            document.execCommand('insertHTML', false, imgHtml);
        }

        e.target.value = '';
    };

    const removeImage = (index: number) => {
        // Handled by contentEditable removal
    };

    const addLinkField = () => {
        setLinks(prev => [...prev, '']);
    };

    const updateLink = (index: number, value: string) => {
        setLinks(prev => prev.map((link, i) => i === index ? value : link));
    };

    const removeLink = (index: number) => {
        setLinks(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
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

        // Extract title from the first line of text
        const textLines = editorText.split('\n').filter(l => l.trim() !== '');
        const extractedTitle = textLines[0]?.trim() || '제목 없음';
        const extractedContent = editorHtml; // Save full HTML to preserve images

        // Process files
        const fileData = uploadedFiles.map(file => ({
            url: URL.createObjectURL(file),
            name: file.name
        }));

        // Filter out empty links
        const validLinks = links.filter(link => link.trim() !== '');

        if (editingPost) {
            updateJournalPost(editingPost, {
                title: extractedTitle,
                content: extractedContent,
                links: validLinks.length > 0 ? validLinks : undefined,
                files: fileData.length > 0 ? fileData : undefined,
                material_status: activeCategory === 'idea' ? materialStatus : undefined,
                material_tags: activeCategory === 'idea' ? formMaterialTags : undefined,
            });
            setEditingPost(null);
        } else {
            addJournalPost({
                id: '', // Will be generated by server
                user_id: currentUser.id,
                book_id: activeBook === 'all' ? undefined : activeBook,
                category: activeCategory === 'all' ? 'memo' : activeCategory,
                title: extractedTitle,
                content: extractedContent,
                links: validLinks.length > 0 ? validLinks : undefined,
                files: fileData.length > 0 ? fileData : undefined,
                material_status: activeCategory === 'idea' ? materialStatus : undefined,
                material_tags: activeCategory === 'idea' ? formMaterialTags : undefined,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
        }

        // Reset form
        if (editorRef.current) editorRef.current.innerHTML = '';
        setContent('');
        setLinks(['']);
        setMaterialStatus('draft');
        setFormMaterialTags([]);
        setUploadedFiles([]);
        setUploadedImages([]);
        setIsWriting(false);
        setEditingPost(null);
    };

    const handleEdit = (post: JournalPost) => {
        setEditingPost(post.id);

        // Populate editor with current content
        // If content is not HTML (legacy), wrap it to look like HTML
        const initialHtml = post.content.includes('<img') || post.content.includes('<p>')
            ? post.content
            : `<p><strong>${post.title}</strong></p><p>${post.content.replace(/\n/g, '<br>')}</p>`;

        setContent(initialHtml);
        if (editorRef.current) editorRef.current.innerHTML = initialHtml;

        setLinks(post.links && post.links.length > 0 ? post.links : ['']);
        if (post.category === 'idea') {
            setMaterialStatus(post.material_status || 'draft');
            setFormMaterialTags(post.material_tags || []);
        }
        setFormMaterialTags(post.material_tags || []);
        setActiveUser(post.user_id);
        setIsWriting(true);
    };

    const handleDelete = (postId: string) => {
        if (confirm('정말 삭제하시겠습니까?')) {
            deleteJournalPost(postId);
        }
    };

    const handleUserNameEdit = (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (user) {
            setEditingUserName(userId);
            setTempUserName(user.name);
        }
    };

    const handleUserNameSave = () => {
        if (editingUserName && tempUserName.trim()) {
            updateUserName(editingUserName, tempUserName.trim());
            setEditingUserName(null);
        }
    };

    const getUserName = (userId: string) => {
        // First check in our store users
        const storeUser = users.find(u => u.id === userId);
        if (storeUser) return storeUser.name;

        // If it's the current user (from Auth), return their name
        if (currentUser?.id === userId) return currentUser.name;

        return '알 수 없음';
    };

    const getBookTitle = (bookId: string | undefined) => {
        if (!bookId) return '도서 연결 없음';
        return books.find(b => b.id === bookId)?.title || '알 수 없는 도서';
    };

    const categoryLabel = categories.find(c => c.id === activeCategory)?.label || '';

    return (
        <div className="max-w-[1200px] mx-auto px-6 py-10 md:px-12 md:py-16">
            <div className="mb-8">
                <Link href="/books" className="flex items-center gap-1 text-sm text-[#787774] hover:text-[#37352F] mb-4 transition-colors">
                    <ChevronLeft size={16} /> 서재로 돌아가기
                </Link>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-4xl font-bold text-[#37352F] mb-2">기록하기</h1>
                        <p className="text-[#787774]">함께 읽은 책에 대한 생각과 아이디어를 공유하세요.</p>
                    </div>
                    {currentUser && (
                        <button
                            onClick={() => {
                                if (activeCategory === 'all') setActiveCategory('memo');
                                setIsWriting(true);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-[#37352F] text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg hover:shadow-[#37352F]/20 active:scale-[0.98]"
                        >
                            <Plus size={20} /> 새 기록 작성하기
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white border border-[#EBEBEB] rounded-2xl shadow-sm overflow-hidden">
                {/* User Tabs */}
                <div className="flex items-center justify-between border-b border-[#EBEBEB] bg-[#FBFBFA] px-4 py-3">
                    <div className="flex items-center gap-2">
                        {/* All Users Tab */}
                        <button
                            onClick={() => setActiveUser('all')}
                            className={cn(
                                "flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                                activeUser === 'all'
                                    ? "bg-[#37352F] text-white"
                                    : "text-[#787774] hover:bg-[#F1F1F0]"
                            )}
                        >
                            <User size={14} />
                            전체 게시판
                        </button>

                        {/* Individual User Tabs */}
                        {users.map((user) => (
                            <button
                                key={user.id}
                                onClick={() => {
                                    setActiveUser(user.id);
                                }}
                                className={cn(
                                    "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                                    activeUser === user.id
                                        ? "bg-[#37352F] text-white"
                                        : "text-[#787774] hover:bg-[#F1F1F0]"
                                )}
                            >
                                {user.name}
                            </button>
                        ))}
                    </div>

                </div>

                {/* User Management Panel */}
                {editingUserName === 'settings' && (
                    <div className="border-b border-[#EBEBEB] bg-blue-50/30 px-4 py-4">
                        <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">사용자 이름 수정</h3>
                        <div className="space-y-2">
                            {users.map((user) => (
                                <div key={user.id} className="flex items-center gap-2 bg-white p-2 rounded border border-[#EBEBEB]">
                                    <input
                                        type="text"
                                        defaultValue={user.name}
                                        onBlur={(e) => {
                                            if (e.target.value.trim() && e.target.value !== user.name) {
                                                updateUserName(user.id, e.target.value.trim());
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.currentTarget.blur();
                                            }
                                        }}
                                        className="flex-1 px-3 py-1.5 text-sm border border-[#EBEBEB] rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <span className="text-xs text-[#A1A1A1]">Enter로 저장</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Book Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2 border-b border-[#EBEBEB] bg-white px-4 py-2 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveBook('all')}
                        className={cn(
                            "whitespace-nowrap px-3 py-1.5 text-[11px] font-bold rounded-full transition-all border",
                            activeBook === 'all'
                                ? "bg-amber-100 text-amber-700 border-amber-200"
                                : "text-[#787774] border-transparent hover:bg-[#F1F1F0]"
                        )}
                    >
                        📚 전체 도서
                    </button>
                    {books.map((book) => (
                        <button
                            key={book.id}
                            onClick={() => setActiveBook(book.id!)}
                            className={cn(
                                "whitespace-nowrap px-3 py-1.5 text-[11px] font-bold rounded-full transition-all border",
                                activeBook === book.id
                                    ? "bg-blue-100 text-blue-700 border-blue-200"
                                    : "text-[#787774] border-transparent hover:bg-[#F1F1F0]"
                            )}
                        >
                            {book.title}
                        </button>
                    ))}
                </div>

                {/* Category Filter Tabs */}
                <div className="flex border-b border-[#EBEBEB] bg-white overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => {
                            setActiveCategory('all');
                            setIsWriting(false);
                        }}
                        className={cn(
                            "flex items-center gap-2 px-5 py-4 text-sm font-bold transition-all border-b-2 relative",
                            activeCategory === 'all'
                                ? "text-[#37352F] border-[#37352F] bg-[#FBFBFA]"
                                : "text-[#787774] border-transparent hover:bg-[#F9F9F8]"
                        )}
                    >
                        전체 보기
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => {
                                setActiveCategory(cat.id);
                                setIsWriting(false);
                            }}
                            className={cn(
                                "flex items-center gap-2 px-5 py-4 text-sm font-bold transition-all border-b-2 relative whitespace-nowrap",
                                activeCategory === cat.id
                                    ? `${cat.color} border-current bg-[#FBFBFA]`
                                    : "text-[#787774] border-transparent hover:bg-[#F9F9F8]"
                            )}
                        >
                            <cat.icon size={16} />
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Global Tag Filter (Sync with Contents Board) */}
                <div className="flex flex-wrap items-center gap-4 bg-[#FBFBFA] px-6 py-3 border-b border-[#EBEBEB]">
                    <span className="text-[11px] font-bold text-[#37352F]">태그 필터:</span>
                    <div className="flex flex-wrap gap-2">
                        {materialTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => {
                                    setGlobalFilterTags(
                                        globalFilterTags.includes(tag)
                                            ? globalFilterTags.filter(t => t !== tag)
                                            : [...globalFilterTags, tag]
                                    );
                                }}
                                className={cn(
                                    "px-2.5 py-1 text-[10px] font-bold rounded-full border transition-all",
                                    globalFilterTags.includes(tag)
                                        ? "bg-blue-50 text-blue-600 border-blue-200"
                                        : "bg-white text-[#A1A1A1] border-[#EBEBEB] hover:bg-white hover:border-[#D3D1CB]"
                                )}
                            >
                                #{tag}
                            </button>
                        ))}
                        {globalFilterTags.length > 0 && (
                            <button
                                onClick={() => setGlobalFilterTags([])}
                                className="px-2.5 py-1 text-[10px] font-bold text-rose-500 hover:bg-rose-50 rounded-full transition-all"
                            >
                                필터 초기화
                            </button>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-8">
                    {!isWriting ? (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-[#37352F]">
                                    {activeUser === 'all' ? `전체 ${categoryLabel}` : `${getUserName(activeUser)}님의 ${categoryLabel}`}
                                </h2>
                            </div>

                            {currentPosts.length === 0 ? (
                                <div className="py-16 text-center text-[#A1A1A1] border-2 border-dashed border-[#F1F1F0] rounded-xl">
                                    <p>아직 작성된 {categoryLabel}이(가) 없습니다.</p>
                                    {activeUser !== 'all' && <p className="text-sm mt-2">위의 버튼을 눌러 첫 번째 글을 작성해보세요.</p>}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {currentPosts.map((post) => (
                                        <div key={post.id} className="p-5 bg-[#FBFBFA] border border-[#EBEBEB] rounded-xl hover:shadow-sm transition-all">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="text-lg font-bold text-[#37352F]">{post.title}</h3>
                                                        {activeBook === 'all' && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded">
                                                                <BookOpen size={10} /> {getBookTitle(post.book_id)}
                                                            </span>
                                                        )}
                                                        {post.material_status && (
                                                            <span className={cn(
                                                                "px-2 py-0.5 text-[10px] font-bold rounded uppercase",
                                                                post.material_status === 'draft'
                                                                    ? "bg-amber-100 text-amber-600"
                                                                    : "bg-green-100 text-green-600"
                                                            )}>
                                                                {post.material_status === 'draft' ? '아이디어' : '완성본'}
                                                            </span>
                                                        )}
                                                        {post.material_tags?.map(tag => (
                                                            <span key={tag} className="text-[10px] text-blue-600 font-medium">#{tag}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                {currentUser?.id === post.user_id && (
                                                    <div className="flex flex-col items-end gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleEdit(post)}
                                                                className="p-1.5 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(post.id)}
                                                                className="p-1.5 hover:bg-rose-100 rounded text-rose-600 transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                        <div className="text-[10px] text-[#A1A1A1]">
                                                            {new Date(post.created_at).toLocaleString('ko-KR')}
                                                        </div>
                                                    </div>
                                                )}
                                                {currentUser?.id !== post.user_id && (
                                                    <div className="flex flex-col items-end">
                                                        <div className="text-xs font-bold text-[#37352F] mb-1">
                                                            {getUserName(post.user_id)}
                                                        </div>
                                                        <div className="text-[10px] text-[#A1A1A1]">
                                                            {new Date(post.created_at).toLocaleString('ko-KR')}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* HTML Content (Rich Text) */}
                                            <div
                                                className="text-sm text-[#4A4A3A] mb-3 rich-content line-clamp-3 cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => setViewingPostId(post.id)}
                                                dangerouslySetInnerHTML={{ __html: post.content }}
                                            />

                                            {((post.links && post.links.length > 0) || (post.files && post.files.length > 0)) && (
                                                <div className="flex flex-wrap gap-2 pt-3 border-t border-[#EBEBEB]">
                                                    {post.links?.map((link, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded hover:bg-blue-100 transition-colors"
                                                        >
                                                            <LinkIcon size={12} /> 링크 {idx + 1}
                                                        </a>
                                                    ))}
                                                    {post.files?.map((file, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={file.url}
                                                            download={file.name}
                                                            className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 text-xs font-medium rounded hover:bg-green-100 transition-colors"
                                                        >
                                                            <FileText size={12} /> {file.name}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Comment Section */}
                                            <div className="border-t border-[#EBEBEB] pt-4">
                                                <div className="flex items-center gap-2 mb-4 text-[#37352F]">
                                                    <MessageSquare size={16} />
                                                    <span className="text-sm font-bold">댓글 {post.comments?.length || 0}</span>
                                                </div>

                                                {/* Comment List */}
                                                {post.comments && post.comments.length > 0 && (
                                                    <div className="space-y-3 mb-4 ml-2">
                                                        {post.comments.map((comment) => (
                                                            <div key={comment.id} className="flex flex-col gap-1 p-3 bg-white border border-[#F1F1F0] rounded-lg">
                                                                <div className="flex items-center justify-end gap-2 mb-1">
                                                                    <span className="text-[10px] text-[#A1A1A1]">{new Date(comment.created_at).toLocaleDateString('ko-KR')}</span>
                                                                    {currentUser?.id === comment.user_id && (
                                                                        <button
                                                                            onClick={() => deleteComment(post.id, comment.id)}
                                                                            className="text-rose-500 hover:text-rose-700 transition-colors"
                                                                        >
                                                                            <X size={12} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-[#787774]">{comment.content}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Comment Input */}
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="댓글을 입력하세요..."
                                                            className="flex-1 px-3 py-2 bg-white border border-[#EBEBEB] rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                                                                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                                if (input.value.trim() && currentUser) {
                                                                    addComment(post.id, {
                                                                        id: Math.random().toString(36).substr(2, 9),
                                                                        user_id: currentUser.id,
                                                                        content: input.value.trim(),
                                                                        created_at: new Date().toISOString()
                                                                    });
                                                                    input.value = '';
                                                                }
                                                            }}
                                                            className="px-3 py-2 bg-[#37352F] text-white text-xs font-bold rounded hover:bg-black transition-all"
                                                        >
                                                            게시
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                            <div className="w-full max-w-4xl max-h-[95vh] bg-white rounded-[32px] shadow-2xl flex flex-col overflow-hidden">
                                {/* Header (Sticky) */}
                                <div className="flex-none flex items-center justify-between px-8 py-6 border-b border-[#EBEBEB] bg-white">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-[#FFFCF5] border border-[#FFD97D] rounded-xl flex items-center justify-center text-[#FFB84D] shadow-sm">
                                            <ImageIcon size={20} />
                                        </div>
                                        <h2 className="text-2xl font-bold text-[#37352F] tracking-tight">{editingPost ? `${categoryLabel} 수정` : `새로운 ${categoryLabel}`}</h2>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setIsWriting(false);
                                            setEditingPost(null);
                                            setContent('');
                                            setLinks(['']);
                                            setUploadedFiles([]);
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <X size={24} className="text-[#A1A1A1]" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-10">

                                    {/* Simple Editor Toolbar */}
                                    <div className="flex items-center gap-2 mb-2 p-2 bg-[#FFFCF5] border border-[#F5E6D3] rounded-t-lg w-full">
                                        <input
                                            type="file"
                                            id="inline-image-upload"
                                            multiple
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageSelect}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('inline-image-upload')?.click()}
                                            className="p-2 bg-white border border-[#F5E6D3] text-[#FFB84D] rounded-lg hover:bg-[#FFFCF5] hover:border-[#FFD97D] transition-all shadow-sm"
                                            title="이미지 추가"
                                        >
                                            <ImageIcon size={18} />
                                        </button>
                                    </div>

                                    {/* Editor Content */}
                                    <div className="mb-10">
                                        <div
                                            ref={editorRef}
                                            contentEditable
                                            onInput={(e) => setContent(e.currentTarget.innerHTML)}
                                            data-placeholder="내용을 자유롭게 적어주세요..."
                                            className="w-full min-h-[300px] max-h-[500px] bg-white border border-[#F5E6D3] rounded-2xl px-6 py-8 focus:outline-none transition-all rich-editor text-lg leading-relaxed text-[#37352F] shadow-inner overflow-y-auto"
                                            style={{ outline: 'none' }}
                                            dangerouslySetInnerHTML={editingPost ? { __html: content } : undefined}
                                        />
                                        <style jsx>{`
                                        .rich-editor:empty:before {
                                            content: attr(data-placeholder);
                                            color: #D1D1D1;
                                            cursor: text;
                                            font-size: 1.5rem;
                                            font-weight: 700;
                                        }
                                        .rich-content img, .rich-editor img {
                                            display: block;
                                            max-width: 60% !important;
                                            height: auto !important;
                                            border-radius: 16px;
                                            margin: 24px auto !important;
                                            box-shadow: 0 10px 30px rgba(0,0,0,0.06);
                                            border: 1px solid #F5E6D3;
                                        }
                                    `}</style>
                                    </div>

                                    {/* Footer Sidebar-style Metadata Area */}
                                    {(activeCategory === 'idea' || activeCategory === 'memo') && (
                                        <div className={cn(
                                            "mt-20 p-10 rounded-[32px] border shadow-sm",
                                            activeCategory === 'idea' ? "bg-amber-50/20 border-amber-100" : "bg-gray-50/20 border-gray-100"
                                        )}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                                <div className="space-y-8">
                                                    {/* Status & Tags */}
                                                    {activeCategory === 'idea' && (
                                                        <>
                                                            <div>
                                                                <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-4">작업 진행도</h4>
                                                                <div className="flex gap-3">
                                                                    {(['draft', 'finished'] as const).map((status) => (
                                                                        <button
                                                                            key={status}
                                                                            type="button"
                                                                            onClick={() => setMaterialStatus(status)}
                                                                            className={cn(
                                                                                "px-4 py-2 text-sm font-bold rounded-lg border transition-all",
                                                                                materialStatus === status
                                                                                    ? "bg-[#37352F] text-white border-[#37352F]"
                                                                                    : "bg-white text-[#787774] border-[#EBEBEB] hover:bg-[#F9F9F8]"
                                                                            )}
                                                                        >
                                                                            {status === 'draft' ? '아이디어' : '완성본'}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-4">분류 태그</h4>
                                                                <div className="flex flex-wrap gap-3">
                                                                    {materialTags.map(tag => (
                                                                        <div key={tag} className="group relative">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setFormMaterialTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                                                                                className={cn(
                                                                                    "px-4 py-2 text-xs font-bold rounded-xl border transition-all shadow-sm flex items-center gap-2",
                                                                                    formMaterialTags.includes(tag) ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white text-[#A1A1A1] border-[#EBEBEB]"
                                                                                )}
                                                                            >
                                                                                #{tag}
                                                                            </button>
                                                                            <button onClick={() => { if (confirm('삭제하시겠습니까?')) deleteMaterialTag(tag); }} className="opacity-0 group-hover:opacity-100 absolute -top-2 -right-2 bg-white border border-[#EBEBEB] rounded-full p-1 text-rose-500 shadow-lg transition-all">
                                                                                <X size={10} />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* Links */}
                                                    <div>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h4 className="text-xs font-black text-[#787774] uppercase tracking-widest">연관 링크</h4>
                                                            <button onClick={addLinkField} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-all">+ 추가</button>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {links.map((link, index) => (
                                                                <div key={index} className="flex gap-2">
                                                                    <input
                                                                        type="url"
                                                                        value={link}
                                                                        onChange={(e) => updateLink(index, e.target.value)}
                                                                        placeholder="https://..."
                                                                        className="flex-1 px-4 py-2.5 bg-white border border-[#EBEBEB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD97D]/20 focus:border-[#FFD97D] transition-all"
                                                                    />
                                                                    {links.length > 1 && <button onClick={() => removeLink(index)} className="p-2.5 text-rose-400 hover:bg-rose-50 rounded-xl transition-all"><X size={18} /></button>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-8">
                                                    {/* Files */}
                                                    <div>
                                                        <h4 className="text-xs font-black text-[#787774] uppercase tracking-widest mb-4">첨부 파일</h4>
                                                        <div className="p-8 border-2 border-dashed border-[#F5E6D3] rounded-[24px] bg-[#FFFCF5] hover:bg-[#FFF9E6] hover:border-[#FFD97D] transition-all cursor-pointer relative group text-center">
                                                            <input type="file" multiple accept="image/*" onChange={handleFileSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                            <div className="text-[#FFB84D] mb-2 flex justify-center"><ImageIcon size={32} /></div>
                                                            <p className="text-xs font-bold text-[#787774]">클릭하여 파일을 업로드하세요</p>
                                                            <p className="text-[10px] text-[#A1A1A1] mt-1">이미지, 문서 등</p>
                                                        </div>
                                                        <div className="mt-4 space-y-2">
                                                            {uploadedFiles.map((file, index) => (
                                                                <div key={index} className="flex items-center justify-between text-xs bg-white px-4 py-3 rounded-xl border border-[#EBEBEB] shadow-xs">
                                                                    <span className="text-[#37352F] font-bold">📄 {file.name}</span>
                                                                    <button onClick={() => removeFile(index)} className="text-rose-400 hover:text-rose-600"><X size={16} /></button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => {
                                                setIsWriting(false);
                                                setEditingPost(null);
                                            }}
                                            className="flex-1 py-4 bg-white text-[#787774] rounded-2xl text-sm font-bold border border-[#EBEBEB] hover:bg-[#F9F9F8] transition-all"
                                        >
                                            취소
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            className="flex-[2] py-4 bg-[#37352F] text-white rounded-2xl text-sm font-bold hover:bg-black transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                                        >
                                            <Check size={18} />
                                            완료하기
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* View Modal */}
                {viewingPostId && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <div className="w-full max-w-4xl max-h-[90vh] bg-[#FFFEF9] rounded-[32px] shadow-2xl flex flex-col overflow-hidden relative">
                            {(() => {
                                const post = journalPosts.find(p => p.id === viewingPostId);
                                if (!post) return null;

                                return (
                                    <>
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
                                                onClick={() => setViewingPostId(null)}
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
                                                            const input = (e.currentTarget.nextSibling as HTMLInputElement);
                                                            // Note: using nextSibling is unstable, better use ref or previousSibling of a hidden input if any, 
                                                            // but here I'll just use the event target's parent or something else or just keep it simple.
                                                            // In the previous code it was previousSibling.
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
                                    </>
                                );
                            })()}
                        </div >
                    </div>
                )}
            </div>
            );
}

            export default function JournalPage() {
    return (
            <Suspense fallback={<div className="p-20 text-center text-[#787774]">로딩 중...</div>}>
                <JournalPageContent />
            </Suspense>
            );
}
