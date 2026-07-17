-- Drop the old restrictive policies
DROP POLICY IF EXISTS "Admins can insert public assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update public assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete public assets" ON storage.objects;

-- Recreate policies utilizing the central public.has_role helper
-- The has_role function automatically cascades 'super_admin' access when checking for 'admin'
CREATE POLICY "Admins can insert public assets"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'public-assets' AND
        public.has_role(auth.uid(), 'admin'::public.app_role)
    );

CREATE POLICY "Admins can update public assets"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'public-assets' AND
        public.has_role(auth.uid(), 'admin'::public.app_role)
    )
    WITH CHECK (
        bucket_id = 'public-assets' AND
        public.has_role(auth.uid(), 'admin'::public.app_role)
    );

CREATE POLICY "Admins can delete public assets"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'public-assets' AND
        public.has_role(auth.uid(), 'admin'::public.app_role)
    );

-- Note on SELECT: 
-- The existing policy "Anyone can read public assets" is maintained for SELECT.
-- If SELECT were restricted to the same admin authorization logic, normal users
-- would not be able to load the QR code image on their end.
