-- ============================================================
-- 확장 기능
-- ============================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- 프로필
-- ============================================================
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  display_name text not null,
  avatar_url text,
  push_token text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
alter table profiles enable row level security;
create policy "본인 프로필 조회" on profiles for select using (true);
create policy "본인 프로필 수정" on profiles for update using (auth.uid() = id);

-- 유저 생성 시 자동으로 profiles 삽입
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 그룹
-- ============================================================
create table groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  invite_code text unique not null,
  owner_id uuid references profiles(id) on delete set null,
  created_at timestamptz default now() not null
);
alter table groups enable row level security;

create table group_members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  role text check (role in ('owner','member')) default 'member' not null,
  joined_at timestamptz default now() not null,
  unique (group_id, user_id)
);
alter table group_members enable row level security;

create policy "그룹 멤버 조회" on groups for select
  using (exists (select 1 from group_members where group_id = id and user_id = auth.uid()));
create policy "그룹 생성" on groups for insert with check (auth.uid() is not null);
create policy "그룹 수정 (오너)" on groups for update using (owner_id = auth.uid());

create policy "멤버 조회" on group_members for select
  using (user_id = auth.uid() or exists (
    select 1 from group_members gm2 where gm2.group_id = group_id and gm2.user_id = auth.uid()
  ));
create policy "멤버 추가" on group_members for insert with check (auth.uid() is not null);

-- ============================================================
-- 일정
-- ============================================================
create table schedules (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade not null,
  creator_id uuid references profiles(id) not null,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  is_all_day boolean default false not null,
  is_personal boolean default false not null,
  color text default '#6366f1' not null,
  remind_options text[] default '{}' not null,
  created_at timestamptz default now() not null
);
alter table schedules enable row level security;
create policy "일정 조회" on schedules for select
  using (exists (select 1 from group_members where group_id = schedules.group_id and user_id = auth.uid()));
create policy "일정 생성" on schedules for insert
  with check (exists (select 1 from group_members where group_id = schedules.group_id and user_id = auth.uid()));
create policy "일정 수정/삭제 (작성자)" on schedules for all using (creator_id = auth.uid());

create table schedule_participants (
  id uuid primary key default uuid_generate_v4(),
  schedule_id uuid references schedules(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  unique (schedule_id, user_id)
);
alter table schedule_participants enable row level security;
create policy "참여자 조회" on schedule_participants for select using (true);
create policy "참여자 관리" on schedule_participants for all
  using (exists (select 1 from schedules where id = schedule_id and creator_id = auth.uid()));

-- ============================================================
-- 계좌 (암호화 저장)
-- ============================================================
create table bank_accounts (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade not null,
  bank_code text not null,
  bank_name text not null,
  account_number_enc text not null,
  "fintechUseNum" text,
  access_token_enc text,
  refresh_token_enc text,
  alias text not null,
  created_at timestamptz default now() not null
);
alter table bank_accounts enable row level security;
create policy "계좌 조회" on bank_accounts for select
  using (exists (select 1 from group_members where group_id = bank_accounts.group_id and user_id = auth.uid()));
create policy "계좌 관리 (오너)" on bank_accounts for all
  using (exists (select 1 from groups where id = group_id and owner_id = auth.uid()));

-- ============================================================
-- 거래 내역
-- ============================================================
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade not null,
  bank_account_id uuid references bank_accounts(id) on delete set null,
  type text check (type in ('income','expense')) not null,
  amount bigint not null,
  description text not null,
  merchant_name text,
  category text not null default 'etc',
  tags text[] default '{}' not null,
  transacted_at timestamptz not null,
  is_manual boolean default false not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now() not null
);
alter table transactions enable row level security;
create policy "거래 조회" on transactions for select
  using (exists (select 1 from group_members where group_id = transactions.group_id and user_id = auth.uid()));
create policy "거래 추가" on transactions for insert
  with check (exists (select 1 from group_members where group_id = transactions.group_id and user_id = auth.uid()));
