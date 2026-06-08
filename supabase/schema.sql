-- Run this in your Supabase SQL Editor to set up the database

-- Profiles table (one per user)
create table if not exists profiles (
  id              uuid primary key references auth.users on delete cascade,
  balance         numeric(12,2) not null default 1000,
  starting_balance numeric(12,2) not null default 1000,
  created_at      timestamptz default now()
);

-- Per-game statistics per user
create table if not exists game_stats (
  id           bigserial primary key,
  user_id      uuid references auth.users on delete cascade,
  game         text not null,
  total_bets   int  not null default 0,
  total_wagered numeric(12,2) not null default 0,
  total_won    numeric(12,2) not null default 0,
  net_profit   numeric(12,2) not null default 0,
  biggest_win  numeric(12,2) not null default 0,
  biggest_loss numeric(12,2) not null default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique(user_id, game)
);

-- Individual bet history
create table if not exists bet_history (
  id          bigserial primary key,
  user_id     uuid references auth.users on delete cascade,
  game        text not null,
  bet_amount  numeric(12,2) not null,
  payout      numeric(12,2) not null,
  profit      numeric(12,2) not null,
  multiplier  numeric(12,4) not null,
  result      text not null check (result in ('win','loss')),
  created_at  timestamptz default now()
);

-- Row Level Security
alter table profiles   enable row level security;
alter table game_stats enable row level security;
alter table bet_history enable row level security;

-- Policies: users can only read/write their own data
create policy "Own profile" on profiles   for all using (auth.uid() = id);
create policy "Own stats"   on game_stats for all using (auth.uid() = user_id);
create policy "Own history" on bet_history for all using (auth.uid() = user_id);
