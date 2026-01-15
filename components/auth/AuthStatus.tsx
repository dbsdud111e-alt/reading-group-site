"use client";

import React, { useState } from 'react';
import { useReading } from '@/lib/store';
import { LogIn, User as UserIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AuthStatus() {
    const { currentUser, isLoading, signInWithGoogle, signOut, updateProfile } = useReading();
    const [nickname, setNickname] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [showProfileSetup, setShowProfileSetup] = useState(false);

    const handleUpdateNickname = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedNickname = nickname.trim();
        if (!trimmedNickname) {
            alert('닉네임을 입력해 주세요.');
            return;
        }

        setIsUpdating(true);
        try {
            await updateProfile({ name: trimmedNickname });
            setShowProfileSetup(false);
        } catch (err) {
            alert('프로필 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 text-[#787774]">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-xs">로딩 중...</span>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <button
                onClick={signInWithGoogle}
                className="flex items-center gap-2 w-full px-3 py-2 text-[#787774] hover:bg-[#F1F1F0] rounded-lg transition-colors text-sm font-medium"
            >
                <LogIn size={18} />
                <span>Google로 로그인</span>
            </button>
        );
    }

    // If logged in but no nickname, force profile setup
    if (!currentUser.name || showProfileSetup) {
        return (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h3 className="text-sm font-bold text-[#37352F] mb-2">프로필 설정</h3>
                <p className="text-xs text-[#787774] mb-3">사용하실 닉네임을 입력해주세요.</p>
                <form onSubmit={handleUpdateNickname} className="space-y-2">
                    <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="닉네임 (예: 홍길동)"
                        className="w-full px-3 py-2 text-sm border border-[#EBEBEB] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        required
                    />
                    <button
                        type="submit"
                        disabled={isUpdating}
                        className="w-full py-2 bg-[#37352F] text-white text-xs font-bold rounded-lg hover:bg-black transition-all disabled:bg-gray-400"
                    >
                        {isUpdating ? '저장 중...' : '시작하기'}
                    </button>
                    {currentUser.name && (
                        <button
                            type="button"
                            onClick={() => setShowProfileSetup(false)}
                            className="w-full py-2 text-xs text-[#787774] hover:text-[#37352F]"
                        >
                            취소
                        </button>
                    )}
                </form>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between gap-3 px-3 py-2 border border-[#EBEBEB] rounded-xl bg-white shadow-sm">
            <div className="flex items-center gap-3 overflow-hidden">
                {currentUser.avatar_url ? (
                    <img src={currentUser.avatar_url} alt="" className="w-8 h-8 rounded-full border border-[#EBEBEB]" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#787774]">
                        <UserIcon size={16} />
                    </div>
                )}
                <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-[#37352F] truncate">{currentUser.name}</span>
                    <button
                        onClick={() => {
                            setNickname(currentUser.name);
                            setShowProfileSetup(true);
                        }}
                        className="text-[10px] text-[#A1A1A1] hover:text-[#37352F] underline text-left"
                    >
                        닉네임 수정
                    </button>
                </div>
            </div>
            <button
                onClick={signOut}
                className="text-xs text-[#787774] hover:text-rose-500 font-medium whitespace-nowrap"
            >
                로그아웃
            </button>
        </div>
    );
}
