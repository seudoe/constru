"use client";

import { useState } from "react";
import VoiceRecorder from "@/components/dpr/VoiceRecorder";
import {
  getTodayUpdateCount,
  generateUpdateId,
  saveTaskUpdate,
} from "@/lib/dpr";

const TASKS = [
  { id: "TASK_1023", name: "Brickwork - Block B - Floor 1" },
  { id: "TASK_1024", name: "Plastering - Block A - Floor 2" },
  { id: "TASK_1025", name: "Wiring - Block C - Floor 1" },
];

export default function NewUpdatePage() {
  const [taskId, setTaskId] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!taskId || !text.trim()) {
      setError("Please select a task and record the update.");
      return;
    }

    try {
      setLoading(true);

      const count = await getTodayUpdateCount(taskId);
      const updateId = generateUpdateId(taskId, count + 1);

      const update = {
        update_id: updateId,
        task_id: taskId,
        worker_id: "W_008", // later from auth
        full_text: text,
        short_summary: text.split(".")[0],
        photos: [],
        videos: [],
        sync_status: "pending",
        created_at: new Date().toISOString(),
      };

      await saveTaskUpdate(update);

      alert(`Update saved as ${updateId}`);

      // Reset form
      setText("");
      setTaskId("");
    } catch (err: any) {
      console.error(err);
      setError("Failed to save update. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Daily Work Update</h1>

      {/* Task Selector */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Select Task
        </label>
        <select
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          className="border p-2 w-full rounded"
        >
          <option value="">-- Select Task --</option>
          {TASKS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Voice Input */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Speak Update
        </label>
        <VoiceRecorder onText={setText} />
      </div>

      {/* Text Preview */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Update Text
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Spoken text will appear here"
          className="border p-2 w-full rounded h-24"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Update"}
      </button>
    </div>
  );
}
