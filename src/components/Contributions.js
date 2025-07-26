import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import PageContainer from "../components/PageContainer";
import BackgroundWrapper from "../components/BackgroundWrapper";
import { useAuth } from "../hooks/useAuth";
import { EllipsisVerticalIcon, TrashIcon } from "@heroicons/react/24/solid";
const ADMIN_EMAILS = [
  "sambangisunil12@gmail.com",
  // Add other admin emails here
];

export default function Contributions() {
  const { user } = useAuth();
  const [contributions, setContributions] = useState([]);
  const [contributor, setContributor] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    const fetchProfileAndCheckAdmin = async () => {
      if (user) {
        setIsAdmin(ADMIN_EMAILS.includes(user.email));
        // Use .single() and handle the potential error if no profile exists yet.
        const { data, error: profileError } = await supabase
          .from("users")
          .select("name")
          .eq("id", user.id)
          .single();
        if (profileError && profileError.code !== 'PGRST116') {
          // PGRST116 means no rows found, which is not a critical error here.
          // We can log other errors for debugging.
          console.error("Error fetching user profile:", profileError);
        } else if (data?.name) {
          setContributor(data.name);
        }
      }
    };
    fetchProfileAndCheckAdmin();
  }, [user]);

  const fetchContributions = useCallback(async () => {
    setInitialLoading(true);
    const { data, error: fetchError } = await supabase
      .from("contributions")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) setError("Failed to fetch contributions.");
    else setContributions(data || []);
    setInitialLoading(false);
  }, []);

  useEffect(() => {
    fetchContributions();
  }, [fetchContributions]);

  const handleDeleteContribution = async (id) => {
    if (!window.confirm("Are you sure you want to delete this contribution?")) {
      return;
    }
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from("contributions")
        .delete()
        .eq("id", id);

      if (deleteError) {
        throw deleteError;
      }
      // Update state locally for a faster UI response
      setContributions((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err.message || "Failed to delete contribution.");
      console.error("Error deleting contribution:", err);
    }
  };
  const handlePayOnline = async () => {
    if (!validateForm()) return; // Stop if form is invalid

    setLoading(true);
    setError(null);

    try {
      // Step 1: Create a 'pending' contribution record in the database.
      const { data: newContribution, error: insertError } = await supabase
        .from("contributions")
        .insert([{
          contributor: contributor.trim(),
          amount: +amount,
          method: "online",
          status: "pending",
        }])
        .select()
        .single();

      if (insertError) {
        throw new Error("Could not save your contribution record. Please try again.");
      }

      // Step 2: Invoke the edge function to get a payment session ID.
      const { data: functionData, error: functionError } = await supabase.functions.invoke('create-cashfree-order', {
        body: {
          amount: +amount,
          contributor: contributor.trim(),
          // Ensure the ID is a string, as the edge function expects.
          contribution_id: String(newContribution.id),
        },
      });

      if (functionError) {
        // The generic error is "Edge Function returned a non-2xx status code".
        // We need to parse the JSON body from the error response to get the real message.
        // The 'context' property of the functionError is the raw Response object.
        let detailedErrorMessage = "An unknown error occurred with the payment function.";
        if (functionError.context && typeof functionError.context.json === 'function') {
          try {
            const errorBody = await functionError.context.json();
            detailedErrorMessage = errorBody.error || functionError.message;
          } catch (e) {
            // If parsing fails, use the default Supabase client error message.
            detailedErrorMessage = functionError.message;
          }
        }
        throw new Error(detailedErrorMessage);
      }

      if (!functionData?.payment_session_id) {
        throw new Error("Failed to get a valid payment session from the server.");
      }

      // Step 3: Use the Cashfree SDK to redirect to checkout.
      if (!window.Cashfree) {
        throw new Error("Payment SDK (Cashfree) is not loaded. Please refresh the page.");
      }

      // The SDK mode MUST match the environment of the Edge Function.
      // Since the function uses production keys, the mode here must be "production".
      // Using a sandbox session_id in production mode (or vice-versa) will cause this error.
      const cashfree = new window.Cashfree({ mode: "production" });

      const result = await cashfree.checkout({
        paymentSessionId: functionData.payment_session_id,
        paymentStyle: "redirect"
      });

      if (result?.error) {
        // This error is from the Cashfree SDK itself after trying to process the checkout.
        throw new Error(`Payment Gateway Error: ${result.error.message}`);
      }
      // On successful redirect, the browser navigates away. The `finally` block might not run.

    } catch (err) {
      console.error("Payment process failed:", err);
      // Provide a user-friendly error message.
      setError(err.message || "An unexpected error occurred during payment initiation.");
    } finally {
      // This ensures the loading state is always reset, especially if the user
      // closes a payment modal (if not using redirect) or if an error occurs.
      setLoading(false);
    }
  };

  const handleAddContribution = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from("contributions").insert([
        { contributor: contributor.trim(), amount: +amount, method: "cash", status: "success" },
      ]);

      if (insertError) {
        throw new Error(insertError.message || "Could not record cash contribution.");
      }

      setAmount(""); // Only clear amount on success
      fetchContributions();
    } catch (err) {
      console.error("Failed to add cash contribution:", err);
      setError("Failed to add cash contribution. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    setError(null);
    if (!contributor.trim() || !amount || isNaN(+amount) || +amount <= 0) {
      setError("Please enter a valid name and a positive amount.");
      return false;
    }
    return true;
  };

  const total = contributions
    .filter(c => c.status === 'success')
    .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

  return (
    <BackgroundWrapper>
      <PageContainer title="CONTRIBUTIONS" userName={contributor}>
        <div className="flex flex-col gap-2 px-4 pb-4">
          <input
            type="text"
            placeholder="Contributor Name"
            className="rounded-lg px-3 py-2 border border-yellow-400 bg-white/70 focus:outline-none text-black"
            value={contributor}
            onChange={(e) => setContributor(e.target.value)}
            required
          />
          <input
            type="number"
            min="1"
            placeholder="Amount (₹)"
            className="rounded-lg px-3 py-2 border border-yellow-400 bg-white/70 focus:outline-none text-black"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          {error && <div className="text-red-500 text-sm text-center p-2 bg-red-100 rounded">{error}</div>}
          
          <div className="flex gap-2">
            {isAdmin && (
              <button onClick={handleAddContribution} disabled={loading} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 rounded-lg transition disabled:bg-gray-400">
                {loading ? "Processing..." : "Add Cash"}
              </button>
            )}
            <button onClick={handlePayOnline} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition disabled:bg-gray-400">
              {loading ? "Processing..." : "Pay Online"}
            </button>
          </div>
        </div>

        {/* Total Contributions */}
        <div className="px-6 pb-2">
          <div className="flex justify-between items-center bg-green-100 rounded-xl p-3 mb-2 shadow">
            <span className="font-semibold text-green-900 text-lg">Total Contributions</span>
            <span className="font-bold text-xl text-green-900">₹ {total.toFixed(2)}</span>
          </div>
        </div>

        {/* Contributions List */}
        <div className="px-3 pb-8 mt-2">
          {initialLoading ? (
            <div className="text-yellow-800 text-center py-8">Loading contributions...</div>
          ) : contributions.length === 0 ? (
            <div className="text-yellow-800 text-center py-8">No contributions yet.</div>
          ) : (
            <ul className="flex flex-col gap-2">
              {contributions.map((c) => (
                <li
                  key={c.id}
                  className={`rounded-xl shadow p-3 flex flex-col relative ${
                    c.status === 'success' ? 'bg-green-100 border-green-400' : 'bg-yellow-100 border-yellow-400'
                  } border-l-4`}
                >
                  <div className={`flex justify-between items-start mb-1 ${isAdmin ? 'pr-8' : ''}`}>
                    <span className="font-bold text-lg text-slate-800">{c.contributor}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      c.status === 'success' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                    }`}>{c.status}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="font-bold text-xl text-slate-900">₹{c.amount}</span>
                    <span className="text-xs text-gray-600 capitalize">via {c.method}</span>
                  </div>
                  {isAdmin && (
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                        className="p-1 rounded-full hover:bg-gray-200/80 transition"
                        title="More options"
                      >
                        <EllipsisVerticalIcon className="w-5 h-5 text-gray-700" />
                      </button>
                      {openMenuId === c.id && (
                        <div className="absolute right-0 mt-2 w-36 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                          <button
                            onClick={() => {
                              handleDeleteContribution(c.id);
                              setOpenMenuId(null);
                            }}
                            className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                          >
                            <TrashIcon className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </PageContainer>
    </BackgroundWrapper>
  );
}