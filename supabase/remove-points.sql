
-- 1. 트리거 삭제 (포인트 자동 업데이트 중단)
DROP TRIGGER IF EXISTS on_journal_change ON journals;
DROP TRIGGER IF EXISTS on_tracker_change ON tracker_completions;

-- 2. 트리거 함수 삭제
DROP FUNCTION IF EXISTS update_user_points();

-- 3. Users 테이블에서 포인트 컬럼 삭제 (선택 사항)
-- 데이터베이스 스키마를 깔끔하게 유지하려면 컬럼까지 삭제하는 것이 좋습니다.
ALTER TABLE public.users DROP COLUMN IF EXISTS points;
