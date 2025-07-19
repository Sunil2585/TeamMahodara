import React, { useEffect, useState, useRef, useCallback } from "react";
import PageContainer from "../components/PageContainer";
import BackgroundWrapper from "../components/BackgroundWrapper";
import { supabase } from "../supabaseClient";

const currentUserName = localStorage.getItem("profileName") || "Anonymous";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch messages function, memoized to avoid useEffect warning
  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error) setMessages(data || []);
    scrollToBottom();
  }, []);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  // Initial fetch and real-time subscription
  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel("public:chats")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chats" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages]);

  // Send message
  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    await supabase.from("chats").insert([{ sender: currentUserName, message: input }]);
    setInput("");
    setLoading(false);
    // No need to fetchMessages; realtime will update
  }

  // Emoji picker
  const emojis = ["😀", "😂", "😍", "🙏", "🎉", "👍", "🔥", "🥳", "😎", "❤️"];
  function handleEmojiClick(emoji) {
    setInput(input + emoji);
  }

  return (
    <BackgroundWrapper>
      <PageContainer title="CHAT" userName={currentUserName}>
        <div className="flex flex-col h-[400px] bg-white/30 rounded-xl shadow-inner mb-4 overflow-y-auto px-2 py-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-2 flex ${msg.sender === currentUserName ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-3 py-2 rounded-lg max-w-[70%] ${
                  msg.sender === currentUserName
                    ? "bg-yellow-400 text-white"
                    : "bg-white/80 text-yellow-900"
                }`}
              >
                <span className="block text-xs font-bold mb-1">{msg.sender}</span>
                <span className="break-words">{msg.message}</span>
                <span className="block text-[10px] text-right text-gray-500 mt-1">
                  {msg.created_at && new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSend} className="flex flex-col gap-2 px-2">
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 rounded-lg px-3 py-2 border border-yellow-400 bg-white/70 focus:outline-none text-black"
              placeholder="Type your message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-4 rounded-lg transition"
            >
              Send
            </button>
          </div>
          <div className="flex gap-1 flex-wrap">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="text-xl"
                onClick={() => handleEmojiClick(emoji)}
                tabIndex={-1}
              >
                {emoji}
              </button>
            ))}
          </div>
        </form>
      </PageContainer>
    </BackgroundWrapper>
  );
}
