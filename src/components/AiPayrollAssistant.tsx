import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  Send, 
  HelpCircle, 
  BookOpen, 
  Clock, 
  Brain, 
  ShieldCheck, 
  Cpu,
  Layers,
  Activity
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AiPayrollAssistantProps {
  theme: "dark" | "light";
}

export default function AiPayrollAssistant({ theme }: AiPayrollAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "assistant", 
      content: `### Welcome to NEXUS Copilot
I am your intelligent orchestration assistant. I can help you validate payroll inputs, audit compliance policies, explain statutory tax rules, and resolve data anomalies.

**Here are some things you can ask me:**
* "What compliance alerts are active for India?"
* "Explain India EPF discrepancy and the retro adjustment"
* "Generate an executive summary of this month's payroll readiness"`
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isDark = theme === "dark";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    if (!textToSend) {
      setInputValue("");
    }

    // Add user message
    const updatedMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages })
      });

      if (!response.ok) throw new Error("API failed");
      const data = await response.json();
      
      setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `### ⚠️ Connection Offline
Unable to reach the server. Here is a simulated response based on the active country rules:
* India working hours: India strictly enforces Factories Act limits. The system has flagged **1 anomaly** in Mumbai operation.
* India EPF mismatch: Sai Gupta was calculated at mismatch due to basic salary threshold limit of ₹15,000.`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    "What compliance alerts are active for India?",
    "Explain India EPF discrepancy and the retro adjustment",
    "Generate an executive summary of this month's payroll readiness",
    "Show me the working hours rule policy for India"
  ];

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-4" id="ai_assistant_fullscreen_workspace">
      
      {/* Left side: Main Chat interface */}
      <div className={`flex-1 flex flex-col rounded-md border overflow-hidden ${
        isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"
      }`}>
        {/* Chat header */}
        <div className="px-4 py-3 border-b border-[#EDEBE9]/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-[#0078D4]/15 text-[#0078D4]">
              <Brain size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#323130] dark:text-white uppercase tracking-wider">NEXUS Statutory Assistant</h3>
              <p className="text-[10px] text-slate-400">Powered by NEXUS Engine | Real-time Context Ingestion</p>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-500 font-bold px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
            <ShieldCheck size={11} />
            Secure Tunnel
          </span>
        </div>

        {/* Message scroll list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {messages.map((m, idx) => (
            <div 
              key={idx} 
              className={`flex gap-3 max-w-3xl ${m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              {/* Avatar indicator */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                m.role === "user" 
                  ? "bg-[#0078D4] text-white" 
                  : "bg-slate-500/15 text-slate-300 border border-slate-700/10"
              }`}>
                {m.role === "user" ? "U" : "N"}
              </div>

              {/* Text Bubble */}
              <div className={`p-3 rounded-md text-xs leading-relaxed space-y-1.5 ${
                m.role === "user" 
                  ? "bg-[#0078D4] text-white" 
                  : (isDark ? "bg-slate-500/5 text-slate-200 border border-slate-700/10" : "bg-slate-500/5 text-slate-800 border border-slate-200")
              }`}>
                {/* Parse basic markdown representation */}
                {m.content.split("\n").map((line, lidx) => {
                  if (line.startsWith("### ")) {
                    return <h4 key={lidx} className="font-bold text-sm mt-2 border-b border-slate-700/10 pb-0.5 uppercase tracking-wider">{line.replace("### ", "")}</h4>;
                  }
                  if (line.startsWith("* ") || line.startsWith("- ")) {
                    return <li key={lidx} className="ml-3 list-disc mt-0.5">{line.replace(/^[*|-]\s+/, "")}</li>;
                  }
                  if (line.match(/^\d+\.\s+/)) {
                    return <li key={lidx} className="ml-3 list-decimal mt-0.5">{line.replace(/^\d+\.\s+/, "")}</li>;
                  }
                  return <p key={lidx} className={line.trim() === "" ? "h-2" : ""}>{line}</p>;
                })}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 mr-auto">
              <div className="w-6 h-6 rounded-full bg-slate-500/15 text-slate-300 flex items-center justify-center text-xs">
                N
              </div>
              <div className={`p-3 rounded-md text-xs border flex items-center gap-2 ${
                isDark ? "bg-slate-500/5 text-slate-400 border-slate-700/10" : "bg-slate-500/5 text-slate-500 border-slate-200"
              }`}>
                <Cpu size={12} className="animate-spin text-[#0078D4]" />
                <span>NEXUS reasoning engine processing...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic prompt suggestion pills */}
        {messages.length === 1 && (
          <div className="px-4 pb-2 pt-1.5 border-t border-[#EDEBE9]/10">
            <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1.5">Suggested Prompts</span>
            <div className="flex flex-wrap gap-1.5">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p)}
                  className={`px-2.5 py-1 text-[10.5px] font-semibold rounded-full border transition-all text-left ${
                    isDark 
                      ? "border-[#2D2D2D] bg-[#161616] text-slate-300 hover:border-slate-500" 
                      : "border-[#EDEBE9] bg-[#FAF9F8] text-slate-600 hover:bg-[#F3F2F1]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input box */}
        <div className="p-3 border-t border-[#EDEBE9]/20 flex gap-2">
          <input
            type="text"
            placeholder="Ask anything about global compliance rules, tax computations, or validation errors..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className={`flex-1 text-xs px-3 py-2 rounded border outline-none focus:border-[#0078D4] ${
              isDark ? "bg-[#161616] border-[#2D2D2D] text-white" : "bg-[#FAF9F8] border-[#EDEBE9]"
            }`}
          />
          <button
            onClick={() => handleSendMessage()}
            className="px-3 bg-[#0078D4] hover:bg-[#005A9E] text-white rounded font-bold transition flex items-center justify-center shrink-0"
          >
            <Send size={13} />
          </button>
        </div>
      </div>

      {/* Right side: Live context panel */}
      <div className={`w-full lg:w-72 rounded-md border p-4 space-y-4 shrink-0 flex flex-col justify-between ${
        isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"
      }`} id="ai_copilot_context_panel">
        
        <div className="space-y-4">
          <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/10 pb-1.5 flex items-center gap-1.5">
            <Layers size={11} />
            Copilot Context Injection
          </h3>

          <div className="space-y-3 text-xs leading-normal">
            <p className="text-slate-400">
              NEXUS continuously injects live metadata directly into the large language model's prompt window to optimize resolution accuracy.
            </p>

            <div className="p-2.5 rounded bg-slate-500/5 border border-slate-700/10 space-y-1.5">
              <span className="text-[9.5px] font-bold uppercase text-slate-400 block">Live Metadata</span>
              <div className="flex items-center justify-between text-[10px] font-semibold border-b border-slate-700/10 pb-1 text-slate-300">
                <span>Readiness Score</span>
                <span className="text-[#0078D4]">87% Ready</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-300">
                <span>Pending Anomalies</span>
                <span className="text-rose-500 font-mono">5 Exceptions</span>
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-500/5 border border-slate-700/10 space-y-1.5">
              <span className="text-[9.5px] font-bold uppercase text-slate-400 block">RAG Document Matches</span>
              <div className="flex items-center gap-1 text-[10.5px] font-semibold text-[#0078D4]">
                <BookOpen size={11} />
                <span>India Factories Act 1948</span>
              </div>
              <div className="flex items-center gap-1 text-[10.5px] font-semibold text-[#0078D4]">
                <BookOpen size={11} />
                <span>EPF and MP Act 1952</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-2.5 bg-[#107C10]/10 border border-[#107C10]/20 rounded flex items-center gap-2 text-[#107C10]">
          <ShieldCheck size={14} className="shrink-0" />
          <span className="text-[9.5px] font-bold uppercase tracking-wide">GDPR / SOC2 Compliant Enclave</span>
        </div>

      </div>

    </div>
  );
}
