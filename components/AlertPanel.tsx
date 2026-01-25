"use client"

import { useEffect, useState } from "react"
import { subscribeToTable } from "@/lib/realtime"

interface Alert {
  id: string
  type: string
  message: string
  level: string
  created_at: string
}

export default function AlertPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([])

  useEffect(() => {
    const unsubscribe = subscribeToTable<Alert>(
      "alerts",
      (payload) => {
        if (payload.eventType === "INSERT") {
          setAlerts(prev => [payload.new!, ...prev])
        }
      }
    )

    return () => unsubscribe()
  }, [])

  return (
    <div className="fixed bottom-5 left-5 w-80 bg-white border border-[#e6dccf] rounded-xl shadow-xl overflow-hidden">
      <div className="bg-[#efe6d8] px-4 py-2 font-semibold">
        🚨 Live Alerts
      </div>

      <div className="max-h-80 overflow-y-auto divide-y">
        {alerts.map(a => (
          <div
            key={a.id}
            className={`
              p-3 text-sm transition
              ${a.level === "High" ? "bg-red-50 animate-pulse" : ""}
            `}
          >
            <p className="font-semibold">{a.type}</p>
            <p className="text-gray-600">{a.message}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(a.created_at).toLocaleTimeString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
