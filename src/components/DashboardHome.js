import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Ganseshback from "../assets/hjsk.png";
import logo from "../assets/Tmlogo.jpg";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDaysIcon, PlusIcon } from "@heroicons/react/24/solid";

export default function Dashboard() {
  const [summary, setSummary] = useState({
    expenses: 0,
    contributions: 0,
    tasks: 0,
    totalExpenses: 0,
    totalContributions: 0,
  });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAuthAndFetchName() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login", { replace: true });
      } else {
        const { data: userData } = await supabase
          .from("users")
          .select("name")
          .eq("id", user.id)
          .single();
        setUserName(userData?.name || "User");
      }
    }
    checkAuthAndFetchName();
  }, [navigate]);

  useEffect(() => {
    async function fetchSummary() {
      const [exp, cont, task] = await Promise.all([
        supabase.from("expenses").select("id,amount"),
        supabase.from("contributions").select("id,amount"),
        supabase.from("tasks").select("id"),
      ]);
      const totalExpenses =
        exp.data?.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) || 0;
      const totalContributions =
        cont.data?.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0) || 0;
      setSummary({
        expenses: exp.data?.length || 0,
        contributions: cont.data?.length || 0,
        tasks: task.data?.length || 0,
        totalExpenses,
        totalContributions,
      });
    }
    async function fetchUpcomingEvents() {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("events")
        .select("*")
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(3);
      setUpcomingEvents(data || []);
    }
    fetchSummary();
    fetchUpcomingEvents();
  }, []);

  const expensesAmount = `₹ ${summary.totalExpenses}`;
  const contributionsAmount = `₹ ${summary.totalContributions}`;
  const tasksProgress = `${summary.tasks}`;
  const remainingBudget = `₹ ${summary.totalContributions - summary.totalExpenses}`;

  const cards = [
    {
      label: "Expenses",
      value: expensesAmount,
      to: "/expenses",
      icon: "₹",
      iconColor: "#E65100",
      valueColor: "#E65100",
      labelColor: "#E65100",
      bg: "rgba(255,243,224,0.7)",
    },
    {
      label: "Contributions",
      value: contributionsAmount,
      to: "/contributions",
      icon: "₹",
      iconColor: "#FFA500",
      valueColor: "#FFA500",
      labelColor: "#FFA500",
      bg: "rgba(255,253,231,0.7)",
    },
    {
      label: "Tasks",
      value: tasksProgress,
      to: "/tasks",
      icon: "📝",
      iconColor: "#0288D1",
      valueColor: "#0288D1",
      labelColor: "#0288D1",
      bg: "rgba(225,245,254,0.7)",
    },
    {
      label: "Remaining Budget",
      value: remainingBudget,
      to: "#",
      icon: "💰",
      iconColor: "#388E3C",
      valueColor: "#388E3C",
      labelColor: "#388E3C",
      bg: "rgba(232,245,233,0.7)",
    },
  ];

  // Delete event handler
  async function handleDeleteEvent(eventId) {
    if (window.confirm("Are you sure you want to delete this event?")) {
      const { error } = await supabase.from("events").delete().eq("id", eventId);
      if (!error) {
        setUpcomingEvents((prev) => prev.filter(ev => ev.id !== eventId));
      }
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: `url(${Ganseshback})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        className="rounded-[36px] w-full max-w-[380px] h-auto shadow-lg border-4 border-yellow-500 flex flex-col relative overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.10)",
        }}
      >
        {/* Header with logo and profile */}
        <div className="absolute top-0 left-0 w-full flex justify-between items-center px-6 pt-4 z-10">
          <div className="w-full flex items-center justify-between">
            <Link
              to="/info"
              className="rounded-full bg-white/40 backdrop-blur-md border-2 border-yellow-400 px-6 py-2 flex-1 flex items-center justify-center shadow-md"
              style={{ minHeight: 56, textDecoration: "none" }}
            >
              <img
                src={logo}
                alt="Team Mahodara Logo"
                className="w-12 h-13 mr-3"
                style={{ objectFit: "contain" }}
              />
              <span className="text-xl font-extrabold text-yellow-800 tracking-wide">
                TEAM MAHODARA
              </span>
            </Link>
            <Link
              to="/profile"
              className="ml-3 flex items-center gap-2 py-1 px-3 rounded-full bg-white/60 shadow text-[#E65100] font-semibold text-sm hover:bg-orange-100 transition-all duration-300"
              style={{ zIndex: 10, cursor: "pointer" }}
              tabIndex={0}
              aria-label="Go to Profile"
            >
              <span className="text-lg">👤</span> Profile
            </Link>
          </div>
        </div>

        {/* Spacer for dome */}
        <div className="pt-20" />
        {/* Dashboard Title and Welcome */}
        <div className="pb-2 px-6">
          <div
            className="flex justify-center items-center mb-8 mt-8"
            style={{
              background: "linear-gradient(90deg, #FFF3E0 0%, #FFE0B2 100%)",
              borderRadius: "1.5rem",
              boxShadow: "0 2px 12px 0 rgba(255,193,7,0.10)",
              padding: "0.75rem 0",
            }}
          >
            <h2
              className="text-center text-2xl font-extrabold tracking-wide"
              style={{
                color: "#E65100",
                fontFamily: "'Poppins', 'Segoe UI', Arial, sans-serif",
                letterSpacing: "0.05em",
                textShadow: "0 2px 8px #ffe0b2",
              }}
            >
              DASHBOARD
            </h2>
          </div>
          <div
            className="flex justify-center"
            style={{
              marginTop: "1.5rem",
              marginBottom: "0.5rem",
            }}
          >
            <span
              className="px-4 py-2 rounded-xl font-semibold text-lg shadow"
              style={{
                background: "linear-gradient(90deg, #FFF3E0 0%, #FFE0B2 100%)",
                color: "#E65100",
                fontWeight: 700,
                letterSpacing: "0.04em",
                boxShadow: "0 2px 8px #ffe0b2",
                border: "2px solid #FFD700",
                display: "inline-block",
              }}
            >
              Welcome, <span className="font-extrabold">{userName}</span> 👋
            </span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 gap-2 px-3 pb-8 mt-4">
          {cards.map((card) => (
            <a
              key={card.label}
              href={card.to}
              className="rounded-xl shadow p-2 flex flex-col items-center justify-center gap-1 transition"
              style={{
                minHeight: "54px",
                fontSize: "0.95rem",
                background: card.bg,
                backdropFilter: "blur(2px)",
              }}
            >
              <span className="text-xl mb-0.5" style={{ color: card.iconColor }}>{card.icon}</span>
              <span className="text-xs font-semibold" style={{ color: card.labelColor }}>{card.label}</span>
              <span className="text-sm font-bold mt-0.5" style={{ color: card.valueColor }}>
                {card.value}
              </span>
            </a>
          ))}
          {/* Upcoming Events Block */}
          <div className="col-span-2 rounded-xl shadow p-4 flex flex-col items-center justify-center gap-2 bg-[#F3E5F5]/80 transition"
            style={{
              minHeight: "80px",
              fontSize: "1.1rem",
              background: "rgba(243,229,245,0.7)",
              backdropFilter: "blur(2px)",
            }}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="w-5 h-5 text-yellow-700" />
                <span className="font-bold text-yellow-900">Upcoming Events</span>
              </div>
              <Link
                to="/events"
                className="flex items-center gap-1 bg-yellow-100 border border-yellow-400 rounded-full px-2 py-1 text-xs font-semibold text-yellow-900 shadow hover:bg-yellow-200 transition"
                title="Add/View Events"
              >
                <PlusIcon className="w-4 h-4" />
                Add Event
              </Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <div className="text-gray-500 text-xs">No upcoming events.</div>
            ) : (
              <ul className="space-y-1 w-full">
                {upcomingEvents.map(ev => (
                  <li key={ev.id} className="text-sm text-yellow-800 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-semibold">{ev.title}</span>
                      <span className="text-xs text-gray-600">{new Date(ev.date).toLocaleDateString()}</span>
                    </div>
                    <button
                      className="ml-2 px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition"
                      onClick={() => handleDeleteEvent(ev.id)}
                      title="Delete Event"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
