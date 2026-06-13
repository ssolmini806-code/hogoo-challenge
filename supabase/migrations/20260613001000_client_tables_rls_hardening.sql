-- RLS hardening for tables accessed directly by the free-site client.
-- Each block is guarded so the migration is safe in environments where a table
-- is managed elsewhere or has not been created yet.

do $$
begin
  if to_regclass('public.profiles') is not null then
    alter table public.profiles enable row level security;

    drop policy if exists "Users can read own profile" on public.profiles;
    create policy "Users can read own profile"
    on public.profiles
    for select
    to authenticated
    using (auth.uid() = id);

    drop policy if exists "Users can create own profile" on public.profiles;
    create policy "Users can create own profile"
    on public.profiles
    for insert
    to authenticated
    with check (auth.uid() = id);

    drop policy if exists "Users can update own profile" on public.profiles;
    create policy "Users can update own profile"
    on public.profiles
    for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);
  end if;
end $$;

do $$
begin
  if to_regclass('public.user_progress') is not null then
    alter table public.user_progress enable row level security;

    drop policy if exists "Users can read own progress" on public.user_progress;
    create policy "Users can read own progress"
    on public.user_progress
    for select
    to authenticated
    using (auth.uid() = user_id);

    drop policy if exists "Users can create own progress" on public.user_progress;
    create policy "Users can create own progress"
    on public.user_progress
    for insert
    to authenticated
    with check (auth.uid() = user_id);

    drop policy if exists "Users can update own progress" on public.user_progress;
    create policy "Users can update own progress"
    on public.user_progress
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

    drop policy if exists "Users can delete own progress" on public.user_progress;
    create policy "Users can delete own progress"
    on public.user_progress
    for delete
    to authenticated
    using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if to_regclass('public.reviews') is not null then
    alter table public.reviews enable row level security;

    drop policy if exists "Users can read own legacy reviews" on public.reviews;
    create policy "Users can read own legacy reviews"
    on public.reviews
    for select
    to authenticated
    using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if to_regclass('public.payment_orders') is not null then
    alter table public.payment_orders enable row level security;

    drop policy if exists "Users can read own payment orders" on public.payment_orders;
    create policy "Users can read own payment orders"
    on public.payment_orders
    for select
    to authenticated
    using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if to_regclass('public.user_subscriptions') is not null then
    alter table public.user_subscriptions enable row level security;

    drop policy if exists "Users can read own subscriptions" on public.user_subscriptions;
    create policy "Users can read own subscriptions"
    on public.user_subscriptions
    for select
    to authenticated
    using (auth.uid() = user_id);
  end if;
end $$;
