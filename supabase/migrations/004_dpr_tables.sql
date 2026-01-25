-- TASKS TABLE (if not already existing)
create table if not exists tasks (
  task_id text primary key,
  task_name text not null,
  category text,
  assigned_worker_id text,
  status text default 'In Progress',
  created_at timestamp default now()
);

-- TASK UPDATES TABLE
create table if not exists task_updates (
  update_id text primary key,
  task_id text references tasks(task_id) on delete cascade,
  worker_id text,

  spoken_audio_url text,
  full_text text,
  short_summary text,

  photos text[],
  videos text[],

  sync_status text default 'pending',
  created_at timestamp default now()
);
