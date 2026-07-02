create table if not exists snag_questions (
  id            uuid primary key default gen_random_uuid(),
  snag_id       uuid not null references snags(id) on delete cascade,
  project_id    uuid not null references projects(id) on delete cascade,
  share_token   text not null,
  body          text not null,
  created_at    timestamptz not null default now(),
  reply_body    text,
  replied_at    timestamptz
);

create index if not exists snag_questions_snag_id_idx    on snag_questions(snag_id);
create index if not exists snag_questions_project_id_idx on snag_questions(project_id);
create index if not exists snag_questions_share_token_idx on snag_questions(share_token);

alter table snag_questions enable row level security;
-- All access via admin client (service role) only — no public RLS policies needed.
