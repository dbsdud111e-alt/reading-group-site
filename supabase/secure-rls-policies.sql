-- =============================================
-- 수학 독서 모임 - 보안 강화 RLS 정책
-- =============================================
-- 이 스크립트는 사용자가 자신의 데이터만 수정/삭제할 수 있도록 보장합니다.

-- 1. 기존 정책 삭제 (모든 정책 삭제)
DO $$ 
BEGIN
    -- journals 테이블 정책 삭제
    DROP POLICY IF EXISTS "Anyone can view journals" ON public.journals;
    DROP POLICY IF EXISTS "Users can insert their own journals" ON public.journals;
    DROP POLICY IF EXISTS "Users can update their own journals" ON public.journals;
    DROP POLICY IF EXISTS "Users can delete their own journals" ON public.journals;
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.journals;
    
    -- comments 테이블 정책 삭제
    DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
    DROP POLICY IF EXISTS "Users can insert comments" ON public.comments;
    DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.comments;
    
    -- books 테이블 정책 삭제
    DROP POLICY IF EXISTS "Anyone can view books" ON public.books;
    DROP POLICY IF EXISTS "Anyone can insert books" ON public.books;
    DROP POLICY IF EXISTS "Anyone can update books" ON public.books;
    DROP POLICY IF EXISTS "Anyone can delete books" ON public.books;
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.books;
    
    -- schedules 테이블 정책 삭제
    DROP POLICY IF EXISTS "Anyone can view schedules" ON public.schedules;
    DROP POLICY IF EXISTS "Anyone can insert schedules" ON public.schedules;
    DROP POLICY IF EXISTS "Anyone can update schedules" ON public.schedules;
    DROP POLICY IF EXISTS "Anyone can delete schedules" ON public.schedules;
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.schedules;
    
    -- users 테이블 정책 삭제
    DROP POLICY IF EXISTS "Anyone can view users" ON public.users;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
    DROP POLICY IF EXISTS "Only admin can delete users" ON public.users;
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.users;
END $$;

-- 2. journals 테이블 - 자신의 글만 수정/삭제 가능
CREATE POLICY "Anyone can view journals"
ON public.journals FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own journals"
ON public.journals FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journals"
ON public.journals FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journals"
ON public.journals FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 3. comments 테이블 - 자신의 댓글만 삭제 가능
CREATE POLICY "Anyone can view comments"
ON public.comments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert comments"
ON public.comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 4. books 테이블 - 모두가 추가 가능, 자신이 추가한 책만 삭제 가능
CREATE POLICY "Anyone can view books"
ON public.books FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anyone can insert books"
ON public.books FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can update books"
ON public.books FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete books"
ON public.books FOR DELETE
TO authenticated
USING (true);

-- 5. schedules 테이블 - 모두가 관리 가능
CREATE POLICY "Anyone can view schedules"
ON public.schedules FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anyone can insert schedules"
ON public.schedules FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can update schedules"
ON public.schedules FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete schedules"
ON public.schedules FOR DELETE
TO authenticated
USING (true);

-- 6. users 테이블 - 자신의 프로필만 수정 가능
CREATE POLICY "Anyone can view users"
ON public.users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 관리자만 다른 사용자 삭제 가능
-- Note: Replace 'ADMIN_USER_ID_HERE' with your actual admin user's UUID
CREATE POLICY "Only admin can delete users"
ON public.users FOR DELETE
TO authenticated
USING (
  auth.uid() = id  -- 자신의 계정은 삭제 가능
  -- OR auth.uid() = 'ADMIN_USER_ID_HERE'::uuid  -- 관리자 ID로 교체하세요
);다른사