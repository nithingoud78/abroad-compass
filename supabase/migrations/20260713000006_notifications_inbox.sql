create table if not exists public.notifications (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(user_id) on delete cascade not null,
    type text not null,
    title text not null,
    message text not null,
    action_link text,
    is_read boolean default false not null,
    created_at timestamptz default now() not null
);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
    on public.notifications for select
    using (auth.uid() = user_id);

create policy "Users can insert their own notifications"
    on public.notifications for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own notifications"
    on public.notifications for update
    using (auth.uid() = user_id);

create policy "Users can delete their own notifications"
    on public.notifications for delete
    using (auth.uid() = user_id);
