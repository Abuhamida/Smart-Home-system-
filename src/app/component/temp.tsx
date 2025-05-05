"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RealtimeTemperatureListener() {
  const [temperatureLogs, setTemperatureLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const formatDateToEgyptTime = (dateString: string) => {
    const date = new Date(dateString);
  
    // Convert to UTC first, then adjust for Egypt time (UTC+3)
    const egyptTime = new Date(date.getTime()); // Add 3 hours to UTC
  
    return egyptTime.toLocaleString("en-EG", {
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
    const fetchTemperatureLogs = async () => {
      const { data, error } = await supabase
        .from("temp_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching temperature logs:", error);
      } else {
        setTemperatureLogs(data);
        setLoading(false);
      }
    };

    fetchTemperatureLogs();

    const channel = supabase
      .channel("temp_logs_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "temp_logs",
        },
        (payload) => {
          console.log("Temperature change received:", payload);

          switch (payload.eventType) {
            case "INSERT":
              setTemperatureLogs((prev) => [payload.new, ...prev]);
              break;
            case "UPDATE":
              setTemperatureLogs((prev) =>
                prev.map((log) =>
                  log.id === payload.new.id ? payload.new : log
                )
              );
              break;
            case "DELETE":
              setTemperatureLogs((prev) =>
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
        Loading temperature logs...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <h3 className="text-lg font-semibold mb-4 text-gray-700">
        Realtime Temperature Logs
      </h3>
      <ul className="space-y-3 max-h-[300px] overflow-y-auto">
        {temperatureLogs.map((log) => (
          <li
            key={log.id}
            className="flex justify-between items-center bg-gray-50 rounded-md p-3 shadow-sm hover:bg-gray-100 transition"
          >
            <span className="text-sm text-gray-800">
              {formatDateToEgyptTime(log.created_at)}
            </span>
            <span className="text-sm font-medium text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
              {log.temperature}°C
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
