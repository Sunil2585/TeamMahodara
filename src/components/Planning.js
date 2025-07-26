import React, { useState, useEffect, useCallback } from "react";
import PageContainer from "./PageContainer";
import BackgroundWrapper from "./BackgroundWrapper";
import { supabase } from "../supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { EllipsisVerticalIcon, TrashIcon } from "@heroicons/react/24/solid";

const ADMIN_EMAILS = [
  "sambangisunil12@gmail.com",
  // Add other admin emails here
];

export default function Planning() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [plannedItems, setPlannedItems] = useState([]);
  const [itemName, setItemName] = useState("");
  const [itemAmount, setItemAmount] = useState("");
  const [itemType, setItemType] = useState("expense"); // 'expense' or 'income'
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    if (user) {
      setIsAdmin(ADMIN_EMAILS.includes(user.email));
    }
  }, [user]);

  const fetchPlanningItems = useCallback(async () => {
    const { data, error } = await supabase
      .from("planning")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching planning items:", error);
      setError("Could not fetch planning data. Make sure the 'planning' table exists.");
    } else {
      setPlannedItems(data || []);
    }
  }, []);

  useEffect(() => {
    fetchPlanningItems();
    const subscription = supabase
      .channel('public:planning')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'planning' }, fetchPlanningItems)
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchPlanningItems]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!itemName.trim() || !itemAmount || isNaN(Number(itemAmount)) || Number(itemAmount) <= 0) {
      setError("Please enter a valid name and a positive amount.");
      return;
    }
    setLoading(true);
    setError(null);

    const { data: newItem, error: insertError } = await supabase
      .from("planning")
      .insert([{ name: itemName.trim(), amount: Number(itemAmount), type: itemType }])
      .select()
      .single();

    if (insertError) {
      setError("Failed to add item. " + insertError.message);
    } else {
      setItemName("");
      setItemAmount("");
      // Update state locally for a faster UI response
      setPlannedItems((prev) => [newItem, ...prev]);
    }
    setLoading(false);
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    const { error: deleteError } = await supabase.from("planning").delete().eq("id", id);
    if (deleteError) {
      setError("Failed to delete item. " + deleteError.message);
    } else {
      // Update state locally for a faster UI response
      setPlannedItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const plannedIncome = plannedItems
    .filter((item) => item.type === "income")
    .reduce((acc, item) => acc + item.amount, 0);

  const plannedExpenses = plannedItems
    .filter((item) => item.type === "expense")
    .reduce((acc, item) => acc + item.amount, 0);

  const netBalance = plannedIncome - plannedExpenses;

  return (
    <BackgroundWrapper>
      <PageContainer title="EVENT PLANNING">
        <div className="px-4 pb-8">
          {/* Admin Form */}
          {isAdmin && (
            <form onSubmit={handleAddItem} className="bg-white/20 p-4 rounded-xl mb-6 shadow-md">
              <h3 className="font-bold text-lg text-yellow-900 mb-2">Add Planning Item</h3>
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Item Name (e.g., DJ, Catering)"
                  className="rounded-lg px-3 py-2 border border-yellow-400 bg-white/70 focus:outline-none text-black"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  required
                />
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  className="rounded-lg px-3 py-2 border border-yellow-400 bg-white/70 focus:outline-none text-black"
                  value={itemAmount}
                  onChange={(e) => setItemAmount(e.target.value)}
                  required
                />
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-yellow-900 font-semibold">
                    <input type="radio" name="itemType" value="expense" checked={itemType === 'expense'} onChange={() => setItemType('expense')} />
                    Expense
                  </label>
                  <label className="flex items-center gap-2 text-yellow-900 font-semibold">
                    <input type="radio" name="itemType" value="income" checked={itemType === 'income'} onChange={() => setItemType('income')} />
                    Income
                  </label>
                </div>
                <button type="submit" disabled={loading} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 rounded-lg transition disabled:bg-gray-400">
                  {loading ? "Adding..." : "Add Item"}
                </button>
                {error && <div className="text-red-500 text-sm text-center">{error}</div>}
              </div>
            </form>
          )}

          {/* Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-100 rounded-xl p-4 shadow">
              <h3 className="font-bold text-green-900">Planned Income</h3>
              <p className="font-extrabold text-2xl text-green-900">₹{plannedIncome.toLocaleString()}</p>
            </div>
            <div className="bg-red-100 rounded-xl p-4 shadow">
              <h3 className="font-bold text-red-900">Planned Expenses</h3>
              <p className="font-extrabold text-2xl text-red-900">₹{plannedExpenses.toLocaleString()}</p>
            </div>
            <div className={`${netBalance >= 0 ? 'bg-blue-100' : 'bg-orange-100'} rounded-xl p-4 shadow`}>
              <h3 className={`font-bold ${netBalance >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>Expected Net</h3>
              <p className={`font-extrabold text-2xl ${netBalance >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>₹{netBalance.toLocaleString()}</p>
            </div>
          </div>

          {/* Lists Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Planned Expenses List */}
            <div>
              <h3 className="font-bold text-xl text-red-800 mb-3 bg-red-100 p-2 rounded-lg">Expenses</h3>
              <ul className="flex flex-col gap-2">
                {plannedItems.filter(i => i.type === 'expense').map(item => (
                  <li key={item.id} className="bg-red-100 p-3 rounded-lg shadow-sm flex justify-between items-center relative">
                    <span className="font-semibold text-red-800">{item.name}</span>
                    <span className="font-bold text-red-900">₹{item.amount.toLocaleString()}</span>
                    {isAdmin && (
                      <div className="absolute top-1 right-1">
                        <button onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)} className="p-1 rounded-full hover:bg-red-100 transition">
                          <EllipsisVerticalIcon className="w-5 h-5 text-gray-700" />
                        </button>
                        {openMenuId === item.id && (
                          <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-10 border">
                            <button onClick={() => { handleDeleteItem(item.id); setOpenMenuId(null); }} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                              <TrashIcon className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Planned Income List */}
            <div>
              <h3 className="font-bold text-xl text-green-800 mb-3 bg-green-100 p-2 rounded-lg">Income</h3>
              <ul className="flex flex-col gap-2">
                {plannedItems.filter(i => i.type === 'income').map(item => (
                  <li key={item.id} className="bg-green-100 p-3 rounded-lg shadow-sm flex justify-between items-center relative">
                    <span className="font-semibold text-green-800">{item.name}</span>
                    <span className="font-bold text-green-900">₹{item.amount.toLocaleString()}</span>
                    {isAdmin && (
                      <div className="absolute top-1 right-1">
                        <button onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)} className="p-1 rounded-full hover:bg-green-100 transition">
                          <EllipsisVerticalIcon className="w-5 h-5 text-gray-700" />
                        </button>
                        {openMenuId === item.id && (
                          <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-10 border">
                            <button onClick={() => { handleDeleteItem(item.id); setOpenMenuId(null); }} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                              <TrashIcon className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </PageContainer>
    </BackgroundWrapper>
  );
}