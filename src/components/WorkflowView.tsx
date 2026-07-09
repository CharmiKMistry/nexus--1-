import React, { useState } from "react";
import { 
  GitBranch, 
  Settings, 
  MessageSquare, 
  Mail, 
  Bell, 
  Plus, 
  Trash2, 
  Save, 
  Check, 
  ArrowRight,
  Clock,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { WorkflowNode, UserRole } from "../types";

interface WorkflowViewProps {
  theme: "dark" | "light";
}

export default function WorkflowView({ theme }: WorkflowViewProps) {
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    { id: "wf-1", label: "Data Ingestion & Integration Check", assignedRole: "HR", slaDays: 2, status: "completed" },
    { id: "wf-2", label: "AI Statutory Anomaly Sweep", assignedRole: "Compliance Officer", slaDays: 1, status: "completed" },
    { id: "wf-3", label: "Retroactive & Variance Validation", assignedRole: "Finance", slaDays: 2, status: "active" },
    { id: "wf-4", label: "Entity Level Local Approval Signature", assignedRole: "Country Admin", slaDays: 1, status: "pending" },
    { id: "wf-5", label: "Executive Payroll Release", assignedRole: "Executive", slaDays: 1, status: "pending" }
  ]);

  const [teamsEnabled, setTeamsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [escalationDays, setEscalationDays] = useState(3);
  const [isPublishing, setIsPublishing] = useState(false);

  const addWorkflowStep = () => {
    const newStep: WorkflowNode = {
      id: `wf-${Date.now()}`,
      label: "Custom Audit Review Block",
      assignedRole: "Auditor",
      slaDays: 2,
      status: "pending"
    };
    setNodes([...nodes, newStep]);
  };

  const removeStep = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
  };

  const handleSlaChange = (id: string, days: number) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, slaDays: days } : n));
  };

  const publishWorkflow = async () => {
    setIsPublishing(true);
    try {
      // Store in Firebase Firestore
      await setDoc(doc(db, "Settings", "workflowConfig"), {
        nodes,
        teamsEnabled,
        emailEnabled,
        escalationDays,
        updatedAt: new Date().toISOString()
      });
      alert("✓ Global Ingestion Workflow Orchestrator configuration published successfully! Changes have been synchronized across cloud runners.");
    } catch (e) {
      console.error(e);
      alert("Error saving workflow to Firebase database.");
    } finally {
      setIsPublishing(false);
    }
  };

  const isDark = theme === "dark";

  return (
    <div className="space-y-4" id="workflow_orchestration_container">
      {/* Overview */}
      <div className={`p-3 rounded-md border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
        isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-[#0078D4]/10 text-[#0078D4]">
            <GitBranch size={18} />
          </div>
          <div>
            <h2 className="text-xs font-bold text-[#323130] dark:text-white">Payroll Approval Workflow Orchestrator</h2>
            <p className="text-[10.5px] text-slate-400 mt-0.5">
              Design the routing sequence, set localized SLA rules, and trigger escalations based on role dependencies.
            </p>
          </div>
        </div>
        <button
          onClick={publishWorkflow}
          disabled={isPublishing}
          id="btn_publish_workflow"
          className="px-3 py-1 bg-[#0078D4] hover:bg-[#005A9E] transition text-white text-xs font-bold rounded flex items-center gap-1 shadow-sm"
        >
          <Save size={12} /> {isPublishing ? "Publishing..." : "Publish Workflow"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Visual pipeline block */}
        <div className="lg:col-span-2 space-y-3">
          <div className={`p-3.5 rounded-md border ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D] text-white" : "bg-white border-[#EDEBE9] text-slate-800 shadow-sm"}`}>
            <div className="flex items-center justify-between mb-4 border-b pb-2 border-slate-700/10">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Orchestrated Stages</h3>
              <button 
                onClick={addWorkflowStep}
                className="text-[11.5px] text-[#0078D4] hover:underline font-bold flex items-center gap-0.5"
              >
                <Plus size={11} /> Add Step Node
              </button>
            </div>

            {/* Linear flowchart chain */}
            <div className="space-y-3 relative">
              {nodes.map((node, idx) => (
                <div key={node.id} className="relative flex items-center justify-between">
                  <div className={`flex-1 p-3 rounded border flex flex-col md:flex-row md:items-center justify-between gap-2.5 ${
                    node.status === "completed"
                      ? "bg-[#107C10]/5 border-[#107C10]/20"
                      : node.status === "active"
                        ? "bg-[#0078D4]/5 border-[#0078D4] shadow-sm"
                        : (isDark ? "bg-[#2D2D2D]/20 border-[#2D2D2D]" : "bg-[#FAF9F8] border-[#EDEBE9]")
                  }`}>
                    <div className="flex items-start gap-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                        node.status === "completed"
                          ? "bg-[#107C10] text-white"
                          : node.status === "active"
                            ? "bg-[#0078D4] text-white animate-pulse"
                            : "bg-[#A19F9D] text-white"
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#323130] dark:text-white">{node.label}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[9.5px] text-slate-400 font-semibold">
                          <UserCheck size={9} /> Role: <span className="text-[#0078D4] font-bold">{node.assignedRole}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* SLA configuration */}
                      <div className="flex items-center gap-1.5 text-[11.5px]">
                        <Clock size={11} className="text-slate-400" />
                        <span className="text-slate-400">SLA:</span>
                        <input
                          type="number"
                          value={node.slaDays}
                          onChange={(e) => handleSlaChange(node.id, parseInt(e.target.value) || 1)}
                          className={`w-9 text-center font-bold text-[11px] font-mono p-0.5 rounded border outline-none ${
                            isDark ? "bg-[#1F1F1F] border-[#2D2D2D] text-white" : "bg-white border-[#EDEBE9]"
                          }`}
                        />
                        <span className="text-slate-400">days</span>
                      </div>

                      {nodes.length > 2 && (
                        <button 
                          onClick={() => removeStep(node.id)}
                          className="text-slate-400 hover:text-[#A80000] transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Channels & Integration Side Configuration */}
        <div className="space-y-3">
          <div className={`p-3.5 rounded-md border space-y-3 shadow-sm ${
            isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9]"
          }`}>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/10 pb-1.5 flex items-center gap-1.5">
              <Settings size={12} />
              Notification Webhooks
            </h3>

            {/* Teams webhook toggle */}
            <div className="flex items-center justify-between p-2.5 rounded bg-slate-500/5 border border-slate-700/10">
              <div className="flex gap-2 items-start">
                <MessageSquare className="text-indigo-400 mt-0.5" size={14} />
                <div>
                  <h4 className="text-xs font-bold text-[#323130] dark:text-white">Teams Notification</h4>
                  <p className="text-[9.5px] text-slate-400 leading-snug mt-0.5">Push sign-off events to Teams channels.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={teamsEnabled}
                onChange={(e) => setTeamsEnabled(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-[#0078D4] accent-[#0078D4]"
              />
            </div>

            {/* Email notification toggle */}
            <div className="flex items-center justify-between p-2.5 rounded bg-slate-500/5 border border-slate-700/10">
              <div className="flex gap-2 items-start">
                <Mail className="text-[#0078D4] mt-0.5" size={14} />
                <div>
                  <h4 className="text-xs font-bold text-[#323130] dark:text-white">SMTP Enterprise Mail</h4>
                  <p className="text-[9.5px] text-slate-400 leading-snug mt-0.5">Send sealed daily digest summaries.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-[#0078D4] accent-[#0078D4]"
              />
            </div>

            {/* Escalation Policy config */}
            <div className={`p-3 rounded border ${isDark ? "bg-[#2D2D2D]/20 border-[#2D2D2D]" : "bg-[#FAF9F8] border-[#EDEBE9]"}`}>
              <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 mb-1.5 uppercase">
                <Bell size={11} className="text-[#0078D4]" />
                Escalation Alert Rule
              </label>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 dark:text-slate-300">Escalate to Board after</span>
                <input
                  type="number"
                  value={escalationDays}
                  onChange={(e) => setEscalationDays(parseInt(e.target.value) || 1)}
                  className={`w-9 text-center text-xs font-bold p-0.5 rounded border outline-none font-mono ${
                    isDark ? "bg-[#1F1F1F] border-[#2D2D2D] text-white" : "bg-white border-[#EDEBE9]"
                  }`}
                />
                <span className="text-slate-500 dark:text-slate-300">days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
