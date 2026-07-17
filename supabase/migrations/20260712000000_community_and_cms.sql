create table if not exists public.study_buddies (
    id uuid not null default gen_random_uuid(),
    user_id_1 uuid not null references public.profiles(user_id) on delete cascade,
    user_id_2 uuid not null references public.profiles(user_id) on delete cascade,
    status text not null check (status in ('pending', 'accepted')),
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint study_buddies_pkey primary key (id),
    constraint study_buddies_user_order check (user_id_1 < user_id_2),
    constraint study_buddies_unique_pair unique (user_id_1, user_id_2)
);

alter table public.study_buddies enable row level security;

create policy "Users can see their own buddy relationships"
    on public.study_buddies
    for select
    using (auth.uid() = user_id_1 or auth.uid() = user_id_2);

create policy "Users can insert buddy requests for themselves"
    on public.study_buddies
    for insert
    with check (auth.uid() = user_id_1 or auth.uid() = user_id_2);

create policy "Users can update their buddy relationships"
    on public.study_buddies
    for update
    using (auth.uid() = user_id_1 or auth.uid() = user_id_2);

create policy "Users can delete their buddy relationships"
    on public.study_buddies
    for delete
    using (auth.uid() = user_id_1 or auth.uid() = user_id_2);

/*
create table if not exists public.legal_pages (
    slug text not null,
    title text not null,
    content_md text not null,
    updated_at timestamp with time zone not null default now(),
    constraint legal_pages_pkey primary key (slug)
);

alter table public.legal_pages enable row level security;

create policy "Anyone can read legal pages"
    on public.legal_pages
    for select
    to authenticated, anon
    using (true);

create policy "Only admins can insert/update legal pages"
    on public.legal_pages
    for all
    using (
        exists (
            select 1 from public.user_roles
            where user_roles.user_id = auth.uid()
            and user_roles.role = 'admin'
        )
    );

-- Create storage bucket for support QR codes if it doesn't exist
insert into storage.buckets (id, name, public) 
values ('public-assets', 'public-assets', true)
on conflict (id) do nothing;

create policy "Anyone can read public assets"
    on storage.objects
    for select
    using (bucket_id = 'public-assets');

create policy "Admins can insert public assets"
    on storage.objects
    for insert
    with check (
        bucket_id = 'public-assets' and
        exists (
            select 1 from public.user_roles
            where user_roles.user_id = auth.uid()
            and user_roles.role = 'admin'
        )
    );
*/
