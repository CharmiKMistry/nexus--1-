import React, { useState, useRef, useEffect } from "react";
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  Mic, 
  FileText, 
  Clock, 
  BookOpen,
  ArrowRight
} from "lucide-react";

interface CopilotProps {
  theme: "dark" | "light";
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Copilot({ theme }: CopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 Hello! I am **NEXUS Copilot**, your enterprise global payroll intelligence and governance assistant. Ask me anything about current compliance scores, rules for different countries, validation issues, or audit records."
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    { label: "Summarize India alerts", query: "What compliance alerts are active for India?" },
    { label: "India EPF discrepancy", query: "Explain India EPF discrepancy and the retro adjustment" },
    { label: "Executive payroll readiness", query: "Generate an executive summary of this month's payroll readiness" },
    { label: "India working hour rules", query: "Show me the working hours rule policy for India" }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const updatedMessages = [...messages, { role: "user", content: text } as Message];
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages })
      });

      if (!response.ok) throw new Error("Chat service error");
      const result = await response.json();
      
      setMessages([...updatedMessages, { role: "assistant", content: result.content }]);
    } catch (error) {
      console.error("Copilot Error:", error);
      setMessages([
        ...updatedMessages,
        { 
          role: "assistant", 
          content: "⚠️ **Service Exception:** Unable to reach NEXUS server-side intelligence layers. Please ensure the dev server is active and the Gemini API key is configured correctly." 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const bgStyle = theme === "dark" 
    ? "bg-[#1F1F1F] border border-[#2D2D2D] text-white shadow-xl" 
    : "bg-white border border-[#EDEBE9] text-[#323130] shadow-xl";

  const headerStyle = theme === "dark"
    ? "bg-[#2D2D2D]"
    : "bg-[#0078D4]";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Copilot Chat Window */}
      {isOpen && (
        <div 
          className={`w-[380px] h-[520px] rounded-md flex flex-col mb-4 transition-all duration-300 transform scale-100 origin-bottom-right ${bgStyle}`}
          id="copilot_window"
        >
          {/* Header */}
          <div className={`p-3 rounded-t-md flex items-center justify-between text-white ${headerStyle}`}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-white/20 flex items-center justify-center">
                <Sparkles size={14} className="text-amber-300 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-tight">NEXUS Copilot</h4>
                <p className="text-[9px] text-white/80 font-mono tracking-wider">Enterprise Statutory Assistant</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded transition-colors text-white/95"
              id="close_copilot_btn"
            >
              <X size={14} />
            </button>
          </div>

          {/* Messages List */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 scrollbar-thin">
            {messages.map((m, idx) => (
              <div 
                key={idx}
                className={`flex gap-2.5 max-w-[85%] ${m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 text-[9px] font-bold ${
                  m.role === "user" ? "bg-[#0078D4] text-white" : "bg-[#107C10] text-white"
                }`}>
                  {m.role === "user" ? "U" : "N"}
                </div>
                <div className={`p-2.5 rounded text-xs leading-relaxed ${
                  m.role === "user" 
                    ? (theme === "dark" ? "bg-[#2D2D2D] text-white" : "bg-[#EFF6FC] text-slate-800")
                    : (theme === "dark" ? "bg-[#2D2D2D]/60 text-slate-100" : "bg-[#FAF9F8] border border-[#EDEBE9] text-slate-700")
                }`}>
                  {/* Basic markdown parsing of bold headers and bullet points */}
                  {m.content.split("\n").map((line, lidx) => {
                    let parsedLine = line;
                    // Handle headers (###)
                    if (parsedLine.startsWith("###")) {
                      return <h5 key={lidx} className="font-bold text-xs my-1 text-[#0078D4]">{parsedLine.replace("###", "").trim()}</h5>;
                    }
                    // Handle lists
                    if (parsedLine.startsWith("*") || parsedLine.startsWith("-")) {
                      return <li key={lidx} className="ml-1.5 list-disc pl-1 my-0.5">{parsedLine.substring(1).trim()}</li>;
                    }
                    // Handle basic bold matching (**text**)
                    const boldRegex = /\*\*(.*?)\*\*/g;
                    const parts = [];
                    let lastIndex = 0;
                    let match;
                    while ((match = boldRegex.exec(parsedLine)) !== null) {
                      if (match.index > lastIndex) {
                        parts.push(parsedLine.substring(lastIndex, match.index));
                      }
                      parts.push(<strong key={match.index} className="text-[#0078D4] dark:text-[#38BDF8] font-bold">{match[1]}</strong>);
                      lastIndex = boldRegex.lastIndex;
                    }
                    if (lastIndex < parsedLine.length) {
                      parts.push(parsedLine.substring(lastIndex));
                    }
                    return <p key={lidx} className="my-0.5">{parts.length > 0 ? parts : parsedLine}</p>;
                  })}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2.5 max-w-[85%] mr-auto">
                <div className="w-5 h-5 rounded bg-[#107C10] text-white flex items-center justify-center text-[9px] font-bold">N</div>
                <div className={`p-2.5 rounded text-xs ${theme === "dark" ? "bg-[#2D2D2D]" : "bg-slate-100"} flex items-center gap-1.5`}>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[10px] text-slate-400 font-mono ml-2">Orchestrating...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts (Scrollable) */}
          {messages.length === 1 && (
            <div className={`px-3 py-2 border-t ${theme === "dark" ? "border-[#2D2D2D]" : "border-[#EDEBE9]"}`}>
              <p className="text-[10px] text-slate-400 font-semibold mb-1.5 flex items-center gap-1">
                <BookOpen size={10} /> Suggested Payroll Audits
              </p>
              <div className="grid grid-cols-2 gap-1">
                {suggestedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(p.query)}
                    className={`text-[9.5px] text-left p-1.5 rounded border transition-all truncate ${
                      theme === "dark"
                        ? "bg-[#2D2D2D] border-transparent hover:border-[#0078D4] text-slate-300 hover:text-white"
                        : "bg-[#FAF9F8] border-[#EDEBE9] hover:border-slate-300 hover:bg-[#F3F2F1] text-slate-600 hover:text-slate-800"
                    }`}
                    title={p.query}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message Input Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputValue);
            }}
            className={`p-2 border-t flex items-center gap-1.5 ${theme === "dark" ? "border-[#2D2D2D] bg-[#161616]" : "border-[#EDEBE9] bg-[#FAF9F8]"}`}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about compliance policies, rules..."
              className={`flex-1 text-xs px-2.5 py-1.5 rounded outline-none border transition-colors ${
                theme === "dark"
                  ? "bg-[#2D2D2D] border-transparent focus:border-[#0078D4] text-white"
                  : "bg-white border-[#EDEBE9] focus:border-[#0078D4] text-slate-800"
              }`}
            />
            {/* Simulation Voice Button */}
            <button
              type="button"
              className={`p-1.5 rounded text-slate-400 hover:text-[#0078D4] transition-colors ${theme === "dark" ? "hover:bg-slate-800" : "hover:bg-slate-200"}`}
              title="Voice Input (Future expansion)"
              onClick={() => alert("Voice transcription interface initialized. Voice activation features are RAG-ready for future scale.")}
            >
              <Mic size={13} />
            </button>
            <button
              type="submit"
              className="p-1.5 rounded bg-[#0078D4] hover:bg-[#005A9E] text-white transition-colors flex items-center justify-center shrink-0"
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Copilot Launcher Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        id="copilot_launcher_btn"
        className="w-10 h-10 rounded-full bg-[#0078D4] hover:bg-[#005A9E] text-white shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-all focus:outline-none"
        title="Open NEXUS Copilot"
      >
        {isOpen ? <X size={18} /> : <MessageSquare size={18} className="animate-pulse" />}
      </button>
    </div>
  );
}
