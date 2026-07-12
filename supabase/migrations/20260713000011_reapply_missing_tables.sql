-- Reapply legal_pages table if missing
CREATE TABLE IF NOT EXISTS public.legal_pages (
    slug text not null,
    title text not null,
    content_md text not null,
    updated_at timestamp with time zone not null default now(),
    constraint legal_pages_pkey primary key (slug)
);

ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'legal_pages' AND policyname = 'Anyone can read legal pages') THEN
    CREATE POLICY "Anyone can read legal pages"
        ON public.legal_pages
        FOR SELECT
        TO authenticated, anon
        USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'legal_pages' AND policyname = 'Only admins can insert/update legal pages') THEN
    CREATE POLICY "Only admins can insert/update legal pages"
        ON public.legal_pages
        FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.user_roles
                WHERE user_roles.user_id = auth.uid()
                AND user_roles.role = 'admin'
            )
        );
  END IF;
END $$;

-- Create storage bucket for support QR codes if missing
INSERT INTO storage.buckets (id, name, public) 
VALUES ('public-assets', 'public-assets', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Anyone can read public assets') THEN
    CREATE POLICY "Anyone can read public assets"
        ON storage.objects
        FOR SELECT
        USING (bucket_id = 'public-assets');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Admins can insert public assets') THEN
    CREATE POLICY "Admins can insert public assets"
        ON storage.objects
        FOR INSERT
        WITH CHECK (
            bucket_id = 'public-assets' AND
            EXISTS (
                SELECT 1 FROM public.user_roles
                WHERE user_roles.user_id = auth.uid()
                AND user_roles.role = 'admin'
            )
        );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Admins can update public assets') THEN
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
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Admins can delete public assets') THEN
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
  END IF;
END $$;

-- Drop restrictive policy on system_settings
DROP POLICY IF EXISTS "deny_public" ON public.system_settings;
