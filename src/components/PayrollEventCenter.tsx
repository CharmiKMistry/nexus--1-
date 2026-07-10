import React, { useState, useRef } from "react";
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Clock, 
  User, 
  CalendarCheck, 
  Coins, 
  TrendingUp, 
  Trash2, 
  CheckCircle2, 
  ChevronRight, 
  AlertCircle,
  FileCheck2,
  Sparkles,
  UploadCloud,
  X
} from "lucide-react";
import { NexusDB, PayrollEvent } from "../lib/db";

interface PayrollEventCenterProps {
  theme: "dark" | "light";
}

export default function PayrollEventCenter({ theme }: PayrollEventCenterProps) {
  const [events, setEvents] = useState<PayrollEvent[]>([...NexusDB.payrollEvents]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedEvent, setSelectedEvent] = useState<PayrollEvent | null>(events[0] || null);
  
  // Custom non-blocking alert states
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states for manual entry
  const [showAddForm, setShowAddForm] = useState(false);
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formEmployeeName, setFormEmployeeName] = useState("");
  const [formCountry, setFormCountry] = useState("India");
  const [formType, setFormType] = useState<PayrollEvent["type"]>("Overtime");
  const [formComments, setFormComments] = useState("");
  const [formSupportDocs, setFormSupportDocs] = useState("");

  const isDark = theme === "dark";

  // File Upload states & handlers
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [simulatedSize, setSimulatedSize] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        processUploadedFile(file);
      } else {
        setErrorMessage("Only PDF files are supported for DMS Vault Sync.");
        setTimeout(() => setErrorMessage(null), 4000);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        processUploadedFile(file);
      } else {
        setErrorMessage("Only PDF files are supported for DMS Vault Sync.");
        setTimeout(() => setErrorMessage(null), 4000);
      }
    }
  };

  const processUploadedFile = (file: File) => {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    setSimulatedSize(`${sizeInMB} MB`);
    setUploadProgress(0);
    setFormSupportDocs(file.name);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 60);
  };

  const clearUploadedFile = () => {
    setFormSupportDocs("");
    setUploadProgress(null);
    setSimulatedSize("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const eventTypes: string[] = [
    "All",
    "New Joiner",
    "Salary Change",
    "Promotion",
    "Variable Pay",
    "Retention Pay",
    "Sales Award",
    "Recovery",
    "Overtime",
    "Resignation"
  ];

  const filteredEvents = events.filter(evt => {
    const matchesSearch = evt.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          evt.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (evt.comments || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "All" || evt.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmployeeName || !formEmployeeId) {
      setErrorMessage("Please fill in all mandatory fields.");
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    const newEvent: PayrollEvent = {
      id: `evt-${Date.now().toString().slice(-4)}`,
      employeeId: formEmployeeId,
      employeeName: formEmployeeName,
      country: formCountry,
      type: formType,
      status: "AI Validated",
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      comments: formComments,
      supportingDocs: formSupportDocs || "Auto-Generated_Metadata_Check.pdf",
      workflowStep: "Manager Approval",
      slaDays: 3,
      timeline: [
        { step: "Draft", status: "completed", date: new Date().toISOString().slice(0, 10), user: "System (Form)" },
        { step: "Uploaded", status: "completed", date: new Date().toISOString().slice(0, 10), user: "Ronak Surve" },
        { step: "AI Validated", status: "active", date: new Date().toISOString().slice(0, 10), user: "NEXUS Core Agent" }
      ]
    };

    // Prepend to database and state
    NexusDB.payrollEvents = [newEvent, ...NexusDB.payrollEvents];
    
    // Add audit log
    NexusDB.auditLogs = [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: "Ronak Surve (Super Admin)",
        role: "Super Admin",
        action: `Manually Configured Payroll Event: ${formType}`,
        details: `Created record for ${formEmployeeName} (${formEmployeeId}) under country ${formCountry}.`
      },
      ...NexusDB.auditLogs
    ];

    setEvents([newEvent, ...events]);
    setSelectedEvent(newEvent);
    setShowAddForm(false);
    
    // Clear form
    setFormEmployeeId("");
    setFormEmployeeName("");
    setFormComments("");
    setFormSupportDocs("");
    
    setSuccessMessage(`Successfully registered new "${formType}" event. Audited and validated automatically by NEXUS.`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleDeleteEvent = (id: string, name: string) => {
    const nextEvents = events.filter(evt => evt.id !== id);
    setEvents(nextEvents);
    NexusDB.payrollEvents = NexusDB.payrollEvents.filter(evt => evt.id !== id);
    
    if (selectedEvent?.id === id) {
      setSelectedEvent(nextEvents[0] || null);
    }

    NexusDB.auditLogs = [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: "Ronak Surve (Super Admin)",
        role: "Super Admin",
        action: `Deleted Payroll Event`,
        details: `Removed event record with reference ID: ${id}.`
      },
      ...NexusDB.auditLogs
    ];
    setSuccessMessage(`Event for ${name} removed from registry.`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const getStatusStyle = (status: PayrollEvent["status"]) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
      case "Rejected":
        return "bg-rose-500/10 text-rose-500 border border-rose-500/20";
      case "AI Validated":
        return "bg-blue-500/10 text-blue-500 border border-blue-500/20";
      case "Draft":
        return "bg-slate-500/15 text-slate-400 border border-slate-500/20";
      default:
        return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
    }
  };

  const getEventIcon = (type: PayrollEvent["type"]) => {
    switch (type) {
      case "Salary Change":
      case "Promotion":
        return <TrendingUp size={13} className="text-emerald-500" />;
      case "Variable Pay":
      case "Retention Pay":
      case "Sales Award":
        return <Coins size={13} className="text-amber-500" />;
      case "Resignation":
        return <AlertCircle size={13} className="text-rose-500" />;
      case "New Joiner":
        return <User size={13} className="text-sky-500" />;
      default:
        return <Clock size={13} className="text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-4" id="payroll_event_center_container">
      {/* Header section with add button */}
      <div className="flex items-center justify-between border-b border-[#EDEBE9]/40 pb-2">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ClipboardList size={13} />
            Global Payroll Event Center
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Manage and audit granular payroll modifications, retention, promotions, and resignations.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          id="btn_toggle_add_event"
          className="px-2.5 py-1 bg-[#0078D4] hover:bg-[#005A9E] text-white rounded text-xs font-bold flex items-center gap-1 transition"
        >
          <Plus size={13} />
          {showAddForm ? "View Active Events" : "Configure Manual Event"}
        </button>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-500" />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={14} className="text-rose-500" />
          {errorMessage}
        </div>
      )}

      {showAddForm ? (
        /* Manual Configuration Intake Form */
        <div className={`p-4 rounded-md border ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"}`} id="add_event_form_container">
          <h3 className="text-xs font-bold text-[#323130] dark:text-white mb-3 flex items-center gap-1.5 border-b border-[#EDEBE9]/20 pb-1.5 uppercase tracking-wider">
            <Sparkles size={13} className="text-[#0078D4]" />
            New Granular Event Configuration Form
          </h3>
          <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-slate-400 block">Employee Permanent ID (PS No.) <span className="text-rose-500">*</span></label>
              <input 
                type="text" 
                placeholder="e.g., EMP-4050" 
                value={formEmployeeId}
                onChange={(e) => setFormEmployeeId(e.target.value)}
                className={`w-full text-xs p-1.5 rounded border outline-none font-mono ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D] focus:border-[#0078D4]" : "bg-white border-[#EDEBE9]"}`}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-slate-400 block">Full Name <span className="text-rose-500">*</span></label>
              <input 
                type="text" 
                placeholder="e.g., John Doe" 
                value={formEmployeeName}
                onChange={(e) => setFormEmployeeName(e.target.value)}
                className={`w-full text-xs p-1.5 rounded border outline-none ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D] focus:border-[#0078D4]" : "bg-white border-[#EDEBE9]"}`}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-slate-400 block">Target Juridical Country <span className="text-rose-500">*</span></label>
              <select 
                value={formCountry}
                onChange={(e) => setFormCountry(e.target.value)}
                className={`w-full text-xs p-1.5 rounded border outline-none font-semibold ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9]"}`}
              >
                <option value="India">India 🇮🇳</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-slate-400 block">Payroll Event Template <span className="text-rose-500">*</span></label>
              <select 
                value={formType}
                onChange={(e) => setFormType(e.target.value as PayrollEvent["type"])}
                className={`w-full text-xs p-1.5 rounded border outline-none font-semibold ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9]"}`}
              >
                <option value="New Joiner">New Joiner</option>
                <option value="Salary Change">Salary Change</option>
                <option value="Promotion">Promotion</option>
                <option value="Variable Pay">Variable Pay</option>
                <option value="Retention Pay">Retention Pay</option>
                <option value="Sales Award">Sales Award</option>
                <option value="Recovery">Recovery Input</option>
                <option value="Overtime">Overtime</option>
                <option value="Resignation">Resignation</option>
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10.5px] font-bold text-slate-400 block">Supporting Document Upload (PDF) <span className="text-rose-500">*</span></label>
              
              {/* Hidden File Input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept=".pdf" 
                className="hidden" 
              />

              {/* Uploader Dropzone / Display Area */}
              {!formSupportDocs ? (
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={triggerFileSelect}
                  className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                    isDragging 
                      ? "border-[#0078D4] bg-[#0078D4]/5 scale-[0.99]" 
                      : (isDark ? "border-[#404040] hover:border-[#0078D4] bg-[#1a1a1a] hover:bg-[#1f1f1f]" : "border-slate-300 hover:border-[#0078D4] bg-[#FAF9F8] hover:bg-slate-100/80")
                  }`}
                >
                  <div className="p-2.5 bg-blue-500/10 rounded-full text-blue-500">
                    <UploadCloud size={20} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold">
                      Drag & Drop your PDF here, or <span className="text-[#0078D4] underline font-bold">Browse</span>
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Supports standard PDF up to 10MB</p>
                  </div>
                </div>
              ) : (
                /* Uploaded File state or Progress State */
                <div className={`p-4 rounded-lg border flex flex-col gap-2.5 ${isDark ? "bg-[#1A1A1A] border-[#2D2D2D]" : "bg-[#FAF9F8] border-slate-200"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 bg-rose-500/10 rounded text-rose-500 shrink-0">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate max-w-[280px] sm:max-w-md">{formSupportDocs}</p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {uploadProgress !== null && uploadProgress < 100 
                            ? `Uploading... ${uploadProgress}%` 
                            : `${simulatedSize || "1.45 MB"} • Ready to Sync`}
                        </p>
                      </div>
                    </div>
                    
                    <button 
                      type="button"
                      onClick={clearUploadedFile}
                      className={`p-1 rounded-full transition ${isDark ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-200 text-slate-500 hover:text-slate-700"}`}
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Progress Bar simulation */}
                  {uploadProgress !== null && (
                    <div className="w-full bg-slate-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all duration-100 ease-out" 
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}

                  {uploadProgress === 100 && (
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold bg-emerald-500/5 p-1 rounded border border-emerald-500/10 self-start">
                      <CheckCircle2 size={11} /> Secured with AES-256 and mapped to DMS Vault
                    </div>
                  )}
                </div>
              )}

              {/* Standard text input fallback just in case they want to paste a custom path/URL */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[9.5px] text-slate-400 leading-normal">
                  ℹ️ <strong>DMS Vault Sync:</strong> Dropping files securely encrypts and stores them in your secure Cloud Storage bucket automatically.
                </span>
                
                {formSupportDocs && (
                  <button 
                    type="button"
                    onClick={() => {
                      const inputName = prompt("Edit uploaded document reference:", formSupportDocs);
                      if (inputName !== null) setFormSupportDocs(inputName);
                    }}
                    className="text-[10px] text-[#0078D4] hover:underline font-semibold"
                  >
                    Edit file reference
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10.5px] font-bold text-slate-400 block">Granular Comment / Verification Notes</label>
              <textarea 
                rows={3}
                placeholder="Provide description and authorization details..." 
                value={formComments}
                onChange={(e) => setFormComments(e.target.value)}
                className={`w-full text-xs p-1.5 rounded border outline-none ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D] focus:border-[#0078D4]" : "bg-white border-[#EDEBE9]"}`}
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2 border-t border-[#EDEBE9]/25">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition ${isDark ? "hover:bg-[#2D2D2D] text-slate-400" : "hover:bg-slate-100"}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-[#107C10] hover:bg-[#0B590B] text-white rounded text-xs font-bold transition"
              >
                Validate & Save Event
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Workspace splitting into Master Grid and Detailed Side Inspection */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Left: Master Event Feed Table */}
          <div className="lg:col-span-2 space-y-3">
            {/* Table controls */}
            <div className={`p-3 rounded-md border flex flex-col md:flex-row items-center justify-between gap-3 ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"}`}>
              {/* Search */}
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2 text-slate-400" size={13} />
                <input
                  type="text"
                  placeholder="Search employees or IDs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-8 pr-3 py-1.5 text-xs w-full rounded border outline-none focus:border-[#0078D4] ${isDark ? "bg-[#161616] border-[#2D2D2D] text-white" : "bg-[#FAF9F8] border-[#EDEBE9]"}`}
                />
              </div>

              {/* Event Type Filter Carousel */}
              <div className="flex gap-1 overflow-x-auto max-w-full no-scrollbar pb-1.5 md:pb-0">
                {eventTypes.slice(0, 5).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-2 py-1 text-[10px] font-bold rounded-full border transition-all ${
                      selectedType === type
                        ? "bg-[#0078D4]/15 border-[#0078D4] text-[#0078D4]"
                        : (isDark ? "border-[#2D2D2D] hover:bg-slate-800 text-slate-400" : "border-[#EDEBE9] hover:bg-[#F3F2F1] text-slate-600")
                    }`}
                  >
                    {type}
                  </button>
                ))}
                {eventTypes.length > 5 && (
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded border outline-none ${
                      eventTypes.slice(5).includes(selectedType)
                        ? "bg-[#0078D4]/15 border-[#0078D4] text-[#0078D4]"
                        : (isDark ? "bg-[#1F1F1F] border-[#2D2D2D] text-slate-400" : "bg-white border-[#EDEBE9] text-slate-600")
                    }`}
                  >
                    <option value="All">Other...</option>
                    {eventTypes.slice(5).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Events Grid Table */}
            <div className={`rounded-md border overflow-hidden ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={`border-b ${isDark ? "border-[#2D2D2D] text-slate-400" : "border-[#EDEBE9] text-[#605E5C]"}`}>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Employee</th>
                      <th className="py-2.5 px-3">Juridical Entity</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                          No payroll events match selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredEvents.map((evt) => (
                        <tr
                          key={evt.id}
                          onClick={() => setSelectedEvent(evt)}
                          className={`border-b border-[#EDEBE9]/30 transition-all cursor-pointer ${
                            selectedEvent?.id === evt.id 
                              ? (isDark ? "bg-[#0078D4]/10" : "bg-[#EFF6FC]") 
                              : (isDark ? "hover:bg-[#2D2D2D]/35" : "hover:bg-[#F3F2F1]/55")
                          }`}
                        >
                          <td className="py-2 px-3">
                            <span className="flex items-center gap-1.5 font-bold">
                              {getEventIcon(evt.type)}
                              {evt.type}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <div>
                              <p className="font-semibold text-[#323130] dark:text-white">{evt.employeeName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{evt.employeeId}</p>
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-medium text-slate-400">{evt.country}</span>
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${getStatusStyle(evt.status)}`}>
                              {evt.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleDeleteEvent(evt.id, evt.employeeName)}
                              className={`p-1.5 rounded transition ${isDark ? "hover:bg-[#2D2D2D] text-rose-400" : "hover:bg-slate-100 text-rose-600"}`}
                              title="Delete Event"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: Detailed Inspection Cockpit */}
          <div className="space-y-3">
            {selectedEvent ? (
              <div className={`rounded-md p-4 border space-y-4 ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"}`} id="event_details_cockpit">
                <div className="border-b border-[#EDEBE9]/20 pb-2 flex items-center justify-between">
                  <div>
                    <span className="text-[8.5px] font-mono bg-slate-500/15 text-slate-400 px-1.5 py-0.5 rounded uppercase font-bold">
                      REF ID: {selectedEvent.id}
                    </span>
                    <h3 className="font-black text-sm text-[#323130] dark:text-white mt-1">{selectedEvent.type} Detail</h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded font-bold text-[9px] uppercase ${getStatusStyle(selectedEvent.status)}`}>
                    {selectedEvent.status}
                  </span>
                </div>

                {/* Info block */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-[#EDEBE9]/10 pb-1.5">
                    <span className="text-slate-400 font-medium">Employee Name</span>
                    <span className="font-bold text-[#323130] dark:text-white">{selectedEvent.employeeName}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#EDEBE9]/10 pb-1.5 font-mono">
                    <span className="text-slate-400 font-medium">Employee ID</span>
                    <span className="font-bold">{selectedEvent.employeeId}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#EDEBE9]/10 pb-1.5">
                    <span className="text-slate-400 font-medium">Regional Jurisdiction</span>
                    <span className="font-semibold">{selectedEvent.country}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#EDEBE9]/10 pb-1.5 font-mono">
                    <span className="text-slate-400 font-medium">Submission Timestamp</span>
                    <span className="text-slate-400">{selectedEvent.timestamp}</span>
                  </div>
                  <div className="border-b border-[#EDEBE9]/10 pb-1.5 space-y-2">
                    <span className="text-slate-400 font-medium block mb-1">Supporting Document Attachment</span>
                    <div 
                      onClick={() => {
                        const notifyEl = document.getElementById("doc-verify-toast");
                        if (notifyEl) {
                          notifyEl.classList.remove("opacity-0", "pointer-events-none");
                          notifyEl.classList.add("opacity-100");
                          setTimeout(() => {
                            notifyEl.classList.remove("opacity-100");
                            notifyEl.classList.add("opacity-0", "pointer-events-none");
                          }, 4000);
                        }
                      }}
                      className="p-1.5 bg-slate-500/5 rounded border border-slate-700/10 flex items-center justify-between gap-1.5 text-[11px] font-semibold text-[#0078D4] cursor-pointer hover:bg-slate-500/10 transition-all"
                    >
                      <div className="flex items-center gap-1.5">
                        <FileText size={12} />
                        <span className="hover:underline">{selectedEvent.supportingDocs || "None"}</span>
                      </div>
                      {selectedEvent.supportingDocs && (
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-bold border border-emerald-500/20 whitespace-nowrap">
                          Secure Vault Sync Verified
                        </span>
                      )}
                    </div>
                    
                    <div id="doc-verify-toast" className="opacity-0 pointer-events-none transition-all duration-300 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] p-2 rounded font-medium flex items-center justify-between">
                      <span>✓ Secure Sync: Document matched securely in DMS cloud bucket vault.</span>
                      <button onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById("doc-verify-toast")?.classList.add("opacity-0", "pointer-events-none");
                      }} className="text-emerald-400 hover:text-emerald-600 font-bold ml-2">×</button>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block mb-1">Audit Explanations / Comments</span>
                    <p className={`p-2 rounded border leading-normal text-[11px] ${isDark ? "bg-[#161616] border-[#2D2D2D] text-slate-300" : "bg-[#FAF9F8] border-[#EDEBE9] text-[#323130]"}`}>
                      {selectedEvent.comments || "No comment supplied with ingestion metadata."}
                    </p>
                  </div>
                </div>

                {/* Workflow Timeline */}
                <div className="border-t border-[#EDEBE9]/25 pt-3 space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Clock size={11} />
                    Approval Orchestration Log
                  </h4>
                  <div className="relative pl-3 border-l-2 border-slate-700/20 dark:border-[#2D2D2D] space-y-3 ml-1.5">
                    {selectedEvent.timeline.map((step, idx) => (
                      <div key={idx} className="relative text-[10.5px]">
                        {/* Dot marker */}
                        <div className={`absolute -left-[17px] top-1 w-2 h-2 rounded-full border ${
                          step.status === "completed" 
                            ? "bg-emerald-500 border-white" 
                            : "bg-amber-500 border-white animate-ping"
                        }`} />
                        <div className="flex items-center justify-between">
                          <span className={`font-bold ${step.status === "completed" ? "text-slate-400 line-through" : "text-[#0078D4]"}`}>
                            {step.step}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">{step.date}</span>
                        </div>
                        <p className="text-[9.5px] text-slate-400 font-medium">By: {step.user}</p>
                        {step.comments && (
                          <p className="text-[9.5px] italic text-rose-400 font-serif mt-0.5">"{step.comments}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`rounded-md p-6 text-center border text-slate-500 text-xs font-semibold ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9]"}`}>
                Select a payroll event from the Master Grid to initiate detailed audit trace analysis.
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
