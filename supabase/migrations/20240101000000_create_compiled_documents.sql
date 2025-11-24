-- Migration: Create compiled_documents table
-- Created: 2024-01-01

create table if not exists compiled_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  original_file_name text not null,
  original_file_url text not null,
  compiled_file_url text not null,
  company_profile_id uuid references company_profiles(id) on delete set null,
  fields_mapping jsonb,
  created_at timestamptz default now()
);

-- Indexes for better query performance
create index if not exists idx_compiled_documents_user_id on compiled_documents(user_id);
create index if not exists idx_compiled_documents_company_profile_id on compiled_documents(company_profile_id);
create index if not exists idx_compiled_documents_created_at on compiled_documents(created_at desc);

-- RLS (Row Level Security) policies
alter table compiled_documents enable row level security;

-- Policy: Users can only see their own compiled documents
create policy "Users can view own compiled documents"
  on compiled_documents
  for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own compiled documents
create policy "Users can insert own compiled documents"
  on compiled_documents
  for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own compiled documents
create policy "Users can update own compiled documents"
  on compiled_documents
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Users can delete their own compiled documents
create policy "Users can delete own compiled documents"
  on compiled_documents
  for delete
  using (auth.uid() = user_id);

