import React, { useEffect, useState } from "react";
import PageContainer from "../components/PageContainer";
import BackgroundWrapper from "../components/BackgroundWrapper";
import { supabase } from "../supabaseClient";

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) {
      setExpenses(data || []);
      setTotal((data || []).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0));
    }
  }

  async function handleAddExpense(e) {
    e.preventDefault();
    if (!amount || !description) return;
    setLoading(true);
    const { error } = await supabase
      .from("expenses")
      .insert([{ amount, description }]);
    setLoading(false);
    if (!error) {
      setAmount("");
      setDescription("");
      fetchExpenses();
    }
  }

  async function handleDeleteExpense(id) {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id);
    if (!error) {
      fetchExpenses();
    }
  }

  return (
    <BackgroundWrapper>
      <PageContainer title="EXPENSES">
        {/* Add Expense Form */}
        <form onSubmit={handleAddExpense} className="flex flex-col gap-2 px-4 pb-4">
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount (₹)"
            className="rounded-lg px-3 py-2 border border-yellow-400 bg-white/70 focus:outline-none text-black"
            value={amount}
            onChange={e => setAmount(e.target.value)}
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
            {loading ? "Adding..." : "Add Expense"}
          </button>
        </form>

        {/* Total Expenses */}
        <div className="px-6 pb-2">
          <div className="flex justify-between items-center bg-yellow-100 rounded-xl p-3 mb-2 shadow">
            <span className="font-semibold text-yellow-900 text-lg">Total</span>
            <span className="font-bold text-xl text-yellow-900">₹ {total}</span>
          </div>
        </div>

        {/* Expenses List */}
        <div className="px-3 pb-8 mt-2">
          {expenses.length === 0 ? (
            <div className="text-yellow-800 text-center py-8">No expenses yet.</div>
          ) : (
            <ul className="flex flex-col gap-2">
              {expenses.map((exp) => (
                <li
                  key={exp.id}
                  className="rounded-xl shadow p-3 flex flex-col bg-white/80 backdrop-blur-md border-l-4 border-yellow-400 relative"
                  style={{
                    minHeight: "54px",
                  }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-yellow-900 text-lg">₹ {exp.amount}</span>
                    <span className="text-xs text-yellow-700">
                      {exp.created_at
                        ? new Date(exp.created_at).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                  <span className="text-yellow-800 text-sm">{exp.description}</span>
                  <button
                    onClick={() => handleDeleteExpense(exp.id)}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full px-2 py-1 text-xs font-bold shadow transition"
                    title="Delete"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PageContainer>
    </BackgroundWrapper>
  );
}
