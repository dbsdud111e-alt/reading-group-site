"use client";

import React, { useState } from 'react';
import { useReading } from '@/lib/store';
import { LogIn, User as UserIcon, Loader2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AuthStatus() {
    const { currentUser, isLoading, signInWithGoogle, signInWithId, signUpWithId, signOut, updateProfile } = useReading();
    const [nickname, setNickname] = useState('');
    const [userId, setUserId] = useState('');
    const [memberNumber, setMemberNumber] = useState('');
    const [confirmMemberNumber, setConfirmMemberNumber] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [showProfileSetup, setShowProfileSetup] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'signup' | 'idle'>('idle');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleIdAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        const cleanUserId = userId.trim();
        const cleanNickname = nickname.trim();
        const cleanMemberNumber = memberNumber.trim();

        if (authMode === 'signup') {
            if (!cleanNickname) {
                setErrorMsg('닉네임을 입력해 주세요.');
                return;
            }
            if (cleanMemberNumber !== confirmMemberNumber.trim()) {
                setErrorMsg('회원번호가 일치하지 않습니다.');
                return;
            }
            if (cleanMemberNumber.length < 6) {
                setErrorMsg('회원번호는 최소 6자리 이상이어야 합니다.');
                return;
            }
        }

        setIsUpdating(true);

        // Failsafe: Force unlock after 5 seconds no matter what
        const unlockTimer = setTimeout(() => {
            setIsUpdating(false);
        }, 5000);

        try {
            if (authMode === 'login') {
                const { error } = await signInWithId(cleanUserId, cleanMemberNumber);

                if (error) throw error;

                setAuthMode('idle');
                setUserId('');
                setMemberNumber('');
                setConfirmMemberNumber('');
            } else {
                const { error } = await signUpWithId(cleanUserId, cleanMemberNumber, cleanNickname);

                if (error) throw error;
                alert('회원가입이 완료되었습니다! 이제 로그인해 주세요.');
                setAuthMode('login');
                setUserId(''); // Clear ID for fresh login? Or keep it? keeping it is better UX usually, but clearing ensures safety. Let's keep ID, clear PW.
                // Actually user might want to login with just created ID. Let's keep ID.
                // setUserId(''); 
                setMemberNumber('');
                setConfirmMemberNumber('');
            }
        } catch (err: any) {
            console.error('Auth Error:', err);
            let message = err.message || '인증 중 오류가 발생했습니다.';
            if (message === 'Invalid login credentials') message = '아이디나 비밀번호가 올바르지 않습니다.';
            setErrorMsg(message);
        } finally {
            clearTimeout(unlockTimer);
            setIsUpdating(false);
        }
    };

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
        if (authMode !== 'idle') {
            return (
                <div className="p-4 bg-white border border-[#EBEBEB] rounded-xl shadow-sm">
                    <h3 className="text-sm font-bold text-[#37352F] mb-4">
                        {authMode === 'login' ? '간편 로그인' : '정회원 가입'}
                    </h3>
                    <form onSubmit={handleIdAuth} className="space-y-3">
                        {authMode === 'signup' && (
                            <div>
                                <label className="text-[10px] text-[#A1A1A1] mb-1 block">닉네임</label>
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    placeholder="공유할 이름"
                                    className="w-full px-3 py-2 text-sm border border-[#EBEBEB] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                                    required
                                />
                            </div>
                        )}
                        <div>
                            <label className="text-[10px] text-[#A1A1A1] mb-1 block">아이디</label>
                            <input
                                type="text"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                placeholder="아이디 입력"
                                className="w-full px-3 py-2 text-sm border border-[#EBEBEB] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-[#A1A1A1] mb-1 block">회원번호 (비밀번호)</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={memberNumber}
                                    onChange={(e) => setMemberNumber(e.target.value)}
                                    placeholder="번호 입력 (6자리 이상)"
                                    className="w-full px-3 py-2 text-sm border border-[#EBEBEB] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1A1] hover:text-[#37352F]"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        {authMode === 'signup' && (
                            <div>
                                <label className="text-[10px] text-[#A1A1A1] mb-1 block">회원번호 확인</label>
                                <input
                                    type="password"
                                    value={confirmMemberNumber}
                                    onChange={(e) => setConfirmMemberNumber(e.target.value)}
                                    placeholder="번호 재입력"
                                    className="w-full px-3 py-2 text-sm border border-[#EBEBEB] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                                    required
                                />
                            </div>
                        )}

                        {errorMsg && (
                            <div className="bg-rose-50 text-rose-500 text-xs font-bold p-3 rounded-lg flex items-center gap-2 mb-3 animate-pulse">
                                <span>⚠️ {errorMsg}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isUpdating}
                            className="w-full py-2 bg-[#37352F] text-white text-xs font-bold rounded-lg hover:bg-black transition-all"
                        >
                            {isUpdating ? '처리 중...' : (authMode === 'login' ? '로그인' : '가입 완료')}
                        </button>
                    </form>
                    <div className="mt-4 pt-4 border-t border-[#F1F1F0] flex flex-col gap-2">
                        <button
                            onClick={() => {
                                setAuthMode(authMode === 'login' ? 'signup' : 'login');
                                setConfirmMemberNumber('');
                                setErrorMsg(null);
                                setUserId(''); // Clear ID when switching modes to avoid confusion
                                setMemberNumber('');
                            }}
                            className="text-[11px] text-[#787774] hover:text-[#37352F] hover:underline"
                        >
                            {authMode === 'login' ? '아이디가 없으신가요? 회원가입' : '이미 아이디가 있나요? 로그인'}
                        </button>
                        <button
                            onClick={() => {
                                setAuthMode('idle');
                                setErrorMsg(null);
                            }}
                            className="text-[11px] text-[#787774] hover:text-[#37352F]"
                        >
                            뒤로가기
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-2">
                <button
                    onClick={() => {
                        setAuthMode('login');
                        setErrorMsg(null);
                        setUserId('');
                        setMemberNumber('');
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-[#37352F] border border-[#EBEBEB] hover:bg-[#F1F1F0] rounded-lg transition-colors text-sm font-medium bg-white"
                >
                    <LogIn size={18} />
                    <span>아이디로 로그인/가입</span>
                </button>
                <button
                    onClick={signInWithGoogle}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-[#787774] hover:bg-[#F1F1F0] rounded-lg transition-colors text-[11px] font-medium"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-3 h-3 grayscale opacity-70" alt="" />
                    <span>Google로 계속하기</span>
                </button>
            </div>
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
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#37352F] truncate">{currentUser.name}</span>

                    </div>
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