create policy "거래 수정/삭제" on transactions for all using (created_by = auth.uid());

-- ============================================================
-- 정산
-- ============================================================
create table settlements (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade not null,
  requester_id uuid references profiles(id) not null,
  target_user_id uuid references profiles(id) not null,
  transaction_ids uuid[] not null,
  total_amount bigint not null,
  status text check (status in ('pending','sender_confirmed','completed','cancelled')) default 'pending' not null,
  sender_proof_url text,
  requester_proof_url text,
  completed_at timestamptz,
  created_at timestamptz default now() not null
);
alter table settlements enable row level security;
create policy "정산 조회" on settlements for select
  using (requester_id = auth.uid() or target_user_id = auth.uid());
create policy "정산 생성" on settlements for insert with check (requester_id = auth.uid());
create policy "정산 수정" on settlements for update
  using (requester_id = auth.uid() or target_user_id = auth.uid());

-- ============================================================
-- 위시리스트
-- ============================================================
create table wishlist_items (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade not null,
  creator_id uuid references profiles(id) not null,
  title text not null,
  reason text,
  estimated_price bigint,
  link text,
  vote_deadline timestamptz,
  purchase_date date,
  status text check (status in ('voting','approved','rejected','purchased')) default 'voting' not null,
  created_at timestamptz default now() not null
);
alter table wishlist_items enable row level security;
create policy "위시리스트 조회" on wishlist_items for select
  using (exists (select 1 from group_members where group_id = wishlist_items.group_id and user_id = auth.uid()));
create policy "위시리스트 추가" on wishlist_items for insert
  with check (exists (select 1 from group_members where group_id = wishlist_items.group_id and user_id = auth.uid()));
create policy "위시리스트 수정" on wishlist_items for update
  using (creator_id = auth.uid() or exists (select 1 from groups where id = group_id and owner_id = auth.uid()));

