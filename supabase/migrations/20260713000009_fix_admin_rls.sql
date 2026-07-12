-- Fix RLS for system_settings by dropping the restrictive policy
-- The previous 'Everyone reads settings' and 'Admins write settings' permissive policies will now govern access correctly.
DROP POLICY IF EXISTS "deny_public" ON public.system_settings;

-- Give admins the ability to update and delete public assets in storage
CREATE POLICY "Admins can update public assets"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'public-assets' AND
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    )
    WITH CHECK (
        bucket_id = 'public-assets' AND
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete public assets"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'public-assets' AND
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );
