import { Book } from '@/types';

// Mock Aladdin API Service
// In a real implementation, this would call the Aladdin API directly or via a proxy server.
export async function searchBooks(query: string): Promise<Partial<Book>[]> {
    try {
        const response = await fetch(`/api/aladdin?query=${encodeURIComponent(query)}`);
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `서버 응답 오류 (상태 코드: ${response.status})`);
        }
        return await response.json();
    } catch (error: any) {
        console.error('검색 중 오류 발생:', error);
        alert(error.message || '도서 검색 중 네트워크 오류가 발생했습니다.');
        return [];
    }
}

export const SUBJECT_TAGS = [
    "공통수학1", "공통수학2", "대수", "미적1", "미적2", "확통", "기하", "인공지능 수학", "교과외"
];
