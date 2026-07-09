import React, { useState } from "react";
import { 
  Network, 
  RefreshCw, 
  CheckCircle, 
  Database, 
  FileCheck2, 
  ArrowRightLeft, 
  Server, 
  CloudLightning,
  Clock,
  Sparkles
} from "lucide-react";
import { NexusDB } from "../lib/db";

interface IntegrationConnector {
  id: string;
  name: string;
  type: string;
  status: "Healthy Connection" | "Disrupted Connection";
  lastSync: string;
}

interface IntegrationHubProps {
  theme: "dark" | "light";
}

export default function IntegrationHub({ theme }: IntegrationHubProps) {
  const [connectors, setConnectors] = useState<IntegrationConnector[]>([
    { id: "conn-1", name: "Workday API Integration", type: "REST Webhook", status: "Healthy Connection", lastSync: "10 mins ago" },
    { id: "conn-2", name: "SAP SuccessFactors", type: "OData Client", status: "Healthy Connection", lastSync: "1 hour ago" },
    { id: "conn-3", name: "Munich SFTP Server", type: "Secure SSH", status: "Healthy Connection", lastSync: "3 mins ago" },
    { id: "conn-4", name: "US Payroll Oracle DB", type: "Azure SQL Link", status: "Healthy Connection", lastSync: "3 mins ago" }
  ]);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const isDark = theme === "dark";

  const handleSyncConnector = (id: string, name: string) => {
    setSyncingId(id);
    
    // Animate a 1.5s synchronization
    setTimeout(() => {
      setSyncingId(null);
      
      const updated = connectors.map(c => {
        if (c.id === id) {
          return {
            ...c,
            lastSync: "Just Now",
            status: "Healthy Connection" as const
          };
        }
        return c;
      });

      setConnectors(updated);

      NexusDB.auditLogs = [
        {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: "Ronak Surve (Super Admin)",
          role: "Super Admin",
          action: "Triggered System Sync",
          details: `Executed active API gateway fetch over: ${name}. Synchronized and validated all incoming data schemas.`
        },
        ...NexusDB.auditLogs
      ];

      alert(`✓ Synchronization Complete! "${name}" database mapping parsed and refreshed safely with zero schema mismatches.`);
    }, 1500);
  };

  return (
    <div className="space-y-4" id="integration_hub_container">
      {/* Header banner */}
      <div className="flex items-center justify-between border-b border-[#EDEBE9]/40 pb-2">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Network size={13} />
            Enterprise HRMS Integration Hub
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Integrate Workday, SAP SuccessFactors, secure SSH SFTP channels, and databases into the NEXUS compliance gatekeeper pipeline.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="integration_connectors_grid">
        {connectors.map((c) => {
          const isSyncing = syncingId === c.id;

          return (
            <div 
              key={c.id} 
              className={`p-4 rounded-md border flex flex-col justify-between space-y-4 transition-all hover:scale-[1.002] ${
                isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"
              }`}
            >
              <div className="space-y-2">
                {/* Connector Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-slate-500/10 text-[#0078D4] rounded">
                      <Server size={15} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#323130] dark:text-white">{c.name}</h4>
                      <p className="text-[9.5px] text-slate-400 uppercase font-mono">{c.type}</p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 text-[8.5px] font-bold uppercase rounded border ${
                    c.status === "Healthy Connection"
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/15"
                      : "bg-rose-500/10 text-rose-500 border-rose-500/15"
                  }`}>
                    {c.status}
                  </span>
                </div>

                {/* Last sync parameters */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between border-b border-[#EDEBE9]/10 pb-1">
                    <span className="text-slate-400">Database Engine</span>
                    <span className="font-mono text-[10px] text-slate-300">HTTPS API REST</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#EDEBE9]/10 pb-1">
                    <span className="text-slate-400">Sync Interval</span>
                    <span className="font-semibold text-slate-300">Continuous Poll</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Last Synced Feed</span>
                    <span className="font-semibold text-slate-300 flex items-center gap-1">
                      <Clock size={10} />
                      {c.lastSync}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <button
                onClick={() => handleSyncConnector(c.id, c.name)}
                disabled={isSyncing}
                className={`w-full py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  isSyncing 
                    ? "bg-[#0078D4]/15 border border-[#0078D4] text-[#0078D4]" 
                    : "bg-[#0078D4] hover:bg-[#005A9E] text-white"
                }`}
              >
                <RefreshCw size={11} className={isSyncing ? "animate-spin" : ""} />
                {isSyncing ? "Syncing API schemas..." : "Sync Database Feed"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
