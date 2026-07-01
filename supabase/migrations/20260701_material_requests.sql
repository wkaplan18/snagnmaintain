-- Run this in the Supabase SQL editor

create table if not exists material_requests (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid references organizations(id) on delete cascade not null,
  project_id   uuid references projects(id) on delete cascade not null,
  requested_by uuid references auth.users(id),
  item         text not null,
  quantity     text,
  urgency      text not null default 'normal', -- 'normal' | 'urgent'
  notes        text,
  status       text not null default 'pending', -- 'pending' | 'ordered' | 'fulfilled'
  status_note  text,
  ordered_at   timestamptz,
  fulfilled_at timestamptz,
  created_at   timestamptz default now()
);

alter table material_requests enable row level security;

-- Org members can read their org's requests
create policy "org_members_read_material_requests" on material_requests
  for select using (
    org_id in (select org_id from org_members where user_id = auth.uid())
  );

-- Org members can create requests
create policy "org_members_insert_material_requests" on material_requests
  for insert with check (
    org_id in (select org_id from org_members where user_id = auth.uid())
  );

-- Org members can update status (office staff marking ordered/fulfilled)
create policy "org_members_update_material_requests" on material_requests
  for update using (
    org_id in (select org_id from org_members where user_id = auth.uid())
  );
