-- wardrobe_items
create table if not exists wardrobe_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  image_url text,
  thumbnail_url text,
  category text,
  sub_category text,
  primary_color text,
  secondary_colors text[] default '{}',
  pattern text,
  formality text[] default '{}',
  season text[] default '{}',
  fit text,
  style_tags text[] default '{}',
  best_for text[] default '{}',
  ai_confidence float,
  ai_notes text,
  user_notes text default '',
  times_worn int default 0,
  last_worn_date date,
  is_favorite boolean default false,
  brand text default '',
  purchase_price numeric,
  condition text default 'excellent',
  date_added timestamptz default now()
);
alter table wardrobe_items enable row level security;
create policy "Users can manage their own wardrobe items"
  on wardrobe_items for all using (auth.uid() = user_id);

-- scent_items
create table if not exists scent_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  brand text not null,
  image_url text,
  scent_family text,
  notes text[] default '{}',
  season text[] default '{}',
  occasion text[] default '{}',
  intensity text,
  ai_tags text[] default '{}',
  user_notes text default '',
  is_favorite boolean default false,
  date_added timestamptz default now()
);
alter table scent_items enable row level security;
create policy "Users can manage their own scents"
  on scent_items for all using (auth.uid() = user_id);

-- saved_outfits
create table if not exists saved_outfits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  item_ids uuid[] default '{}',
  scent_id uuid references scent_items(id) on delete set null,
  occasion text,
  ai_explanation text,
  scent_explanation text,
  rating int,
  times_worn int default 0,
  last_worn_date date,
  is_favorite boolean default false,
  date_created timestamptz default now(),
  season text[] default '{}'
);
alter table saved_outfits enable row level security;
create policy "Users can manage their own outfits"
  on saved_outfits for all using (auth.uid() = user_id);

-- style_profiles
create table if not exists style_profiles (
  user_id uuid references auth.users(id) on delete cascade primary key,
  preferred_styles text[] default '{}',
  preferred_colors text[] default '{}',
  avoid_colors text[] default '{}',
  preferred_fit text default '',
  budget_min numeric default 0,
  budget_max numeric default 500,
  currency text default 'USD',
  goals text default ''
);
alter table style_profiles enable row level security;
create policy "Users can manage their own style profile"
  on style_profiles for all using (auth.uid() = user_id);

-- user_plans
create table if not exists user_plans (
  user_id uuid references auth.users(id) on delete cascade primary key,
  plan text default 'free',
  wardrobe_items_count int default 0,
  ai_analyses_this_month int default 0,
  outfit_generations_this_month int default 0,
  updated_at timestamptz default now()
);
alter table user_plans enable row level security;
create policy "Users can view and update their own plan"
  on user_plans for all using (auth.uid() = user_id);
