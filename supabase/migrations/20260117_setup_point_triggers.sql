-- 1. 포인트 재집계 (현재 오류 수정 및 초기화)
-- 기존에 잘못 기록된 포인트가 있다면 이 쿼리로 즉시 바로잡힙니다.
UPDATE users 
SET points = (
  (SELECT count(*) FROM journals WHERE journals.user_id = users.id) +
  (SELECT count(*) FROM tracker_completions WHERE tracker_completions.user_id = users.id)
);

-- 2. 포인트 업데이트 트리거 함수 정의
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE users SET points = points + 1 WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE users SET points = points - 1 WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Journals 테이블 트리거 연결 (게시글 작성/삭제 시 자동 반영)
DROP TRIGGER IF EXISTS on_journal_change ON journals;
CREATE TRIGGER on_journal_change
AFTER INSERT OR DELETE ON journals
FOR EACH ROW EXECUTE FUNCTION update_user_points();

-- 4. Tracker Completions 테이블 트리거 연결 (트래커 완료/취소 시 자동 반영)
DROP TRIGGER IF EXISTS on_tracker_change ON tracker_completions;
CREATE TRIGGER on_tracker_change
AFTER INSERT OR DELETE ON tracker_completions
FOR EACH ROW EXECUTE FUNCTION update_user_points();
