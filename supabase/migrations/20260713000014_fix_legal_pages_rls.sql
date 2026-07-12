-- Drop the restrictive/incorrect policy
DROP POLICY IF EXISTS "Only admins can insert/update legal pages" ON public.legal_pages;

-- Recreate policy utilizing the central public.has_role function
-- This allows both 'admin' and 'super_admin' (via cascade) to perform ALL operations
CREATE POLICY "Admins can manage legal pages"
    ON public.legal_pages
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
