import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import PageContainer from "../components/PageContainer";
import BackgroundWrapper from "../components/BackgroundWrapper";
import { useAuth } from "../hooks/useAuth";

export default function Contributions() {
  const { user } = useAuth();
  const [contributions, setContributions] = useState([]);
  const [contributor, setContributor] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from("users")
          .select("name")
          .eq("id", user.id)
          .single();
        if (data?.name) {
          setContributor(data.name);
        }
      }
    };
    fetchProfile();
  }, [user]);

  const fetchContributions = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("contributions")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) setError("Failed to fetch contributions.");
    else setContributions(data || []);
  }, []);

  useEffect(() => {
    fetchContributions();
  }, [fetchContributions]);

  const handlePayOnline = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setError(null); // Clear previous errors

    let newContribution;
    try {
      const { data, error: insertError } = await supabase
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
        throw new Error(insertError.message || "Could not save contribution.");
      }
      newContribution = data;
    } catch (err) {
      setError(`Database error: ${err.message}`);
      setLoading(false);
      return;
    }

    try {
      console.log("Invoking 'create-cashfree-order' function with:", {
        amount: +amount,
        contributor: contributor.trim(),
        contribution_id: newContribution.id,
      });

      // Call the Supabase Edge Function
      const { data: functionData, error: functionError } = await supabase.functions.invoke('create-cashfree-order', {
        body: {
          amount: +amount,
          contributor: contributor.trim(),
          contribution_id: newContribution.id,
          return_url: window.location.origin + "/contributions",
        },
      });


      console.log("Function response:", { functionData, functionError });

      if (functionError) {
        // Extract detailed error from function response body
        let detailedError = functionError.message;
        if (functionError.context) {
          try {
            // functionError.context is a Deno/browser Response object
            const errorBody = await functionError.context.json();
            detailedError = errorBody.error || errorBody.message || detailedError;
          } catch (_) {
            try {
              const textBody = await functionError.context.text();
              if (textBody) detailedError = textBody;
            } catch (_) {}
          }
        }
        throw new Error(detailedError);
      }


      if (functionData && functionData.payment_session_id) {
        console.log("Received payment session ID:", functionData.payment_session_id);
        
        if (!window.Cashfree) {
          throw new Error("Cashfree SDK is not loaded. Please check your index.html file.");
        }

        // Initialize the SDK with the mode. The SDK is throwing an error if this is not provided.
        const cashfreeMode = process.env.REACT_APP_CASHFREE_MODE || 'sandbox';
        const cashfree = new window.Cashfree({
          mode: cashfreeMode, // Use environment variable. Defaults to 'sandbox'.
        });
        
        console.log("Initiating Cashfree redirect...");
        cashfree.checkout({ 
          paymentSessionId: functionData.payment_session_id, // Pass the session ID here as the error suggests
          paymentStyle: "redirect"
        }).then((result) => {
          if (result.error) {
            // This is a specific error from the Cashfree SDK if the session_id is invalid
            console.error("Cashfree SDK reported an error:", result.error);
            setError(`Payment Error: ${result.error.message}. Please check the console for details.`);
            setLoading(false);
          }
          // If result.redirect is true, the browser will navigate away. No need to do anything.
        }).catch(err => {
          // This catches other potential errors during checkout initialization
          console.error("Error during cashfree.checkout() call:", err);
          setError(`A problem occurred with the payment gateway: ${err.message}`);
          setLoading(false);
        });
      } else {
        // This case handles when the function runs but doesn't return the expected data.
        throw new Error("Failed to get a valid payment session from the server.");
      }

    } catch (err) {
      // This will catch errors from the function invocation, or from our own thrown errors.
      console.error("Payment process error:", err);
      setError(`Payment initiation failed: ${err.message}`);
      setLoading(false);
    }
  };

  const handleAddContribution = async () => {
    if (!validateForm()) return;
    setLoading(true);
    const { error: insertError } = await supabase.from("contributions").insert([
      { contributor: contributor.trim(), amount: +amount, method: "cash", status: "success" },
    ]);
    setLoading(false);
    if (!insertError) {
      setAmount("");
      fetchContributions();
    } else {
      setError("Cash contribution failed.");
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

  const downloadCertificate = (contributorName, contributionAmount) => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");

    // 1. Draw elegant background
    const grad = ctx.createLinearGradient(0, 0, 800, 600);
    grad.addColorStop(0, "#FFFDF0");
    grad.addColorStop(0.5, "#FFFFFA");
    grad.addColorStop(1, "#FFF9E6");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 600);

    // 2. Draw gold borders
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 10;
    ctx.strokeRect(15, 15, 770, 570);

    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, 740, 540);

    // 3. Draw corners decorations
    const drawCorner = (x, y, rotation) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.fillStyle = "#D4AF37";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(30, 0);
      ctx.lineTo(30, 8);
      ctx.lineTo(8, 8);
      ctx.lineTo(8, 30);
      ctx.lineTo(0, 30);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    drawCorner(35, 35, 0);
    drawCorner(765, 35, Math.PI / 2);
    drawCorner(765, 565, Math.PI);
    drawCorner(35, 565, -Math.PI / 2);

    // 4. Draw Header
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    ctx.font = "bold 38px Georgia, serif";
    ctx.fillStyle = "#E65100"; // TeamMahodara theme color
    ctx.fillText("CERTIFICATE OF APPRECIATION", 400, 100);

    // 5. Draw Ganesh Modak/Diya Emblem
    ctx.fillStyle = "#FFA500";
    ctx.beginPath();
    ctx.arc(400, 175, 25, 0, Math.PI, true);
    ctx.closePath();
    ctx.fill();
    // Diya Flame
    ctx.fillStyle = "#FF4500";
    ctx.beginPath();
    ctx.moveTo(400, 150);
    ctx.quadraticCurveTo(412, 135, 400, 115);
    ctx.quadraticCurveTo(388, 135, 400, 150);
    ctx.closePath();
    ctx.fill();

    // 6. Draw certificate text
    ctx.fillStyle = "#5D4037"; // Elegant brown
    ctx.font = "italic 20px Georgia, Georgia, serif";
    ctx.fillText("This certificate is gratefully presented to", 400, 240);

    ctx.fillStyle = "#2D0900"; // Deep dark red/brown
    ctx.font = "bold 34px sans-serif";
    ctx.fillText(contributorName, 400, 300);

    ctx.fillStyle = "#5D4037";
    ctx.font = "italic 18px Georgia, serif";
    ctx.fillText("in sincere recognition and appreciation of their generous contribution of", 400, 360);

    ctx.fillStyle = "#E65100";
    ctx.font = "bold 32px Georgia, serif";
    ctx.fillText(`₹ ${Number(contributionAmount).toLocaleString("en-IN")}/-`, 400, 420);

    ctx.fillStyle = "#5D4037";
    ctx.font = "18px Georgia, serif";
    ctx.fillText("towards the success of TEAM MAHODARA Ganesh Chaturthi Utsav.", 400, 470);

    // 7. Draw footer / signatures
    ctx.strokeStyle = "#5D4037";
    ctx.lineWidth = 1;
    
    // Left signature line
    ctx.beginPath();
    ctx.moveTo(150, 530);
    ctx.lineTo(300, 530);
    ctx.stroke();
    ctx.font = "14px Georgia, serif";
    ctx.fillStyle = "#5D4037";
    ctx.fillText("TEAM MAHODARA COMMITTEE", 225, 545);

    // Right signature line
    ctx.beginPath();
    ctx.moveTo(500, 530);
    ctx.lineTo(650, 530);
    ctx.stroke();
    ctx.fillText("DATE", 575, 545);
    const dateStr = new Date().toLocaleDateString("en-IN");
    ctx.font = "italic bold 16px Georgia, serif";
    ctx.fillStyle = "#2D0900";
    ctx.fillText(dateStr, 575, 515);

    // 8. Download PNG
    const link = document.createElement("a");
    link.download = `Certificate_${contributorName.replace(/\s+/g, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
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
            className="rounded px-3 py-2 border"
            value={contributor}
            onChange={(e) => setContributor(e.target.value)}
            required
          />
          <input
            type="number"
            min="1"
            placeholder="Amount"
            className="rounded px-3 py-2 border"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          {error && <div className="text-red-500 text-sm text-center p-2 bg-red-100 rounded">{error}</div>}
          
          <div className="flex gap-2">
            <button onClick={handleAddContribution} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded disabled:bg-gray-400">
              {loading ? "..." : "Add Cash"}
            </button>
            <button onClick={handlePayOnline} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded disabled:bg-gray-400">
              {loading ? "..." : "Pay Online"}
            </button>
          </div>
        </div>

        <div className="text-center font-bold mb-2">
          Total Contribution: ₹{total.toFixed(2)}
        </div>

        <div className="grid grid-cols-2 gap-2 px-3 pb-8 mt-4">
          {contributions.filter(c => c.status !== 'pending').map((c) => (
            <div key={c.id} className="rounded shadow p-2 bg-green-100 flex flex-col justify-between">
              <div>
                <div className="font-semibold">{c.contributor}</div>
                <div>₹{c.amount}</div>
                <div className="text-xs capitalize">Status: {c.status}</div>
              </div>
              <button 
                onClick={() => downloadCertificate(c.contributor, c.amount)}
                className="mt-2 text-xs bg-orange-600 hover:bg-orange-700 text-white font-bold py-1.5 px-2 rounded w-full flex items-center justify-center gap-1 transition-colors"
              >
                Certificate 📜
              </button>
            </div>
          ))}
        </div>


      </PageContainer>
    </BackgroundWrapper>
  );
}
