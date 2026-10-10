import React, { useState } from "react";
import { useRealtimeNotifications } from "../hooks/useRealtimeNotifications";

export default function NotificationListener() {
  const [notifications, setNotifications] = useState([]);

  useRealtimeNotifications((notif) => {
    setNotifications((prev) => [...prev, notif]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter(n => n.id !== notif.id));
    }, 5000); // auto-dismiss after 5 seconds
  });

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="bg-yellow-500 text-white px-4 py-2 rounded shadow"
        >
          {notif.message}
        </div>
      ))}
    </div>
  );
}
