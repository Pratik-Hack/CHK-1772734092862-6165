"use client";

import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/stores/authStore";
import { useCoinsStore } from "@/stores/coinsStore";
import { chatService } from "@/services/chat.service";
import { CHATBOT_API_URL } from "@/lib/constants";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

interface Message { role: "user" | "assistant"; content: string; }

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const { addChatCoins } = useCoinsStore();

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);
      const response = await fetch(`${CHATBOT_API_URL}/chat/stream`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, userId: user?._id }),
      });
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;
              fullResponse += data;
              setMessages(prev => { const updated = [...prev]; updated[updated.length - 1] = { role: "assistant", content: fullResponse }; return updated; });
            }
          }
        }
      }
      addChatCoins();
      try { const saveRes = await chatService.saveMessage({ userId: user?._id || "", message: userMsg, response: fullResponse, sessionId: sessionId || undefined }); if (saveRes.sessionId) setSessionId(saveRes.sessionId); } catch {}
    } catch {
      setMessages(prev => { const updated = [...prev]; updated[updated.length - 1] = { role: "assistant", content: "Sorry, I couldn't process your message." }; return updated; });
      toast.error("Failed to send message");
    } finally { setLoading(false); }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center text-white">💬</div>
          <div><h1 className="text-lg font-bold">AI Health Assistant</h1><p className="text-xs text-gray-500">Powered by MedicoScope AI</p></div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {messages.length === 0 && (<div className="text-center py-20 text-gray-400"><span className="text-4xl block mb-4">🤖</span><p>Ask me anything about your health</p></div>)}
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${msg.role === "user" ? "gradient-primary text-white" : "glass"}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content || "..."}</p>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Type your message..." className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-[#FF6B35] outline-none" />
          <button onClick={sendMessage} disabled={loading || !input.trim()} className="px-6 py-3 gradient-primary text-white rounded-xl font-medium disabled:opacity-50">
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
