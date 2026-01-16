"use client";

import React, { useState } from 'react';
import { useReading } from '@/lib/store';
import { Trash2, RefreshCw, Shield, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
    const { users, currentUser } = useReading();
    const [isResetting, setIsResetting] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // Check if current user is admin
    const isAdmin = currentUser?.email === 'admin@math-reading.com' ||
        currentUser?.email === 'admin.math@gmail.com' ||
        currentUser?.id === 'admin';

    const handleResetPassword = async (userId: string, userEmail: string) => {
        if (!confirm('이 사용자의 비밀번호를 123456으로 초기화하시겠습니까?')) return;

        setIsResetting(userId);
        try {
            // For ID-based accounts, we need to update via Supabase Admin API
            // This requires server-side implementation for security
            // For now, show a message
            alert('비밀번호 초기화 기능은 서버 측 구현이 필요합니다.\n사용자에게 직접 비밀번호 재설정을 요청해주세요.');
        } catch (err: any) {
            alert('오류: ' + err.message);
        } finally {
            setIsResetting(null);
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!confirm(`정말로 "${userName}" 사용자를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;

        setIsDeleting(userId);
        try {
            // Delete user from users table
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId);

            if (error) throw error;

            // Note: This doesn't delete from Supabase Auth
            // For complete deletion, you'd need Supabase Admin API
            alert('사용자가 삭제되었습니다.');
            window.location.reload();
        } catch (err: any) {
            alert('삭제 실패: ' + err.message);
        } finally {
            setIsDeleting(null);
        }
    };

    if (!currentUser) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-16 text-center">
                <Shield size={48} className="mx-auto mb-4 text-gray-400" />
                <h1 className="text-2xl font-bold text-[#37352F] mb-2">관리자 로그인 필요</h1>
                <p className="text-[#787774]">이 페이지는 관리자만 접근할 수 있습니다.</p>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-16 text-center">
                <Shield size={48} className="mx-auto mb-4 text-red-400" />
                <h1 className="text-2xl font-bold text-[#37352F] mb-2">접근 권한 없음</h1>
                <p className="text-[#787774]">관리자 권한이 필요합니다.</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Shield size={32} className="text-blue-600" />
                    <h1 className="text-3xl font-bold text-[#37352F]">관리자 페이지</h1>
                </div>
                <p className="text-[#787774]">사용자 계정을 관리합니다.</p>
            </div>

            <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden">
                <div className="px-6 py-4 bg-[#FBFBFA] border-b border-[#EBEBEB]">
                    <h2 className="text-lg font-bold text-[#37352F]">등록된 사용자 ({users.length})</h2>
                </div>

                <div className="divide-y divide-[#EBEBEB]">
                    {users.map((user) => (
                        <div key={user.id} className="px-6 py-4 hover:bg-[#FBFBFA] transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {user.avatar_url ? (
                                        <img
                                            src={user.avatar_url}
                                            alt={user.name}
                                            className="w-12 h-12 rounded-full border-2 border-[#EBEBEB]"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                            <User size={24} className="text-gray-400" />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-[#37352F]">{user.name}</h3>
                                        <p className="text-sm text-[#787774]">{user.email || 'ID 기반 계정'}</p>
                                        {user.id === currentUser.id && (
                                            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                                                현재 사용자
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {user.id !== currentUser.id && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleResetPassword(user.id, user.email || '')}
                                            disabled={isResetting === user.id}
                                            className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50 text-sm font-medium"
                                        >
                                            <RefreshCw size={16} className={isResetting === user.id ? 'animate-spin' : ''} />
                                            비밀번호 초기화
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user.id, user.name)}
                                            disabled={isDeleting === user.id}
                                            className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition-colors disabled:opacity-50 text-sm font-medium"
                                        >
                                            <Trash2 size={16} />
                                            삭제
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <h3 className="text-sm font-bold text-amber-900 mb-2">⚠️ 주의사항</h3>
                <ul className="text-xs text-amber-800 space-y-1">
                    <li>• 사용자 삭제는 되돌릴 수 없습니다.</li>
                    <li>• 비밀번호 초기화는 서버 측 구현이 필요합니다.</li>
                    <li>• 자신의 계정은 삭제할 수 없습니다.</li>
                </ul>
            </div>
        </div>
    );
}
