"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RealtimeMotionListener() {
  const [motionLogs, setMotionLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const formatDateToEgyptTime = (dateString: string) => {
    const date = new Date(dateString);
    date.setHours(date.getHours() + 3);
    return date.toLocaleString("en-EG", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  useEffect(() => {
    const fetchMotionLogs = async () => {
      const { data, error } = await supabase
        .from("pir_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching motion logs:", error);
      } else {
        setMotionLogs(data);
        setLoading(false);
      }
    };

    fetchMotionLogs();

    const channel = supabase
      .channel("pir_logs_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pir_logs",
        },
        (payload) => {
          console.log("Motion change received:", payload);

          switch (payload.eventType) {
            case "INSERT":
              setMotionLogs((prev) => [payload.new, ...prev]);
              break;
            case "UPDATE":
              setMotionLogs((prev) =>
                prev.map((log) =>
                  log.id === payload.new.id ? payload.new : log
                )
              );
              break;
            case "DELETE":
              setMotionLogs((prev) =>
                prev.filter((log) => log.id !== payload.old.id)
              );
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="text-gray-500 animate-pulse text-center p-4">
        Loading motion logs...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <h3 className="text-lg font-semibold mb-4 text-gray-700">
        Realtime Motion Detection Logs
      </h3>
      <ul className="space-y-3 max-h-[300px] overflow-y-auto">
        {motionLogs.map((log) => (
          <li
            key={log.id}
            className="flex justify-between items-center bg-gray-50 rounded-md p-3 shadow-sm hover:bg-gray-100 transition"
          >
            <span className="text-sm text-gray-800">
              {formatDateToEgyptTime(log.created_at)}
            </span>
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${
                log.motion
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {log.motion ? "Motion Detected" : "No Motion"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
