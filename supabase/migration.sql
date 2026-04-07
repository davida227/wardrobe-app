-- ============================================
-- WARDROBE MANAGER — Supabase Migration
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable RLS
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- Clothing items
create table clothing_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  category text not null,
  color text default '',
  pattern text default '',
  fabric text default '',
  formality text default '',
  seasons text[] default '{}',
  notes text default '',
  image_url text default '',
  thumbnail_url text default '',
  needs_own_photo boolean default false,
  created_at timestamptz default now()
);

alter table clothing_items enable row level security;
create policy "Users can CRUD own items" on clothing_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Saved outfits
create table saved_outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text default '',
  occasion text default '',
  styling_tips text default '',
  item_ids uuid[] default '{}',
  created_at timestamptz default now()
);

alter table saved_outfits enable row level security;
create policy "Users can CRUD own outfits" on saved_outfits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Outfit history
create table outfit_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  item_ids uuid[] default '{}',
  outfit_name text default '',
  occasion text default '',
  event_name text default '',
  notes text default '',
  created_at timestamptz default now()
);

alter table outfit_history enable row level security;
create policy "Users can CRUD own history" on outfit_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- User profiles
create table user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  measurements jsonb default '{}',
  style_notes text default '',
  preferred_model text default 'claude-sonnet-4-20250514',
  updated_at timestamptz default now()
);

alter table user_profiles enable row level security;
create policy "Users can CRUD own profile" on user_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into user_profiles (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Storage bucket for clothing images
insert into storage.buckets (id, name, public)
values ('clothing-images', 'clothing-images', true)
on conflict (id) do nothing;

create policy "Users can upload own images" on storage.objects
  for insert with check (bucket_id = 'clothing-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view own images" on storage.objects
  for select using (bucket_id = 'clothing-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own images" on storage.objects
  for delete using (bucket_id = 'clothing-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Public can view clothing images" on storage.objects
  for select using (bucket_id = 'clothing-images');

-- Indexes
create index idx_clothing_items_user on clothing_items(user_id);
create index idx_saved_outfits_user on saved_outfits(user_id);
create index idx_outfit_history_user_date on outfit_history(user_id, date);
