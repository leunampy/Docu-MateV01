-- Migration: Create uploaded_documents table
-- Created: 2024-01-01

create table if not exists uploaded_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  file_name text not null,
  file_type text not null,
  file_size bigint not null,
  storage_path text not null,
  extracted_text text,
  identified_fields jsonb,
  ocr_applied boolean default false,
  status text default 'uploaded',
  error_message text,
  created_at timestamptz default now()
);

-- Indexes for better query performance
create index if not exists idx_uploaded_documents_user_id on uploaded_documents(user_id);
create index if not exists idx_uploaded_documents_status on uploaded_documents(status);
create index if not exists idx_uploaded_documents_created_at on uploaded_documents(created_at desc);

-- RLS (Row Level Security) policies
alter table uploaded_documents enable row level security;

-- Policy: Users can only see their own uploaded documents
create policy "Users can view own uploaded documents"
  on uploaded_documents
  for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own uploaded documents
create policy "Users can insert own uploaded documents"
  on uploaded_documents
  for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own uploaded documents
create policy "Users can update own uploaded documents"
  on uploaded_documents
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Users can delete their own uploaded documents
create policy "Users can delete own uploaded documents"
  on uploaded_documents
  for delete
  using (auth.uid() = user_id);

