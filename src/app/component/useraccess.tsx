'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RealtimeRFIDListener() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const formatDateToEgyptTime = (dateString: string) => {
    const date = new Date(dateString);
    date.setHours(date.getHours() + 3); // Adjust for Egypt time (UTC+3)
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
    const fetchUsers = async () => {
      const { data, error } = await supabase.from("rfid_users").select("*");

      if (error) {
        console.error("Error fetching users:", error);
      } else {
        setUsers(data);
        setLoading(false);
      }
    };

    fetchUsers();

    const channel = supabase
      .channel("rfid_users_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rfid_users",
        },
        (payload) => {
          console.log("Realtime change received:", payload);

          switch (payload.eventType) {
            case "INSERT":
              setUsers((prevUsers) => [...prevUsers, payload.new]);
              break;
            case "UPDATE":
              setUsers((prevUsers) =>
                prevUsers.map((user) =>
                  user.uid === payload.new.uid ? payload.new : user
                )
              );
              break;
            case "DELETE":
              setUsers((prevUsers) =>
                prevUsers.filter((user) => user.uid !== payload.old.uid)
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
        Loading RFID users...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <h3 className="text-lg font-semibold mb-4 text-gray-700">
        Realtime RFID User Logs
      </h3>
      <ul className="space-y-3 max-h-[300px] overflow-y-auto">
        {users.map((user) => (
          <li
            key={user.uid}
            className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center bg-gray-50 rounded-md p-3 shadow-sm hover:bg-gray-100 transition"
          >
            <div className="text-sm text-gray-800">
              <strong>{user.username || "Unnamed User"}</strong> — UID:{" "}
              <span className="font-mono text-gray-600">{user.uid}</span>
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  user.authorized
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {user.authorized ? "Authorized" : "Not Authorized"}
              </span>
            </div>
            {user.scanned_at && (
              <div className="text-xs text-gray-500 mt-2 sm:mt-0 sm:text-right">
                Scanned at: {formatDateToEgyptTime(user.scanned_at)}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
