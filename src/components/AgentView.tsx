import React, { useState, useEffect } from "react";
import { 
  Cpu, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  Terminal, 
  Layers, 
  Activity, 
  RefreshCw,
  Clock,
  Sparkles
} from "lucide-react";
import { AgentState } from "../types";

interface AgentViewProps {
  theme: "dark" | "light";
}

export default function AgentView({ theme }: AgentViewProps) {
  const [isRunningPass, setIsRunningPass] = useState(false);
  const [activeAgentIdx, setActiveAgentIdx] = useState<number | null>(null);
  const [logs, setLogs] = useState<string[]>([
    "[03:15:02] [Data Collection Agent] Initialized Workday connection pool.",
    "[03:15:10] [Data Collection Agent] Ingested Munich timesheet inputs (82 records).",
    "[03:15:15] [Validation Agent] Anomaly scan pass completed. 5 flags generated.",
    "[03:15:22] [Reconciliation Agent] Multi-source claim comparison finalized.",
    "[03:15:35] [Notification Agent] Dispatched Microsoft Teams alerts to Germany approval leads."
  ]);

  const [agents, setAgents] = useState<AgentState[]>([
    { name: "Data Collection Agent", status: "success", progress: 100, currentTask: "Idle (Polled Workday)", executionLogs: ["Connection stable.", "Polled 1420 files."] },
    { name: "Validation Agent", status: "success", progress: 100, currentTask: "Idle (Scan Complete)", executionLogs: ["Pattern scan done.", "5 anomalies flagged."] },
    { name: "Reconciliation Agent", status: "success", progress: 100, currentTask: "Idle (Aligned)", executionLogs: ["HRMS cross check done."] },
    { name: "Compliance Agent", status: "success", progress: 100, currentTask: "Idle (Cert Passed)", executionLogs: ["Germany rest rules check."] },
    { name: "Approval Agent", status: "idle", progress: 0, currentTask: "Awaiting Admin Action", executionLogs: [] },
    { name: "Notification Agent", status: "success", progress: 100, currentTask: "Slack/Teams Posted", executionLogs: ["Slack webhook active."] },
    { name: "Audit Agent", status: "success", progress: 100, currentTask: "Blocks Signed", executionLogs: ["Immutable transaction posted."] },
    { name: "Reporting Agent", status: "idle", progress: 0, currentTask: "Waiting for Sign-off", executionLogs: [] }
  ]);

  const runGlobalPass = () => {
    if (isRunningPass) return;
    setIsRunningPass(true);
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] [Orchestrator] Starting global autonomous payroll pass...`]);
    
    // Simulate progression of agent steps
    let currentStep = 0;
    setActiveAgentIdx(0);

    const interval = setInterval(() => {
      if (currentStep >= agents.length) {
        clearInterval(interval);
        setIsRunningPass(false);
        setActiveAgentIdx(null);
        setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] [Orchestrator] Autonomous execution pass completed perfectly.`]);
        alert("NEXUS Orchestration Complete! All autonomous agents have executed their statutory logic sweeps.");
        return;
      }

      // Animate current agent
      setAgents((prevAgents) => {
        return prevAgents.map((agent, idx) => {
          if (idx === currentStep) {
            return {
              ...agent,
              status: "running",
              progress: 40,
              currentTask: "Analyzing payroll boundaries..."
            };
          }
          return agent;
        });
      });

      // Complete previous steps or update log
      const agentName = agents[currentStep].name;
      setLogs((prev) => [
        ...prev, 
        `[${new Date().toLocaleTimeString()}] [${agentName}] Executing statutory rule sweep...`
      ]);

      setTimeout(() => {
        setAgents((prevAgents) => {
          return prevAgents.map((agent, idx) => {
            if (idx === currentStep) {
              return {
                ...agent,
                status: "success",
                progress: 100,
                currentTask: "Task Complete"
              };
            }
            return agent;
          });
        });
        setLogs((prev) => [
          ...prev, 
          `[${new Date().toLocaleTimeString()}] [${agentName}] Task verified. Clean audit signature posted.`
        ]);
        currentStep++;
        setActiveAgentIdx(currentStep < agents.length ? currentStep : null);
      }, 800);

    }, 1200);
  };

  const isDark = theme === "dark";

  return (
    <div className="space-y-4" id="agentic_layer_container">
      {/* Control Banner */}
      <div className={`p-3 rounded-md border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
        isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-[#107C10]/10 text-[#107C10]">
            <Cpu size={18} className={isRunningPass ? "animate-spin" : ""} />
          </div>
          <div>
            <h2 className="text-xs font-bold text-[#323130] dark:text-white">Autonomous Agentic AI Orchestration</h2>
            <p className="text-[10.5px] text-slate-400 mt-0.5">
              Activate and monitor our 8 specialized agents auditing statutory boundaries in the background.
            </p>
          </div>
        </div>
        <button
          onClick={runGlobalPass}
          disabled={isRunningPass}
          id="btn_run_agents"
          className="px-3 py-1.5 bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-bold rounded hover:opacity-95 flex items-center gap-1.5 shadow-sm transition"
        >
          {isRunningPass ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
          {isRunningPass ? "Orchestrating Pass..." : "Run Global Audit Pass"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Agents Grid List */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
          {agents.map((agent, idx) => (
            <div
              key={agent.name}
              id={`agent_card_${idx}`}
              className={`p-3 rounded border flex flex-col justify-between transition-all ${
                activeAgentIdx === idx
                  ? "border-[#0078D4] bg-[#0078D4]/5 shadow"
                  : (isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm")
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#323130] dark:text-white">{agent.name}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  agent.status === "success" 
                    ? "bg-[#107C10]/10 text-[#107C10]" 
                    : agent.status === "running"
                      ? "bg-[#C49B00]/10 text-[#C49B00] animate-pulse"
                      : "bg-slate-500/10 text-slate-400"
                }`}>
                  {agent.status.toUpperCase()}
                </span>
              </div>

              <div className="my-2.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-semibold">
                  <span>Current: {agent.currentTask}</span>
                  <span>{agent.progress}%</span>
                </div>
                <div className="w-full bg-slate-700/15 h-1 rounded-full overflow-hidden">
                  <div 
                    className={`h-1 rounded-full transition-all duration-300 ${
                      agent.status === "success" ? "bg-[#107C10]" : "bg-[#C49B00]"
                    }`}
                    style={{ width: `${agent.progress}%` }}
                  />
                </div>
              </div>

              <span className="text-[9.5px] font-mono text-slate-400 flex items-center gap-1">
                <Clock size={10} /> Trigger: Cycle Initiation Event
              </span>
            </div>
          ))}
        </div>

        {/* Live Execution logs terminal */}
        <div className="flex flex-col h-full min-h-[300px]">
          <div className={`flex-1 p-3 rounded border flex flex-col justify-between ${
            isDark ? "bg-[#161616] border-[#2D2D2D] text-slate-200" : "bg-slate-950 border-[#2D2D2D] text-slate-200 shadow-sm"
          }`}>
            <div className="flex items-center justify-between border-b border-[#2D2D2D] pb-1.5 mb-2.5">
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-[#C49B00] uppercase font-mono">
                <Terminal size={12} />
                <span>Execution Logs Terminal</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#107C10] animate-pulse" />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[9.5px] leading-relaxed pr-1 max-h-[340px]">
              {logs.map((log, idx) => (
                <div key={idx} className="text-slate-300">
                  <span className="text-[#0078D4] select-none">&gt;&nbsp;</span>
                  {log}
                </div>
              ))}
            </div>

            <div className="border-t border-[#2D2D2D] pt-2 mt-2 flex items-center justify-between text-[9px] text-slate-500 font-mono">
              <span>TLS 1.3 Secure</span>
              <span>AES-256 Storage</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
