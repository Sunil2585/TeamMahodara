import React, { useEffect, useState, useCallback } from "react";
import PageContainer from "./PageContainer";
import BackgroundWrapper from "./BackgroundWrapper";
import { supabase } from "../supabaseClient";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  
  const fetchEvents = useCallback(async () => {
    const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: true });
    if (error) {
        console.error("Error fetching events:", error);
    } else {
        setEvents(data || []);
    }
  }, []);
  
    useEffect(() => {
      fetchEvents();
  
      const subscription = supabase
          .channel('public:events')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, fetchEvents)
          .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }, [fetchEvents]);

  async function handleAddEvent(e) {
    e.preventDefault();
    if (!title || !date) return;
    setLoading(true);
    const { error } = await supabase
      .from("events")
      .insert([{ title, date, description }]);
    setLoading(false);
    if (!error) {
      setTitle("");
      setDate("");
      setDescription("");
      fetchEvents();
    }
  }

  async function handleDeleteEvent(id) {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id);
    if (!error) {
      fetchEvents();
    }
  }

  return (
    <BackgroundWrapper>
      <PageContainer title="EVENTS" userName="Samba">
        {/* Add Event Form */}
        <form onSubmit={handleAddEvent} className="flex flex-col gap-2 px-4 pb-4">
          <input
            type="text"
            placeholder="Event Title"
            className="rounded-lg px-3 py-2 border border-yellow-400 bg-white/70 focus:outline-none text-black"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <input
            type="date"
            className="rounded-lg px-3 py-2 border border-yellow-400 bg-white/70 focus:outline-none text-black"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
          <textarea
            placeholder="Description (optional)"
            className="rounded-lg px-3 py-2 border border-yellow-400 bg-white/70 focus:outline-none text-black"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 rounded-lg transition"
          >
            {loading ? "Adding..." : "Add Event"}
          </button>
        </form>
        {/* Events List */}
        <div className="grid grid-cols-1 gap-2 px-3 pb-8 mt-4">
          {events.length === 0 && (
            <div className="text-yellow-900 font-semibold text-center">No events found.</div>
          )}
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-xl shadow p-2 flex flex-col gap-1 bg-white/60"
              style={{
                minHeight: "54px",
                fontSize: "0.95rem",
                backdropFilter: "blur(2px)",
                color: "#1e293b",
              }}
            >
              <span className="text-lg font-bold text-yellow-800">{event.title}</span>
              <span className="text-xs font-semibold text-orange-700">
                {event.date && new Date(event.date).toLocaleDateString()}
              </span>
              {event.description && (
                <span className="text-sm text-gray-700">{event.description}</span>
              )}
               {/* Delete Button */}
               <button
                  onClick={() => handleDeleteEvent(event.id)}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full px-2 py-1 text-xs font-bold shadow transition"
                  title="Delete"
                >
                  Delete
                </button>
            </div>
          ))}
        </div>
      </PageContainer>
    </BackgroundWrapper>
  );
}