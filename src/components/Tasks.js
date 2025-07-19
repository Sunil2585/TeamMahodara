import React, { useEffect, useState } from "react";
import PageContainer from "../components/PageContainer";
import BackgroundWrapper from "../components/BackgroundWrapper";
import { supabase } from "../supabaseClient";
import { useAuth } from "../hooks/useAuth"; // 1. Import the useAuth hook

export default function Tasks() {
  const { user } = useAuth(); // 2. Get the authenticated user object
  const [currentUserProfile, setCurrentUserProfile] = useState(null); // 3. State to hold the user's profile

  const [tasks, setTasks] = useState([]);
  const [member, setMember] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);

  // 4. New useEffect to fetch the current user's profile when the component loads
  useEffect(() => {
    const fetchCurrentUserProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("users") // Assuming your profiles table is named 'users'
          .select("name, photo")
          .eq("id", user.id) // Fetch profile using the user's ID
          .single();

        if (!error && data) {
          setCurrentUserProfile(data);
        }
      }
    };

    fetchCurrentUserProfile();
    fetchTasks();
    fetchMembers();
  }, [user]); // Rerun this effect if the user object changes

  async function fetchTasks() {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setTasks(data || []);
  }

  async function fetchMembers() {
    const { data, error } = await supabase
      .from("users")
      .select("name, photo")
      .not("name", "is", null)
      .neq("name", "");
    if (!error) setMembers(data || []);
  }

  async function handleAddTask(e) {
    e.preventDefault();
    if (!member || !priority || !description) return;
    setLoading(true);

    const { error } = await supabase.from("tasks").insert([
      { member, priority, description, status: "Pending" }
    ]);
    setLoading(false);

    if (!error) {
      setMember("");
      setPriority("Medium");
      setDescription("");
      fetchTasks();
      await supabase.from("notifications").insert([
        { message: `Task assigned to ${member}: "${description}"`, type: "task" }
      ]);
    }
  }

  async function updateTaskStatus(id, status) {
    await supabase.from("tasks").update({ status }).eq("id", id);
    fetchTasks();
  }
  
  async function handleDeleteTask(id) {
    // Using a custom modal/confirm is better, but window.confirm is simple
    if (window.confirm("Are you sure you want to delete this task?")) {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (!error) {
        fetchTasks();
      } else {
        console.error("Error deleting task:", error.message);
      }
    }
  }

  return (
    <BackgroundWrapper>
      {/* Pass the fetched profile name to the container */}
      <PageContainer title="TASKS" userName={currentUserProfile?.name || ""}>
        {/* Add Task Form */}
        <form onSubmit={handleAddTask} className="flex flex-col gap-2 px-4 pb-4">
          <select
            className="rounded-lg px-3 py-2 border border-yellow-400 bg-white/70 focus:outline-none text-black"
            value={member}
            onChange={e => setMember(e.target.value)}
            required
          >
            <option value="">Assign to Member</option>
            {members.map((m, idx) => (
              <option key={idx} value={m.name}>{m.name}</option>
            ))}
          </select>
          <select
            className="rounded-lg px-3 py-2 border border-yellow-400 bg-white/70 focus:outline-none text-black"
            value={priority}
            onChange={e => setPriority(e.target.value)}
            required
          >
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
          <input
            type="text"
            placeholder="Task Description"
            className="rounded-lg px-3 py-2 border border-yellow-400 bg-white/70 focus:outline-none text-black"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 rounded-lg transition"
          >
            {loading ? "Adding..." : "Add Task"}
          </button>
        </form>
        {/* Tasks List */}
        <div className="grid grid-cols-1 gap-2 px-3 pb-8 mt-4">
          {tasks.map((task) => {
            const memberObj = members.find(m => m.name === task.member);
            return (
              <div
                key={task.id}
                className="rounded-xl shadow p-2 flex flex-col items-start justify-center gap-1 transition"
                style={{
                  minHeight: "54px",
                  fontSize: "0.95rem",
                  background: "rgba(255,255,255,0.35)",
                  backdropFilter: "blur(2px)",
                  color: "#1e293b",
                }}
              >
                <span className="text-xs font-semibold flex items-center gap-2">
                  <span className="font-bold text-yellow-800">Member:</span> {task.member}
                  {memberObj?.photo && (
                    <img src={memberObj.photo} alt="profile" className="w-6 h-6 rounded-full object-cover border-2 border-yellow-400" />
                  )}
                </span>
                <span className="text-xs font-semibold">
                  <span className="font-bold text-orange-700">Priority:</span> {task.priority}
                </span>
                <span className="text-xs font-semibold">
                  <span className="font-bold text-blue-700">Status:</span> {task.status || "Pending"}
                </span>
                <span className="text-sm font-bold mt-0.5">{task.description}</span>
                
                {/* 5. This check now uses the reliable profile name from state */}
                {currentUserProfile && task.member === currentUserProfile.name && (
                  <div className="flex gap-2 mt-2">
                    {task.status !== "In Progress" && task.status !== "Completed" && (
                      <button
                        className="px-2 py-1 rounded bg-blue-500 text-white text-xs"
                        onClick={() => updateTaskStatus(task.id, "In Progress")}
                        type="button"
                      >
                        Mark In Progress
                      </button>
                    )}
                    {task.status !== "Completed" && (
                      <button
                        className="px-2 py-1 rounded bg-green-600 text-white text-xs"
                        onClick={() => updateTaskStatus(task.id, "Completed")}
                        type="button"
                      >
                        Mark Completed
                      </button>
                    )}
                    <button
                      className="px-2 py-1 rounded bg-red-600 text-white text-xs"
                      onClick={() => handleDeleteTask(task.id)}
                      type="button"
                    >
                      Delete Task
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </PageContainer>
    </BackgroundWrapper>
  );
}
