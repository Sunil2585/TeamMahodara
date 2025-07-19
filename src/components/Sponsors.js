import React, { useEffect, useState } from "react";
import PageContainer from "../components/PageContainer";
import BackgroundWrapper from "../components/BackgroundWrapper";
import { supabase } from "../supabaseClient";
import { FaTrash } from "react-icons/fa"; // For delete icon

export default function Sponsors() {
  const [sponsors, setSponsors] = useState([]);
  const [name, setName] = useState("");
  const [item, setItem] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSponsors();
  }, []);

  async function fetchSponsors() {
    const { data, error } = await supabase
      .from("sponsors")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setSponsors(data || []);
  }

  async function handleAddSponsor(e) {
    e.preventDefault();
    if (!name || !item || !description) return;
    setLoading(true);
    const { error } = await supabase
      .from("sponsors")
      .insert([{ name, item, description }]);
    setLoading(false);
    if (!error) {
      setName("");
      setItem("");
      setDescription("");
      fetchSponsors();
    }
  }

  async function handleDeleteSponsor(id) {
    if (!window.confirm("Are you sure you want to delete this sponsor?")) return;
    const { error } = await supabase
      .from("sponsors")
      .delete()
      .eq("id", id);
    if (!error) {
      fetchSponsors();
    }
  }

  return (
    <BackgroundWrapper>
      <PageContainer title="SPONSORS">
        {/* Add Sponsor Form */}
        <form onSubmit={handleAddSponsor} className="flex flex-col gap-2 px-4 pb-4">
          <input
            type="text"
            placeholder="Sponsor Name"
            className="rounded-lg px-3 py-2 border border-yellow-400 bg-white/70 focus:outline-none text-black"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Sponsored Item"
            className="rounded-lg px-3 py-2 border border-yellow-400 bg-white/70 focus:outline-none text-black"
            value={item}
            onChange={e => setItem(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Description"
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
            {loading ? "Adding..." : "Add Sponsor"}
          </button>
        </form>
        {/* Sponsors List */}
        <div className="grid grid-cols-2 gap-2 px-3 pb-8 mt-4">
          {sponsors.map((s) => (
            <div
              key={s.id}
              className="relative rounded-xl shadow p-2 flex flex-col items-center justify-center gap-1 transition"
              style={{
                minHeight: "54px",
                fontSize: "0.95rem",
                background: "rgba(255,255,255,0.35)",
                backdropFilter: "blur(2px)",
              }}
            >
              <button
                onClick={() => handleDeleteSponsor(s.id)}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 text-xs shadow transition"
                title="Delete"
                style={{ zIndex: 10 }}
              >
                <FaTrash size={12} />
              </button>
              <span className="text-xl mb-0.5">🪔</span>
              <span className="text-xs font-semibold">{s.name}</span>
              <span className="text-xs font-semibold">{s.item}</span>
              <span className="text-sm font-bold mt-0.5">{s.description}</span>
            </div>
          ))}
        </div>
      </PageContainer>
    </BackgroundWrapper>
  );
}
