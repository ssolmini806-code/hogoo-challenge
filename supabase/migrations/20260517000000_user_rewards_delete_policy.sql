drop policy if exists "Users can delete own rewards" on public.user_rewards;
create policy "Users can delete own rewards"
on public.user_rewards
for delete
to authenticated
using (auth.uid() = user_id);
