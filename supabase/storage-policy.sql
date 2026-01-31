
-- 1. Create a storage bucket for uploads if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Remove any existing policies for the 'uploads' bucket to start fresh
DROP POLICY IF EXISTS "Anyone can view uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads" ON storage.objects;

-- 3. Policy: Public Read Access (Anyone can download)
-- This allows anyone (even non-logged-in users if needed, or restrict to 'authenticated') to view/download files.
CREATE POLICY "Anyone can view uploads"
ON storage.objects FOR SELECT
USING ( bucket_id = 'uploads' );

-- 4. Policy: Authenticated Upload Access
-- Only logged-in users can upload files
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'uploads' );

-- 5. Policy: Owner Update Access
-- Users can only update (overwrite) files they uploaded themselves
CREATE POLICY "Users can update their own uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'uploads' AND auth.uid() = owner )
WITH CHECK ( bucket_id = 'uploads' AND auth.uid() = owner );

-- 6. Policy: Owner Delete Access
-- Users can only delete files they uploaded themselves
CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'uploads' AND auth.uid() = owner );
