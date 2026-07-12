-- Rename 'moderator' to 'super_admin' in the app_role enum
ALTER TYPE public.app_role RENAME VALUE 'moderator' TO 'super_admin';

-- Update the has_role function to use the new logic for 'super_admin' cascading to 'admin'
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
    AND (
      role = _role OR 
      (role = 'super_admin' AND _role = 'admin')
    )
  );
$$;

-- Ensure k.nithingoud78@gmail.com is migrated to super_admin
DO $$ 
DECLARE
  target_user_id uuid;
BEGIN
  -- Get user id of the owner account
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'k.nithingoud78@gmail.com';
  
  IF target_user_id IS NOT NULL THEN
    -- Upsert role to super_admin.
    DELETE FROM public.user_roles WHERE user_id = target_user_id;
    INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, 'super_admin');
  END IF;
END $$;
