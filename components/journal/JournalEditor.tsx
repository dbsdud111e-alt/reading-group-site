"use client";

import React, { useState, useEffect } from 'react';
import { Save, Loader2, MessageSquare, List, HelpCircle, Heart, Lightbulb, Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

type Category = 'memo' | 'summary' | 'question' | 'feeling' | 'idea';

const categories: { id: Category; label: string; icon: any; color: string; description: string }[] = [
    { id: 'memo', label: '메모', icon: List, color: 'text-gray-500', description: '간단한 생각이나 노트를 남기세요.' },
    { id: 'summary', label: '요약정리', icon: Type, color: 'text-blue-500', description: '읽은 내용을 한눈에 들어오게 정리하세요.' },
    { id: 'question', label: '질문', icon: HelpCircle, color: 'text-rose-500', description: '이해가 안 가는 부분이나 토론하고 싶은 주제를 남겨주세요.' },
    { id: 'feeling', label: '느낀점', icon: Heart, color: 'text-green-500', description: '책을 읽으며 느낀 감정이나 통찰을 기록하세요.' },
    { id: 'idea', label: '수업 아이디어', icon: Lightbulb, color: 'text-amber-500', description: '교실에서 어떻게 활용할 수 있을지 계획해 보세요.' },
];

export function JournalEditor() {
    const [content, setContent] = useState('');
    const [activeCategory, setActiveCategory] = useState<Category>('memo');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Auto-save simulation
    useEffect(() => {
        const timer = setTimeout(() => {
            if (content) {
                handleSave();
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, [content]);

    const handleSave = async () => {
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSaving(false);
        setLastSaved(new Date());
    };

    const renderMath = (text: string) => {
        // Basic regex to find $...$ for inline math and $$...$$ for block math
        // In a real scenario, you'd use a more robust markdown-it-katex or similar
        const blocks = text.split(/(\$\$[\s\S]*?\$\$|\$.*?\$)/g);
        return blocks.map((block, i) => {
            if (block.startsWith('$$')) {
                return <BlockMath key={i}>{block.slice(2, -2)}</BlockMath>;
            } else if (block.startsWith('$')) {
                return <InlineMath key={i}>{block.slice(1, -1)}</InlineMath>;
            }
            return <span key={i} className="whitespace-pre-wrap">{block}</span>;
        });
    };

    return (
        <div className="bg-white border border-[#EBEBEB] rounded-2xl shadow-sm overflow-hidden min-h-[600px] flex flex-col">
            {/* Category Tabs */}
            <div className="flex flex-wrap border-b border-[#EBEBEB] bg-[#FBFBFA]">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={cn(
                            "flex items-center gap-2 px-5 py-4 text-sm font-bold transition-all border-b-2 relative",
                            activeCategory === cat.id
                                ? `${cat.color} border-current bg-white`
                                : "text-[#787774] border-transparent hover:bg-[#F1F1F0]"
                        )}
                    >
                        <cat.icon size={16} />
                        {cat.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 flex flex-col p-8">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-[#37352F] mb-1">
                        {categories.find(c => c.id === activeCategory)?.label}
                    </h2>
                    <p className="text-sm text-[#A1A1A1]">
                        {categories.find(c => c.id === activeCategory)?.description}
                    </p>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Editor */}
                    <div className="flex flex-col">
                        <div className="text-[10px] font-bold text-[#A1A1A1] uppercase tracking-widest mb-2 flex justify-between items-center">
                            <span>Markdown + LaTeX ($...$ 또는 $$...$$)</span>
                            {isSaving ? (
                                <span className="flex items-center gap-1 text-blue-500 animate-pulse">
                                    <Loader2 size={10} className="animate-spin" /> 자동 저장 중...
                                </span>
                            ) : lastSaved && (
                                <span className="text-[#A1A1A1]">저장됨: {lastSaved.toLocaleTimeString()}</span>
                            )}
                        </div>
                        <textarea
                            className="flex-1 w-full bg-[#FBFBFA] border border-[#EBEBEB] rounded-xl p-5 text-[#37352F] focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-mono text-sm leading-relaxed resize-none"
                            placeholder={`${categories.find(c => c.id === activeCategory)?.label} 내용을 입력하세요... \n예: 피타고라스 정리는 $a^2 + b^2 = c^2$ 입니다.`}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

                    {/* Preview */}
                    <div className="flex flex-col">
                        <div className="text-[10px] font-bold text-[#A1A1A1] uppercase tracking-widest mb-2">미리보기</div>
                        <div className={cn(
                            "flex-1 w-full border border-transparent rounded-xl p-5 prose prose-slate max-w-none overflow-y-auto",
                            activeCategory === 'question' ? 'bg-rose-50/30' :
                                activeCategory === 'idea' ? 'bg-amber-50/30' : 'bg-white'
                        )}>
                            {content ? (
                                <div className="text-[#37352F] text-base leading-relaxed">
                                    {renderMath(content)}
                                </div>
                            ) : (
                                <div className="text-[#A1A1A1] italic text-sm">내용을 입력하면 여기에 실시간으로 표시됩니다.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-[#FBFBFA] border-t border-[#EBEBEB] flex justify-end">
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#37352F] text-white rounded-lg font-bold hover:bg-black transition-all shadow-sm"
                >
                    <Save size={18} />
                    등록 완료
                </button>
            </div>
        </div>
    );
}