create table wishlist_voters (
  id uuid primary key default uuid_generate_v4(),
  wishlist_item_id uuid references wishlist_items(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  unique (wishlist_item_id, user_id)
);
alter table wishlist_voters enable row level security;
create policy "투표권자 조회" on wishlist_voters for select using (true);
create policy "투표권자 지정" on wishlist_voters for insert
  with check (exists (select 1 from wishlist_items wi join groups g on g.id = wi.group_id where wi.id = wishlist_item_id and (wi.creator_id = auth.uid() or g.owner_id = auth.uid())));

create table wishlist_votes (
  id uuid primary key default uuid_generate_v4(),
  wishlist_item_id uuid references wishlist_items(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  vote text check (vote in ('approve','reject')) not null,
  voted_at timestamptz default now() not null,
  unique (wishlist_item_id, user_id)
);
alter table wishlist_votes enable row level security;
create policy "투표 조회" on wishlist_votes for select using (true);
create policy "투표 참여" on wishlist_votes for insert
  with check (exists (select 1 from wishlist_voters where wishlist_item_id = wishlist_votes.wishlist_item_id and user_id = auth.uid()));

-- ============================================================
-- 주식 관심종목 / 내 주식
-- ============================================================
create table stock_watchlist (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  symbol text not null,
  name text not null,
  market text check (market in ('KR','US')) not null,
  created_at timestamptz default now() not null,
  unique (group_id, user_id, symbol)
);
alter table stock_watchlist enable row level security;
create policy "관심종목 조회" on stock_watchlist for select
  using (exists (select 1 from group_members where group_id = stock_watchlist.group_id and user_id = auth.uid()));
create policy "관심종목 관리" on stock_watchlist for all using (user_id = auth.uid());

create table my_stocks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  group_id uuid references groups(id) on delete cascade not null,
  symbol text not null,
  name text not null,
  market text check (market in ('KR','US')) not null,
  purchase_price numeric(18,2) not null,
  quantity numeric(18,4) not null,
  created_at timestamptz default now() not null
);
alter table my_stocks enable row level security;
create policy "내 주식 조회" on my_stocks for select
  using (exists (select 1 from group_members where group_id = my_stocks.group_id and user_id = auth.uid()));
create policy "내 주식 관리" on my_stocks for all using (user_id = auth.uid());

-- ============================================================
-- 언제와? / --했어? / 뭐먹지?
-- ============================================================
create table when_are_you_coming (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade not null,
  sender_id uuid references profiles(id) not null,
  receiver_id uuid references profiles(id) not null,
  expected_at timestamptz,
  status text check (status in ('pending','responded','arrived','missed')) default 'pending' not null,
  is_kept boolean,
  created_at timestamptz default now() not null
);
alter table when_are_you_coming enable row level security;
create policy "언제와 조회" on when_are_you_coming for select
  using (sender_id = auth.uid() or receiver_id = auth.uid());
create policy "언제와 생성" on when_are_you_coming for insert with check (sender_id = auth.uid());
create policy "언제와 수정" on when_are_you_coming for update
  using (sender_id = auth.uid() or receiver_id = auth.uid());

create table did_you_do (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade not null,
  sender_id uuid references profiles(id) not null,
  receiver_id uuid references profiles(id) not null,
  content text not null,
  scheduled_date date,
  scheduled_time time,
  status text check (status in ('pending','responded')) default 'pending' not null,
  response_check boolean,
  response_memo text,
  responded_at timestamptz,
  created_at timestamptz default now() not null
);
alter table did_you_do enable row level security;
create policy "했어 조회" on did_you_do for select
  using (sender_id = auth.uid() or receiver_id = auth.uid());
create policy "했어 생성" on did_you_do for insert with check (sender_id = auth.uid());
create policy "했어 수정" on did_you_do for update
  using (sender_id = auth.uid() or receiver_id = auth.uid());

create table what_to_eat (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade not null,
  creator_id uuid references profiles(id) not null,
  participant_ids uuid[] not null,
  meal_date date not null,
  meal_type text check (meal_type in ('breakfast','lunch','dinner','latenight','snack')) not null,
  status text check (status in ('collecting','tournament','done')) default 'collecting' not null,
  winner text,
  created_at timestamptz default now() not null
);
alter table what_to_eat enable row level security;
create policy "뭐먹지 조회" on what_to_eat for select
  using (creator_id = auth.uid() or auth.uid() = any(participant_ids));
create policy "뭐먹지 생성" on what_to_eat for insert with check (creator_id = auth.uid());
create policy "뭐먹지 수정" on what_to_eat for update
  using (creator_id = auth.uid() or auth.uid() = any(participant_ids));

create table what_to_eat_entries (
  id uuid primary key default uuid_generate_v4(),
  what_to_eat_id uuid references what_to_eat(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  food_name text not null,
  is_eliminated boolean default false not null
);
alter table what_to_eat_entries enable row level security;
create policy "음식 항목 조회" on what_to_eat_entries for select using (true);
create policy "음식 항목 관리" on what_to_eat_entries for all using (user_id = auth.uid());

-- ============================================================
-- 위치 공유 (Realtime)
-- ============================================================
create table user_locations (
  user_id uuid primary key references profiles(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade not null,
  latitude double precision not null,
  longitude double precision not null,
  updated_at timestamptz default now() not null
);
alter table user_locations enable row level security;
create policy "위치 조회" on user_locations for select
  using (exists (select 1 from group_members where group_id = user_locations.group_id and user_id = auth.uid()));
create policy "위치 수정" on user_locations for all using (user_id = auth.uid());

-- Realtime 활성화
alter publication supabase_realtime add table user_locations;
alter publication supabase_realtime add table when_are_you_coming;
alter publication supabase_realtime add table what_to_eat;
alter publication supabase_realtime add table what_to_eat_entries;
alter publication supabase_realtime add table settlements;
