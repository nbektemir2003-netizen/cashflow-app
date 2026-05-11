-- Run this in Supabase SQL Editor (supabase.com → your project → SQL Editor)

create table cashflow_plans (
  user_id uuid references auth.users(id) on delete cascade primary key,
  plan jsonb not null default '{}',
  updated_at timestamptz default now()
);

create table cashflow_transactions (
  id text not null,
  user_id uuid references auth.users(id) on delete cascade,
  category_id text not null,
  amount numeric not null,
  timestamp bigint not null,
  note text,
  primary key (user_id, id)
);

create table cashflow_balances (
  user_id uuid references auth.users(id) on delete cascade,
  month_key text not null,
  amount numeric not null,
  primary key (user_id, month_key)
);

-- Row Level Security (users see only their own data)
alter table cashflow_plans enable row level security;
alter table cashflow_transactions enable row level security;
alter table cashflow_balances enable row level security;

create policy "own data only" on cashflow_plans for all using (auth.uid() = user_id);
create policy "own data only" on cashflow_transactions for all using (auth.uid() = user_id);
create policy "own data only" on cashflow_balances for all using (auth.uid() = user_id);
