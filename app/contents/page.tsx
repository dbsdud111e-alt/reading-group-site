"use client";

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Layers, FileText, Download, ExternalLink, Search, Plus, X, BookOpen, Link as LinkIcon, Trash2, MessageCircle, ArrowRight, Image as ImageIcon, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReading, JournalPost, Comment } from '@/lib/store';

export default function ContentsPage() {
    const { journalPosts, books, users, addJournalPost, updateJournalPost, deleteJournalPost, addComment, deleteComment, materialTags: storeMaterialTags, addMaterialTag, deleteMaterialTag, globalFilterTags, setGlobalFilterTags, currentUser } = useReading();
    const [searchTerm, setSearchTerm] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'finished'>('all');

    // View Modal State
    const [viewingPostId, setViewingPostId] = useState<string | null>(null);

    // Upload/Edit Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedBook, setSelectedBook] = useState<string>('none');
    const [materialStatus, setMaterialStatus] = useState<'draft' | 'finished'>('finished');
    const [materialTags, setMaterialTags] = useState<string[]>([]);
    const [links, setLinks] = useState<string[]>(['']);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [uploadedImages, setUploadedImages] = useState<{ file: File; preview: string }[]>([]);
    const [selectedReferences, setSelectedReferences] = useState<string[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const materials = journalPosts.filter(p => p.category === 'idea');
    const viewingPost = journalPosts.find(p => p.id === viewingPostId);

    // Get all unique tags from all materials
    const allAvailableTags = Array.from(new Set(materials.flatMap(m => m.material_tags || [])));

    const filteredMaterials = materials.filter(m => {
        const matchesSearch =
            m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.material_tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = filterStatus === 'all' || m.material_status === filterStatus;

        const matchesTags = globalFilterTags.length === 0 || globalFilterTags.every(tag => m.material_tags?.includes(tag));

        return matchesSearch && matchesStatus && matchesTags;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const getUserName = (userId: string) => {
        const storeUser = users.find(u => u.id === userId);
        if (storeUser) return storeUser.name;
        if (currentUser?.id === userId) return currentUser.name;
        return '알 수 없음';
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));

        const textarea = textareaRef.current;
        const cursorPos = textarea?.selectionStart || content.length;

        let newContent = content;
        const newImages: { file: File; preview: string }[] = [];

        for (const file of imageFiles) {
            const preview = URL.createObjectURL(file);
            newImages.push({ file, preview });

            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });

            const imageMarkdown = `\n![${file.name}](${base64})\n`;
            newContent = newContent.slice(0, cursorPos) + imageMarkdown + newContent.slice(cursorPos);
        }

        setContent(newContent);
        setUploadedImages(prev => [...prev, ...newImages]);
        e.target.value = '';
    };

    const removeImage = (index: number) => {
        setUploadedImages(prev => {
            URL.revokeObjectURL(prev[index].preview);
            return prev.filter((_, i) => i !== index);
        });
    };

    const resetForm = () => {
        setTitle('');
        setContent('');
        setSelectedBook('none');
        setMaterialStatus('finished');
        setMaterialTags([]);
        setLinks(['']);
        setUploadedFiles([]);
        uploadedImages.forEach(img => URL.revokeObjectURL(img.preview));
        setUploadedImages([]);
        setSelectedReferences([]);
        setEditingPostId(null);
        setIsUploading(false);
    };

    const handleUpload = () => {
        const editorHtml = textareaRef.current?.innerHTML || '';
        const editorText = textareaRef.current?.innerText || '';

        if (!title.trim()) {
            alert('제목을 입력해주세요.');
            return;
        }

        if (!editorText.trim() && !editorHtml.includes('<img')) {
            alert('상세 내용을 입력해주세요.');
            return;
        }

        if (!currentUser) {
            alert('로그인이 필요합니다.');
            return;
        }

        const validLinks = links.filter(l => l.trim() !== '');
        const fileData = uploadedFiles.map(file => ({
            url: URL.createObjectURL(file), // Mocking URL
            name: file.name
        }));

        if (editingPostId) {
            updateJournalPost(editingPostId, {
                book_id: selectedBook === 'none' ? undefined : selectedBook,
                title: title,
                content: editorHtml,
                material_status: materialStatus,
                material_tags: materialTags,
                links: validLinks.length > 0 ? validLinks : undefined,
                files: fileData.length > 0 ? fileData : undefined,
                references: selectedReferences.length > 0 ? selectedReferences : undefined,
            });
        } else {
            addJournalPost({
                id: Math.random().toString(36).substr(2, 9),
                user_id: currentUser.id,
                book_id: selectedBook === 'none' ? undefined : selectedBook,
                category: 'idea',
                title: title,
                content: editorHtml,
                material_status: materialStatus,
                material_tags: materialTags,
                links: validLinks.length > 0 ? validLinks : undefined,
                files: fileData.length > 0 ? fileData : undefined,
                references: selectedReferences.length > 0 ? selectedReferences : undefined,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
        }

        resetForm();
    };

    const handleEdit = (post: JournalPost) => {
        setEditingPostId(post.id);
        setTitle(post.title);
        setContent(post.content);
        setSelectedBook(post.book_id || 'none');
        setMaterialStatus(post.material_status || 'finished');
        setMaterialTags(post.material_tags || []);
        setLinks(post.links && post.links.length > 0 ? post.links : ['']);
        setSelectedReferences(post.references || []);
        setUploadedFiles(post.files?.map(f => new File([], f.name)) || []); // Mock files for display
        setIsUploading(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('정말 삭제하시겠습니까?')) {
            deleteJournalPost(id);
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto px-6 py-10 md:px-12 md:py-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-bold text-[#37352F] mb-2">수업 자료</h1>
                    <p className="text-[#787774]">게시판의 모든 아이디어와 업로드된 자료를 한눈에 확인하세요.</p>
                </div>
                <button
                    onClick={() => setIsUploading(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#37352F] text-white rounded-lg text-sm font-bold hover:bg-black transition-all"
                >
                    <Plus size={18} /> 자료 업로드
                </button>
            </div>

            {/* Upload/Edit Modal */}
            {isUploading && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-[#EBEBEB] flex-none bg-white flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-[#37352F]">{editingPostId ? '자료 수정' : '수업 자료 업로드'}</h2>
                            <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={24} className="text-[#A1A1A1]" />
                            </button>
                        </div>
                        <div className="p-10 overflow-y-auto flex-1">

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-[#37352F] mb-2">자료 제목</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="자료 제목을 입력하세요"
                                        className="w-full px-4 py-3 bg-[#FBFBFA] border border-[#EBEBEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[#37352F] mb-2">상세 내용</label>

                                    {/* Editor Toolbar */}
                                    <div className="flex items-center gap-2 mb-2 p-2 bg-[#FFFCF5] border border-[#F5E6D3] rounded-t-lg">
                                        <input
                                            type="file"
                                            id="contents-image-upload"
                                            multiple
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const files = Array.from(e.target.files || []);
                                                const editor = textareaRef.current;
                                                if (!editor) return;
                                                editor.focus();
                                                for (const file of files) {
                                                    const base64 = await new Promise<string>((resolve) => {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => resolve(reader.result as string);
                                                        reader.readAsDataURL(file);
                                                    });
                                                    const imgHtml = `<p><img src="${base64}" alt="${file.name}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; border: 1px solid #F5E6D3;" /></p><p><br></p>`;
                                                    document.execCommand('insertHTML', false, imgHtml);
                                                }
                                                e.target.value = '';
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('contents-image-upload')?.click()}
                                            className="p-2 bg-white border border-[#F5E6D3] text-[#FFB84D] rounded-lg hover:bg-[#FFFCF5] hover:border-[#FFD97D] transition-all shadow-sm"
                                            title="이미지 추가"
                                        >
                                            <ImageIcon size={18} />
                                        </button>
                                    </div>

                                    {/* Rich Text Editor Area */}
                                    <div
                                        ref={textareaRef as any}
                                        contentEditable
                                        onInput={(e) => setContent(e.currentTarget.innerHTML)}
                                        data-placeholder="내용을 자유롭게 입력하세요..."
                                        className="w-full min-h-[450px] px-6 py-8 bg-white border border-[#F5E6D3] rounded-b-lg focus:outline-none transition-all overflow-y-auto rich-editor text-lg leading-relaxed shadow-inner"
                                        style={{ outline: 'none' }}
                                        dangerouslySetInnerHTML={editingPostId ? { __html: content } : undefined}
                                    />
                                    <style jsx>{`
                                        .rich-editor:empty:before {
                                            content: attr(data-placeholder);
                                            color: #A1A1A1;
                                            cursor: text;
                                        }
                                        .rich-content img, .rich-editor img {
                                            max-width: 100%;
                                            height: auto;
                                            border-radius: 12px;
                                            margin: 20px 0;
                                            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                                        }
                                    `}</style>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[#37352F] mb-2">연관 도서 (선택사항)</label>
                                    <select
                                        value={selectedBook}
                                        onChange={(e) => setSelectedBook(e.target.value)}
                                        className="w-full px-4 py-3 bg-[#FBFBFA] border border-[#EBEBEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    >
                                        <option value="none">선택 안 함</option>
                                        {books.map(b => (
                                            <option key={b.id} value={b.id}>{b.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <span className="text-sm font-bold text-[#37352F]">상태</span>
                                    <div className="flex gap-2">
                                        {(['draft', 'finished'] as const).map((status) => (
                                            <button
                                                key={status}
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

                                <div className="flex flex-col gap-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[11px] font-bold text-[#37352F] mr-1">태그 설정:</span>
                                        {storeMaterialTags.map(tag => (
                                            <div key={tag} className="group relative flex items-center">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setMaterialTags(prev =>
                                                            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                                                        );
                                                    }}
                                                    className={cn(
                                                        "px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1",
                                                        materialTags.includes(tag)
                                                            ? "bg-blue-50 text-blue-600 border-blue-200"
                                                            : "bg-white text-[#A1A1A1] border-[#EBEBEB] hover:bg-[#F9F9F8]"
                                                    )}
                                                >
                                                    #{tag}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm(`'${tag}' 태그를 삭제하시겠습니까?`)) {
                                                            deleteMaterialTag(tag);
                                                            setMaterialTags(prev => prev.filter(t => t !== tag));
                                                        }
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 absolute -top-1.5 -right-1.5 bg-white border border-[#EBEBEB] rounded-full p-0.5 text-[#A1A1A1] hover:text-red-500 hover:border-red-200 transition-all shadow-sm z-10"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        ))}
                                        <div className="flex items-center ml-1 border-l border-[#EBEBEB] pl-2">
                                            <span className="text-[11px] text-[#A1A1A1] mr-1.5">+</span>
                                            <input
                                                type="text"
                                                placeholder="태그 추가 (Enter)"
                                                className="w-28 px-1 py-1 text-[11px] bg-transparent border-b border-transparent focus:border-blue-300 focus:outline-none transition-all"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const val = e.currentTarget.value.trim();
                                                        if (val) {
                                                            addMaterialTag(val);
                                                            if (!materialTags.includes(val)) {
                                                                setMaterialTags(prev => [...prev, val]);
                                                            }
                                                            e.currentTarget.value = '';
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-[#37352F]">링크 및 파일</label>
                                        <button
                                            onClick={() => setLinks([...links, ''])}
                                            className="text-xs font-bold text-blue-600 hover:text-blue-700"
                                        >
                                            + 링크 추가
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {links.map((link, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <input
                                                    type="url"
                                                    value={link}
                                                    onChange={(e) => {
                                                        const newLinks = [...links];
                                                        newLinks[idx] = e.target.value;
                                                        setLinks(newLinks);
                                                    }}
                                                    placeholder="URL을 입력하세요"
                                                    className="flex-1 px-3 py-2 bg-[#FBFBFA] border border-[#EBEBEB] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*,.pdf,.hwp,.ppt,.pptx,.docx"
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            setUploadedFiles(prev => [...prev, ...files]);
                                        }}
                                        className="w-full text-xs text-[#787774] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#F1F1F0] file:text-[#37352F] hover:file:bg-[#EBEBEB] cursor-pointer"
                                    />
                                    {uploadedFiles.length > 0 && (
                                        <div className="space-y-1">
                                            {uploadedFiles.map((file, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-100">
                                                    <span>{file.name}</span>
                                                    <button onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}>
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[#37352F] mb-2">참고한 게시글 연동</label>
                                    <select
                                        multiple
                                        value={selectedReferences}
                                        onChange={(e) => {
                                            const options = Array.from(e.target.selectedOptions).map(o => o.value);
                                            setSelectedReferences(options);
                                        }}
                                        className="w-full px-4 py-3 bg-[#FBFBFA] border border-[#EBEBEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs font-medium h-32"
                                    >
                                        {materials.filter(m => m.id !== editingPostId).map(m => (
                                            <option key={m.id} value={m.id}>{m.title}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-[#A1A1A1] mt-1">💡 Ctrl(또는 Cmd)을 누른 채 클릭하여 다중 선택이 가능합니다.</p>
                                </div>

                                <button
                                    onClick={handleUpload}
                                    className="w-full py-4 bg-[#37352F] text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg active:scale-[0.98] mt-4"
                                >
                                    {editingPostId ? '자료 수정 완료' : '자료 등록 완료'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Post Detail Modal */}
            {viewingPostId && viewingPost && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-[#EBEBEB] flex-none bg-white flex items-center justify-between">
                            <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                                viewingPost.material_status === 'draft' ? "bg-gray-100 text-gray-500" : "bg-blue-500 text-white"
                            )}>
                                {viewingPost.material_status === 'draft' ? '아이디어' : '완성본'}
                            </span>
                            <button onClick={() => setViewingPostId(null)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X size={20} className="text-[#A1A1A1]" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8">
                            <h2 className="text-3xl font-bold text-[#37352F] mb-4">{viewingPost.title}</h2>

                            <div className="flex items-center gap-4 mb-8 text-sm text-[#787774]">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-[#37352F] rounded-full flex items-center justify-center text-xs text-white font-bold">
                                        {getUserName(viewingPost.user_id).charAt(0)}
                                    </div>
                                    <span className="font-bold text-[#37352F]">{getUserName(viewingPost.user_id)} 교사</span>
                                </div>
                                <span>•</span>
                                <span>{new Date(viewingPost.created_at).toLocaleDateString()}</span>
                                {viewingPost.book_id && (
                                    <>
                                        <span>•</span>
                                        <Link
                                            href={`/journal?bookId=${viewingPost.book_id}`}
                                            className="flex items-center gap-1 text-blue-600 font-bold hover:underline cursor-pointer"
                                        >
                                            <BookOpen size={14} />
                                            {books.find(b => b.id === viewingPost.book_id)?.title}
                                        </Link>
                                    </>
                                )}
                            </div>

                            <div
                                className="prose max-w-none text-[#37352F] mb-10 rich-content"
                                dangerouslySetInnerHTML={{ __html: viewingPost.content }}
                            />

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mb-8">
                                {viewingPost.material_tags?.map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-[#F1F1F0] text-xs font-bold text-[#787774] rounded-lg">#{tag}</span>
                                ))}
                            </div>

                            {/* Attachments */}
                            <div className="flex flex-wrap gap-4 mb-10 pt-6 border-t border-[#F1F1F0]">
                                {viewingPost.links?.map((link, idx) => (
                                    <a key={idx} href={link} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all">
                                        <LinkIcon size={14} /> 링크 바로가기
                                    </a>
                                ))}
                                {viewingPost.files?.map((file, idx) => (
                                    <a key={idx} href={file.url} download={file.name} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all">
                                        <FileText size={14} /> {file.name}
                                    </a>
                                ))}
                            </div>

                            {/* Comments */}
                            <div className="bg-[#FBFBFA] rounded-2xl p-4 mb-10">
                                <h3 className="text-sm font-bold text-[#37352F] mb-4 flex items-center gap-2">
                                    <MessageCircle size={16} /> 댓글 {viewingPost.comments?.length || 0}
                                </h3>

                                <div className="space-y-3 mb-6">
                                    {viewingPost.comments?.map(comment => (
                                        <div key={comment.id} className="bg-white p-3 rounded-xl border border-[#EBEBEB]">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[11px] font-bold text-[#37352F]">{getUserName(comment.user_id)}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-[#A1A1A1]">{new Date(comment.created_at).toLocaleDateString()}</span>
                                                    <button onClick={() => deleteComment(viewingPost.id, comment.id)} className="text-rose-400 hover:text-rose-600">
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-[13px] text-[#37352F] leading-snug">{comment.content}</p>
                                        </div>
                                    ))}
                                    {(!viewingPost.comments || viewingPost.comments.length === 0) && (
                                        <p className="text-center py-2 text-[11px] text-[#A1A1A1]">작성된 댓글이 없습니다.</p>
                                    )}
                                </div>

                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="댓글 남기기..."
                                        className="w-full px-4 py-2.5 bg-white border border-[#EBEBEB] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-[13px] shadow-sm pr-16"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && e.currentTarget.value.trim() && currentUser) {
                                                addComment(viewingPost.id, {
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
                                            const input = (e.currentTarget.previousSibling as HTMLInputElement);
                                            if (input.value.trim() && currentUser) {
                                                addComment(viewingPost.id, {
                                                    id: Math.random().toString(36).substr(2, 9),
                                                    user_id: currentUser.id,
                                                    content: input.value.trim(),
                                                    created_at: new Date().toISOString()
                                                });
                                                input.value = '';
                                            }
                                        }}
                                        className="absolute right-2 top-1.5 text-[11px] font-bold px-3 py-1 bg-[#37352F] text-white rounded-md hover:bg-black transition-all"
                                    >
                                        게시
                                    </button>
                                </div>
                            </div>

                            {/* References (Moved to bottom and made smaller) */}
                            <div className="pt-8 border-t border-[#F1F1F0] grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="text-[11px] font-bold text-[#A1A1A1] mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                                        <LinkIcon size={12} /> 참고한 자료
                                    </h4>
                                    <div className="space-y-1.5">
                                        {viewingPost.references && viewingPost.references.length > 0 ? (
                                            viewingPost.references.map(refId => {
                                                const refPost = journalPosts.find(p => p.id === refId);
                                                return refPost ? (
                                                    <button
                                                        key={refId}
                                                        onClick={() => setViewingPostId(refId)}
                                                        className="w-full text-left p-2.5 bg-[#FBFBFA] border border-[#EBEBEB] rounded-lg hover:border-blue-200 hover:bg-blue-50/30 transition-all text-xs font-medium text-[#37352F] flex items-center justify-between group"
                                                    >
                                                        <span className="truncate mr-2">{refPost.title}</span>
                                                        <ArrowRight size={12} className="text-[#A1A1A1] group-hover:text-blue-500 transition-colors" />
                                                    </button>
                                                ) : null;
                                            })
                                        ) : (
                                            <p className="text-[10px] text-[#D3D1CB]">참고한 자료 없음</p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-[11px] font-bold text-[#A1A1A1] flex items-center gap-1.5 uppercase tracking-wider">
                                            <ArrowRight size={12} /> 이 자료를 참고한 자료
                                        </h4>
                                        <button
                                            onClick={() => {
                                                const currentPostId = viewingPost.id;
                                                const currentBookId = viewingPost.book_id;
                                                setViewingPostId(null);
                                                setIsUploading(true);
                                                setSelectedReferences([currentPostId]);
                                                if (currentBookId) setSelectedBook(currentBookId);
                                            }}
                                            className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1"
                                        >
                                            <Plus size={10} /> 내 콘텐츠 만들기
                                        </button>
                                    </div>
                                    <div className="space-y-1.5">
                                        {journalPosts.filter(p => p.references?.includes(viewingPost.id)).length > 0 ? (
                                            journalPosts.filter(p => p.references?.includes(viewingPost.id)).map(refPost => (
                                                <button
                                                    key={refPost.id}
                                                    onClick={() => setViewingPostId(refPost.id)}
                                                    className="w-full text-left p-2.5 bg-[#FBFBFA] border border-[#EBEBEB] rounded-lg hover:border-emerald-200 hover:bg-emerald-50/30 transition-all text-xs font-medium text-[#37352F] flex items-center justify-between group"
                                                >
                                                    <span className="truncate mr-2">{refPost.title}</span>
                                                    <ArrowRight size={12} className="text-[#A1A1A1] group-hover:text-emerald-500 transition-colors" />
                                                </button>
                                            ))
                                        ) : (
                                            <p className="text-[10px] text-[#D3D1CB]">연관된 자료 없음</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-6 mb-10">
                {/* Filters Section */}
                <div className="flex flex-col gap-4 p-6 bg-[#FBFBFA] border border-[#EBEBEB] rounded-3xl shadow-sm">
                    <div className="flex flex-wrap items-center gap-4">
                        <span className="text-xs font-bold text-[#37352F] w-16">상태 필터:</span>
                        <div className="flex gap-2">
                            {[
                                { id: 'all', label: '전체' },
                                { id: 'finished', label: '완성본' },
                                { id: 'draft', label: '아이디어' }
                            ].map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setFilterStatus(s.id as any)}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-bold rounded-full border transition-all",
                                        filterStatus === s.id
                                            ? "bg-[#37352F] text-white border-[#37352F]"
                                            : "bg-white text-[#787774] border-[#EBEBEB] hover:bg-[#F9F9F8]"
                                    )}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {storeMaterialTags.length > 0 && (
                        <div className="flex flex-wrap items-start gap-4 pt-4 border-t border-[#EBEBEB]">
                            <span className="text-xs font-bold text-[#37352F] w-16 mt-1.5">태그 필터:</span>
                            <div className="flex flex-wrap gap-2 flex-1">
                                {storeMaterialTags.map(tag => (
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
                                            "px-3 py-1.5 text-[11px] font-bold rounded-full border transition-all",
                                            globalFilterTags.includes(tag)
                                                ? "bg-blue-50 text-blue-600 border-blue-200"
                                                : "bg-white text-[#A1A1A1] border-[#EBEBEB] hover:bg-[#F9F9F8]"
                                        )}
                                    >
                                        #{tag}
                                    </button>
                                ))}
                                {globalFilterTags.length > 0 && (
                                    <button
                                        onClick={() => setGlobalFilterTags([])}
                                        className="px-3 py-1.5 text-[11px] font-bold text-rose-500 hover:bg-rose-50 rounded-full transition-all"
                                    >
                                        필터 초기화
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative flex-1">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="자료 제목, 과목, 태그 검색..."
                        className="w-full pl-11 pr-4 py-3 bg-white border border-[#EBEBEB] rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm shadow-sm"
                    />
                    <Search size={20} className="absolute left-3.5 top-3 text-[#A1A1A1]" />
                </div>
            </div>

            {filteredMaterials.length === 0 ? (
                <div className="py-20 text-center text-[#A1A1A1] border-2 border-dashed border-[#F1F1F0] rounded-3xl">
                    <Layers size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-medium">공유된 수업 자료가 없습니다.</p>
                    <p className="text-sm mt-1">게시판에서 아이디어를 공유하거나 새 자료를 업로드해 보세요.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredMaterials.map((m) => (
                        <div key={m.id} className="bg-white border border-[#EBEBEB] rounded-3xl overflow-hidden hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 group">
                            <div
                                onClick={() => setViewingPostId(m.id)}
                                className={cn(
                                    "h-40 flex items-center justify-center relative cursor-pointer",
                                    m.material_status === 'draft' ? "bg-[#FBFBFA]" : "bg-blue-50"
                                )}
                            >
                                <FileText size={56} className={cn(
                                    m.material_status === 'draft' ? "text-[#D3D1CB]" : "text-blue-500"
                                )} />
                                <div className="absolute top-4 left-4">
                                    {m.material_status === 'draft' ? (
                                        <span className="px-2.5 py-1 bg-gray-100 text-[10px] font-extrabold text-gray-500 rounded-full uppercase tracking-tighter shadow-sm border border-gray-200">아이디어</span>
                                    ) : (
                                        <span className="px-2.5 py-1 bg-blue-500 text-[10px] font-extrabold text-white rounded-full uppercase tracking-tighter shadow-sm">완성본</span>
                                    )}
                                </div>
                                <div className="absolute bottom-4 right-4 text-[10px] font-bold text-[#A1A1A1] bg-white/50 backdrop-blur-sm px-2 py-1 rounded-full">
                                    {new Date(m.created_at).toLocaleDateString()}
                                </div>
                                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-xs font-bold text-gray-800 bg-white/80 px-3 py-1.5 rounded-full shadow-lg">상세보기</span>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                        <BookOpen size={12} className="text-blue-600 shrink-0" />
                                        {m.book_id ? (
                                            <Link
                                                href={`/journal?bookId=${m.book_id}`}
                                                className="text-[11px] font-bold text-blue-600 truncate hover:underline"
                                            >
                                                {books.find(b => b.id === m.book_id)?.title}
                                            </Link>
                                        ) : (
                                            <span className="text-[11px] font-bold text-blue-600 truncate">자유 주제</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => handleEdit(m)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="수정">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(m.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors" title="삭제">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <h3
                                    onClick={() => setViewingPostId(m.id)}
                                    className="font-bold text-[#37352F] text-lg mb-3 line-clamp-1 group-hover:text-blue-600 transition-colors cursor-pointer"
                                >
                                    {m.title}
                                </h3>

                                <div className="flex flex-wrap gap-1.5 mb-6 min-h-[50px]">
                                    {m.material_tags && m.material_tags.length > 0 ? (
                                        m.material_tags.map(tag => (
                                            <span key={tag} className="px-2.5 py-1 bg-[#F1F1F0] text-[10px] font-bold text-[#787774] rounded-lg">#{tag}</span>
                                        ))
                                    ) : (
                                        <span className="text-[10px] text-[#A1A1A1]">등록된 태그 없음</span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-5 border-t border-[#F1F1F0]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-[#37352F] rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                                            {getUserName(m.user_id).charAt(0)}
                                        </div>
                                        <span className="text-xs font-bold text-[#37352F]">{getUserName(m.user_id)}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-[#A1A1A1]">
                                            <MessageCircle size={12} /> {m.comments?.length || 0}
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-[#A1A1A1]">
                                            <LinkIcon size={12} /> {m.references?.length || 0}
                                        </div>
                                        {(m.files && m.files.length > 0) && (
                                            <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="다운로드">
                                                <Download size={16} />
                                            </button>
                                        )}
                                        {(m.links && m.links.length > 0) && (
                                            <button className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors" title="링크 열기">
                                                <ExternalLink size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                    }
                </div >
            )}
        </div >
    );
}
