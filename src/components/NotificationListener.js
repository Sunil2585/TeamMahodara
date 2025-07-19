import React, { useState, useCallback } from "react";
import { useRealtimeNotifications } from "../hooks/useRealtimeNotifications";

export default function NotificationListener() {
  const [notifications, setNotifications] = useState([]);

  // By wrapping this handler in useCallback, we ensure it's not recreated on every render.
  // This stabilizes the useEffect inside the useRealtimeNotifications hook.
  const handleNewNotification = useCallback((notif) => {
    // Add the new notification to the state
    setNotifications((prev) => [...prev, notif]);
    // Set a timer to remove it after 5 seconds for auto-dismissal
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    }, 5000);
  }, []);

  useRealtimeNotifications(handleNewNotification);

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
