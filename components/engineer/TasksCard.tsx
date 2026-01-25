"use client";

import { useState } from "react";
import { TrendingUp, CheckCircle2, Clock } from "lucide-react";

export default function TasksCard() {
  // Placeholder for tasks - can be connected to actual tasks API later
  const tasks = [
    { id: 1, title: "Complete foundation work", status: "in_progress" },
    { id: 2, title: "Install electrical wiring", status: "pending" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-purple-500" />
        <h2 className="text-xl font-semibold text-slate-900">My Tasks</h2>
      </div>

      {tasks.length === 0 ? (
        <p className="text-slate-500 text-sm">No tasks assigned</p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                {task.status === "completed" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <Clock className="w-5 h-5 text-amber-500" />
                )}
                <p className="text-sm font-medium text-slate-900">{task.title}</p>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  task.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : task.status === "in_progress"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {task.status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
