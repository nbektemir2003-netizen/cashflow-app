-- Run this in Supabase SQL Editor (supabase.com → your project → SQL Editor)
-- If upgrading existing project, only run the blocks marked "if upgrading"

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

-- Custom categories (if upgrading: run from here)
create table if not exists cashflow_categories (
  user_id uuid references auth.users(id) on delete cascade primary key,
  categories jsonb not null default '[]'
);

alter table cashflow_categories enable row level security;
create policy "own data only" on cashflow_categories for all using (auth.uid() = user_id);

-- Accounts (if upgrading: run from here)
create table if not exists cashflow_accounts (
  user_id uuid references auth.users(id) on delete cascade primary key,
  accounts jsonb not null default '[]'
);

alter table cashflow_accounts enable row level security;
create policy "own data only" on cashflow_accounts for all using (auth.uid() = user_id);

-- Transfers between accounts (if upgrading: run from here)
create table if not exists cashflow_transfers (
  id text not null,
  user_id uuid references auth.users(id) on delete cascade,
  from_account_id text not null,
  to_account_id text not null,
  amount numeric not null,
  timestamp bigint not null,
  note text,
  primary key (user_id, id)
);

alter table cashflow_transfers enable row level security;
create policy "own data only" on cashflow_transfers for all using (auth.uid() = user_id);

-- Recurring payments (if upgrading: run from here)
create table if not exists cashflow_recurring (
  user_id uuid references auth.users(id) on delete cascade primary key,
  payments jsonb not null default '[]'
);

alter table cashflow_recurring enable row level security;
create policy "own data only" on cashflow_recurring for all using (auth.uid() = user_id);
