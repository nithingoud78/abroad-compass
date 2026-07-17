-- Allow all authenticated users to read basic profile information for study buddies
create policy "Anyone can read profiles"
    on public.profiles
    for select
    to authenticated
    using (true);
