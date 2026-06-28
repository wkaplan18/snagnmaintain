-- Run this in the Supabase SQL editor

create table if not exists org_invites (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid references organizations(id) on delete cascade not null,
  email      text not null,
  role       text not null default 'admin',
  token      uuid not null default gen_random_uuid(),
  invited_by uuid references auth.users(id),
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '7 days'),
  accepted_at timestamptz,
  unique(org_id, email)
);

alter table org_invites enable row level security;

-- Org members can read their org's pending invites
create policy "org_members_read_invites" on org_invites
  for select using (
    org_id in (select org_id from org_members where user_id = auth.uid())
  );

-- Org members can send invites for their org
create policy "org_members_insert_invites" on org_invites
  for insert with check (
    org_id in (select org_id from org_members where user_id = auth.uid())
  );

-- Org members can cancel invites for their org
create policy "org_members_delete_invites" on org_invites
  for delete using (
    org_id in (select org_id from org_members where user_id = auth.uid())
  );
