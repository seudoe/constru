export type Task = {
  task_id: string;
  task_name: string;
  category?: string;
  assigned_worker_id?: string;
  status: string;
  created_at: string;
};

export type TaskUpdate = {
  update_id: string;
  task_id: string;
  worker_id: string;

  spoken_audio_url?: string;
  full_text?: string;
  short_summary?: string;

  photos: string[];
  videos: string[];

  sync_status: "pending" | "synced";
  created_at: string;
};
