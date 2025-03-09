-- Create payments table
create table public.payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  stripe_payment_id text,
  amount bigint not null,
  currency text not null,
  status text not null check (status in ('succeeded', 'failed')),
  created_at timestamptz default now() not null
);

-- Set up RLS (Row Level Security)
alter table public.payments enable row level security;

-- Create policy to allow users to read their own payments
create policy "Users can read their own payments"
  on public.payments
  for select
  using (auth.uid() = user_id);

-- Create policy to allow service role to insert payments
create policy "Service role can insert payments"
  on public.payments
  for insert
  with check (true);

-- Grant access to authenticated users
grant select on public.payments to authenticated;
