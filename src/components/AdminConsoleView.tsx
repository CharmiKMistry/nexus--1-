import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Slider,
  IconButton,
  Tooltip,
  Card,
  CardContent,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  History as HistoryIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  RotateLeft as RotateLeftIcon,
  LockReset as LockResetIcon,
  Save as SaveIcon,
  Laptop as LaptopIcon,
  Smartphone as SmartphoneIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";

interface AdminConsoleViewProps {
  theme: "dark" | "light";
  onResetDatabase: (isDynamic?: boolean, loadHistoric?: boolean) => Promise<boolean>;
  currentRole: string;
  onRoleChange: (role: any) => void;
}

export default function AdminConsoleView({
  theme,
  onResetDatabase,
  currentRole,
  onRoleChange,
}: AdminConsoleViewProps) {
  const [activeSubTab, setActiveSubTab] = useState(0);
  const [sessionTimeout, setSessionTimeout] = useState(15);
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);
  const [isResetting, setIsResetting] = useState(false);

  // Enterprise Users, Permissions, & Logs
  const [userList, setUserList] = useState<any[]>([]);
  const [permissionsMatrix, setPermissionsMatrix] = useState<any[]>([]);
  const [loginLogs, setLoginLogs] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // User Form Modal States
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPsNumber, setFormPsNumber] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formCountry, setFormCountry] = useState("India");
  const [formRoles, setFormRoles] = useState<string[]>([]);
  const [formMfa, setFormMfa] = useState(true);
  const [formStatus, setFormStatus] = useState("Active");

  const isDark = theme === "dark";

  // Fetch all live data
  const fetchLiveAdminData = async () => {
    setIsLoadingData(true);
    try {
      // 1. Fetch Users
      const uRes = await fetch("/api/users");
      const uData = await uRes.json();
      setUserList(uData);

      // 2. Fetch Permissions Matrix
      const pRes = await fetch("/api/permissions");
      const pData = await pRes.json();
      setPermissionsMatrix(pData);

      // 3. Fetch Login Activities
      const lRes = await fetch("/api/login-logs");
      const lData = await lRes.json();
      setLoginLogs(lData);
    } catch (err) {
      console.error("Failed to load admin logs/users:", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchLiveAdminData();
  }, []);

  const handleSubTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveSubTab(newValue);
  };

  // Open User Dialog for Add or Edit
  const openUserModal = (user: any | null) => {
    if (user) {
      setEditingUser(user);
      setFormName(user.name || "");
      setFormEmail(user.email || "");
      setFormPsNumber(user.psNumber || "");
      setFormDepartment(user.department || "");
      setFormCountry(user.country || "Singapore");
      setFormRoles(user.roles || []);
      setFormMfa(user.mfaEnabled ?? true);
      setFormStatus(user.status || "Active");
    } else {
      setEditingUser(null);
      setFormName("");
      setFormEmail("");
      setFormPsNumber(`PS-0${Math.floor(10000 + Math.random() * 90000)}`);
      setFormDepartment("Payroll Operations");
      setFormCountry("Singapore");
      setFormRoles(["Payroll Admin"]);
      setFormMfa(true);
      setFormStatus("Active");
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail || !formName) {
      alert("Please fill in all mandatory fields.");
      return;
    }

    const payload = {
      id: editingUser ? editingUser.id : `usr-${Date.now()}`,
      name: formName,
      email: formEmail,
      psNumber: formPsNumber,
      department: formDepartment,
      country: formCountry,
      roles: formRoles,
      mfaEnabled: formMfa,
      status: formStatus,
    };

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(editingUser ? "✓ User profile updated successfully!" : "✓ New Enterprise User enrolled successfully!");
        setIsUserModalOpen(false);
        fetchLiveAdminData();
      } else {
        alert("Failed to commit user profile changes.");
      }
    } catch (err) {
      alert("Error saving user.");
    }
  };

  const handleRevokeUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to permanently revoke this user's workspace privileges and delete their account profile?")) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("✓ User account revoked.");
        fetchLiveAdminData();
      } else {
        alert("Error revoking account.");
      }
    } catch (err) {
      alert("Error.");
    }
  };

  const handleToggleUserStatus = async (user: any) => {
    const nextStatus = user.status === "Active" ? "Suspended" : "Active";
    const msg = `Are you sure you want to toggle account status for ${user.name} to ${nextStatus}?`;
    if (!window.confirm(msg)) return;

    const payload = { ...user, status: nextStatus };
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert(`✓ User status set to ${nextStatus}.`);
        fetchLiveAdminData();
      } else {
        alert("Error toggling status.");
      }
    } catch (err) {
      alert("Error toggling status.");
    }
  };

  const handleResetUserPassword = async (user: any) => {
    const customPassword = `NEXUS-${Math.floor(100000 + Math.random() * 900000)}#`;
    const msg = `Reset credentials for ${user.name}?\nA temporary Microsoft Entra ID password will be dispatched to ${user.email}.`;
    if (!window.confirm(msg)) return;

    try {
      const res = await fetch(`/api/users/${user.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temporaryPassword: customPassword }),
      });
      if (res.ok) {
        alert(`✓ Password successfully reset! Clear text: "${customPassword}". Lock counts cleared and status set to Active.`);
        fetchLiveAdminData();
      } else {
        alert("Error resetting password.");
      }
    } catch (err) {
      alert("Error resetting password.");
    }
  };

  const handleToggleFormRole = (role: string) => {
    setFormRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleTogglePermission = (roleName: string, permissionKey: string) => {
    setPermissionsMatrix((prev) =>
      prev.map((r) => {
        if (r.role === roleName) {
          return {
            ...r,
            permissions: {
              ...r.permissions,
              [permissionKey]: !r.permissions[permissionKey],
            },
          };
        }
        return r;
      })
    );
  };

  const handleSavePermissionMatrix = async () => {
    try {
      const res = await fetch("/api/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(permissionsMatrix),
      });
      if (res.ok) {
        alert("✓ Configurable Permission Matrix updated on the database server!\n\nAll security checkpoints have adjusted authorization vectors instantly.");
      } else {
        alert("Failed to save permission changes.");
      }
    } catch (err) {
      alert("Error saving matrix.");
    }
  };

  // Demo Reseeder
  const handleResetTrigger = async () => {
    if (!window.confirm("Are you sure you want to perform a One-Click Database Reset? This will wipe all custom overrides and re-seed the standard event collections.")) {
      return;
    }

    setIsResetting(true);
    try {
      const success = await onResetDatabase(true, true);
      if (success) {
        alert("✓ Enterprise Platform Reset Complete! Re-seeded all collections to baseline configurations.");
        fetchLiveAdminData();
      } else {
        alert("Reseeding failed. Check dev logs.");
      }
    } catch (err) {
      alert("Reset execution failed.");
    } finally {
      setIsResetting(false);
    }
  };

  // Compute stats
  const totalUsers = userList.length;
  const lockedUsers = userList.filter((u) => u.status === "Locked").length;
  const mfaCount = userList.filter((u) => u.mfaEnabled).length;
  const mfaPercentage = totalUsers > 0 ? Math.round((mfaCount / totalUsers) * 100) : 0;

  const allSystemRoles = [
    "Super Admin",
    "Payroll Administrator",
    "Country Payroll Administrator",
    "HR",
    "Finance",
    "Compliance Officer",
    "Auditor",
    "Executive Leadership",
    "Business Manager",
    "Client Manager",
    "LTTS Project Manager",
    "Employee",
  ];

  return (
    <Box sx={{ p: 1, display: "flex", flexDirection: "column", gap: 3 }} id="admin_console_container">
      {/* Title Header Card */}
      <Card sx={{ bgcolor: isDark ? "#1E293B" : "#FFFFFF", border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`, boxShadow: 1 }}>
        <CardContent sx={{ p: 3, display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", alignItems: "center", gap: 3 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <SettingsIcon color="primary" />
              <Typography variant="overline" sx={{ fontWeight: 800, color: "text.secondary", letterSpacing: "1px" }}>
                Governance Administration
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: isDark ? "#FFFFFF" : "#1E293B" }}>
              NEXUS Administrator Console
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxW: 600 }}>
              Enroll corporate identities, adjust fine-grained role capabilities, audit secure logins, and configure global platform thresholds.
            </Typography>
          </Box>

          {/* Quick Metrics */}
          <Box sx={{ display: "flex", gap: 2 }}>
            <Paper sx={{ p: 2, textAlign: "center", border: "1px solid", borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", bgcolor: isDark ? "rgba(255,255,255,0.01)" : "#F9FAFB" }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>
                LOCK INCIDENTS
              </Typography>
              <Typography variant="h6" color="error" sx={{ fontWeight: 800 }}>
                {lockedUsers} Accounts
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, textAlign: "center", border: "1px solid", borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", bgcolor: isDark ? "rgba(255,255,255,0.01)" : "#F9FAFB" }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>
                MFA COVERAGE
              </Typography>
              <Typography variant="h6" color="success" sx={{ fontWeight: 800 }}>
                {mfaPercentage}%
              </Typography>
            </Paper>
          </Box>
        </CardContent>
      </Card>

      {/* Navigation Sub-Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: isDark ? "#334155" : "#E2E8F0" }}>
        <Tabs value={activeSubTab} onChange={handleSubTabChange} variant="scrollable" scrollButtons="auto" textColor="primary" indicatorColor="primary">
          <Tab icon={<PeopleIcon sx={{ fontSize: 18 }} />} label="User Directory" iconPosition="start" sx={{ textTransform: "none", fontWeight: 700, fontSize: "13px" }} />
          <Tab icon={<SecurityIcon sx={{ fontSize: 18 }} />} label="Permissions Matrix" iconPosition="start" sx={{ textTransform: "none", fontWeight: 700, fontSize: "13px" }} />
          <Tab icon={<HistoryIcon sx={{ fontSize: 18 }} />} label="Audit Logs Feed" iconPosition="start" sx={{ textTransform: "none", fontWeight: 700, fontSize: "13px" }} />
          <Tab icon={<SettingsIcon sx={{ fontSize: 18 }} />} label="Application Settings" iconPosition="start" sx={{ textTransform: "none", fontWeight: 700, fontSize: "13px" }} />
        </Tabs>
      </Box>

      {/* Tab 0: User Management */}
      {activeSubTab === 0 && (
        <Card sx={{ border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`, boxShadow: 1 }}>
          <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Corporate User Directory
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Enroll corporate payroll administrators, toggle accounts active status, and trigger credential resets.
                </Typography>
              </Box>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => openUserModal(null)} sx={{ textTransform: "none", fontWeight: 700 }}>
                Enroll New User
              </Button>
            </Box>

            <TableContainer component={Paper} sx={{ boxShadow: "none", border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`, borderRadius: "6px" }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: isDark ? "#1E293B" : "#F9FAFB" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Full Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Corporate Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>PS Number</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Jurisdiction</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Roles</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>MFA</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userList.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: "11px" }}>{user.psNumber || "N/A"}</TableCell>
                      <TableCell>{user.department}</TableCell>
                      <TableCell>{user.country}</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {user.roles?.map((role: string) => (
                            <Box key={role} sx={{ px: 1, py: 0.2, bgcolor: isDark ? "rgba(37,99,235,0.15)" : "#EFF6FC", color: isDark ? "#60A5FA" : "#1D4ED8", border: "1px solid rgba(37,99,235,0.2)", fontSize: "9px", fontWeight: 700, borderRadius: "4px" }}>
                              {role}
                            </Box>
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {user.mfaEnabled ? (
                          <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />
                        ) : (
                          <Typography variant="caption" color="text.secondary">Disabled</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ px: 1, py: 0.2, width: "fit-content", bgcolor: user.status === "Active" ? "rgba(16,185,129,0.1)" : user.status === "Locked" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", color: user.status === "Active" ? "#10B981" : user.status === "Locked" ? "#EF4444" : "#F59E0B", border: `1px solid ${user.status === "Active" ? "rgba(16,185,129,0.3)" : user.status === "Locked" ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)"}`, fontSize: "9px", fontWeight: 700, borderRadius: "4px" }}>
                          {user.status}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                          <Tooltip title="Edit Profile" arrow>
                            <IconButton size="small" onClick={() => openUserModal(user)}>
                              <EditIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reset Password" arrow>
                            <IconButton size="small" onClick={() => handleResetUserPassword(user)}>
                              <LockResetIcon sx={{ fontSize: 16, color: "#D97706" }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Toggle Status" arrow>
                            <IconButton size="small" onClick={() => handleToggleUserStatus(user)}>
                              <BlockIcon sx={{ fontSize: 16, color: user.status === "Active" ? "#EF4444" : "#10B981" }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Revoke Privileges" arrow>
                            <IconButton size="small" onClick={() => handleRevokeUser(user.id)}>
                              <DeleteIcon sx={{ fontSize: 16, color: "#EF4444" }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Tab 1: Permissions Matrix */}
      {activeSubTab === 1 && (
        <Card sx={{ border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`, boxShadow: 1 }}>
          <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Fine-Grained Permissions Matrix
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Configure authorization gates dynamically. Adjust features allowed for specific corporate personas instantly.
                </Typography>
              </Box>
              <Button variant="contained" startIcon={<SaveIcon />} color="success" onClick={handleSavePermissionMatrix} sx={{ textTransform: "none", fontWeight: 700 }}>
                Save Permissions Grid
              </Button>
            </Box>

            <TableContainer component={Paper} sx={{ boxShadow: "none", border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`, borderRadius: "6px" }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: isDark ? "#1E293B" : "#F9FAFB" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Business Persona Role</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Payroll Upload</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Validation Gate</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Approvals Gate</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Country Rules</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Audit Ledger</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Reports Gate</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Administration</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {permissionsMatrix.map((r) => (
                    <TableRow key={r.role} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{r.role}</TableCell>
                      <TableCell align="center">
                        <Checkbox checked={!!r.permissions["Payroll Upload"]} onChange={() => handleTogglePermission(r.role, "Payroll Upload")} size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox checked={!!r.permissions["Validation"]} onChange={() => handleTogglePermission(r.role, "Validation")} size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox checked={!!r.permissions["Approvals"]} onChange={() => handleTogglePermission(r.role, "Approvals")} size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox checked={!!r.permissions["Country Rules"]} onChange={() => handleTogglePermission(r.role, "Country Rules")} size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox checked={!!r.permissions["Audit"]} onChange={() => handleTogglePermission(r.role, "Audit")} size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox checked={!!r.permissions["Reports"]} onChange={() => handleTogglePermission(r.role, "Reports")} size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox checked={!!r.permissions["Administration"]} onChange={() => handleTogglePermission(r.role, "Administration")} size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Audit Logs Feed */}
      {activeSubTab === 2 && (
        <Card sx={{ border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`, boxShadow: 1 }}>
          <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Login Activity & Security Audit Trail
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Audit secure federated logins, Multi-Factor inputs, locked accounts triggers, and network vectors.
              </Typography>
            </Box>

            <TableContainer component={Paper} sx={{ boxShadow: "none", border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`, borderRadius: "6px" }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: isDark ? "#1E293B" : "#F9FAFB" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Corporate Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Assigned User</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Environment</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Access Node IP</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Auth Protocol</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Incident Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loginLogs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: "11px", color: "text.secondary" }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{log.email}</TableCell>
                      <TableCell>{log.name}</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, fontSize: "11px" }}>
                          {log.device?.includes("Desktop") ? <LaptopIcon sx={{ fontSize: 13 }} /> : <SmartphoneIcon sx={{ fontSize: 13 }} />}
                          <span>{log.browser} | {log.device}</span>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontFamily: "monospace", color: "text.secondary" }}>{log.ip}</TableCell>
                      <TableCell>
                        <Box sx={{ px: 1, py: 0.2, bgcolor: isDark ? "rgba(59,130,246,0.15)" : "#EFF6FC", color: "#3B82F6", border: "1px solid rgba(59,130,246,0.2)", fontSize: "9px", fontWeight: 700, borderRadius: "4px", width: "fit-content" }}>
                          {log.method}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ px: 1, py: 0.2, width: "fit-content", bgcolor: log.status === "Success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: log.status === "Success" ? "#10B981" : "#EF4444", border: `1px solid ${log.status === "Success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, fontSize: "9px", fontWeight: 700, borderRadius: "4px" }}>
                          {log.status}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary", fontSize: "11px", maxW: 180, textOverflow: "ellipsis", overflow: "hidden", whitespace: "nowrap" }} title={log.details || ""}>
                        {log.details || "✓ Cleared security checkpoints."}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
      {activeSubTab === 3 && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Platform Thresholds */}
          <div className="md:col-span-7">
            <Card sx={{ border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`, boxShadow: 1, height: "100%" }}>
              <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3.5 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Global Platform Configuration
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Configure thresholds, session expirations, and regulatory scanning rules globally.
                  </Typography>
                </Box>

                {/* Session Timeout */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Authorized Inactivity Session Timeout (Minutes)
                  </Typography>
                  <TextField size="small" type="number" value={sessionTimeout} onChange={(e) => setSessionTimeout(parseInt(e.target.value) || 15)} sx={{ maxW: 160 }} />
                  <Typography variant="caption" color="text.secondary">
                    Enforces corporate auto-logout rules under Microsoft Entra standards to prevent unauthorized workspace access.
                  </Typography>
                </Box>

                {/* Anomaly Threshold Slider */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Minimum Validation Confidence Threshold
                    </Typography>
                    <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 800 }}>
                      {confidenceThreshold}% Confidence
                    </Typography>
                  </Box>
                  <Slider value={confidenceThreshold} onChange={(e, val) => setConfidenceThreshold(val as number)} min={50} max={95} valueLabelDisplay="auto" />
                  <Typography variant="caption" color="text.secondary">
                    Issues identified below this confidence limit are queued for background automated matching before flagging manual review tasks.
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button variant="contained" startIcon={<SaveIcon />} onClick={() => alert("✓ Global configurations saved and synchronized in real-time across regional runners.")} sx={{ textTransform: "none", fontWeight: 700 }}>
                    Save Configuration
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </div>

          {/* Sandbox controller */}
          <div className="md:col-span-5">
            <Card sx={{ border: "1px solid", borderColor: isDark ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.2)", bgcolor: isDark ? "rgba(239,68,68,0.02)" : "rgba(239,68,68,0.01)", boxShadow: 1, height: "100%" }}>
              <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.5, height: "100%", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography variant="subtitle1" color="error" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
                    Platform State Seeder
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Wipe customized adjustments and re-seed the system's corporate directories, country rules, and timesheets to standard production state.
                  </Typography>
                </Box>

                <Box sx={{ p: 2, bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#FFF", border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`, borderRadius: "6px" }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.primary", display: "block" }}>
                    Sandbox Database Details
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "11px", mt: 0.5, color: "text.secondary" }}>
                    Adapter: Firebase Firestore DB<br />
                    Schema Version: v3.0 Relational Map<br />
                    Index Buffers: Active (Compound)
                  </Typography>
                </Box>

                <Button variant="contained" color="error" startIcon={<RotateLeftIcon />} disabled={isResetting} onClick={handleResetTrigger} sx={{ textTransform: "none", fontWeight: 700, py: 1 }}>
                  {isResetting ? "Seeding Database..." : "One-Click Sandbox Reset"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* User Edit / Add Dialogue Box */}
      <Dialog open={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSaveUser}>
          <DialogTitle sx={{ fontWeight: 800 }}>
            {editingUser ? "Edit User Profile" : "Enroll New Enterprise User"}
          </DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "20px !important", maxHeight: "70vh", overflowY: "auto" }}>
            <TextField fullWidth label="Full Name" size="small" value={formName} onChange={(e) => setFormName(e.target.value)} required />
            <TextField fullWidth label="Corporate Email" size="small" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} required />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <TextField fullWidth label="PS Number" size="small" value={formPsNumber} onChange={(e) => setFormPsNumber(e.target.value)} required disabled />
              </div>
              <div>
                <TextField fullWidth label="Department" size="small" value={formDepartment} onChange={(e) => setFormDepartment(e.target.value)} required />
              </div>
            </div>

            <FormControl fullWidth size="small">
              <InputLabel>Country Jurisdiction</InputLabel>
              <Select value={formCountry} label="Country Jurisdiction" onChange={(e) => setFormCountry(e.target.value as string)}>
                <MenuItem value="India">India 🇮🇳</MenuItem>
                <MenuItem value="Singapore">Singapore 🇸🇬</MenuItem>
                <MenuItem value="United States">United States 🇺🇸</MenuItem>
                <MenuItem value="United Kingdom">United Kingdom 🇬🇧</MenuItem>
                <MenuItem value="Canada">Canada 🇨🇦</MenuItem>
                <MenuItem value="Australia">Australia 🇦🇺</MenuItem>
                <MenuItem value="Japan">Japan 🇯🇵</MenuItem>
                <MenuItem value="Germany">Germany 🇩🇪</MenuItem>
                <MenuItem value="United Arab Emirates">United Arab Emirates 🇦🇪</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "block", mb: 1 }}>
                Authorize Business Roles
              </Typography>
              <div className="grid grid-cols-2 gap-1">
                {allSystemRoles.map((role) => {
                  const hasRole = formRoles.includes(role);
                  return (
                    <div key={role}>
                      <FormControlLabel control={<Checkbox checked={hasRole} onChange={() => handleToggleFormRole(role)} size="small" />} label={<Typography sx={{ fontSize: "12px" }}>{role}</Typography>} />
                    </div>
                  );
                })}
              </div>
            </Box>

            <FormControlLabel control={<Checkbox checked={formMfa} onChange={(e) => setFormMfa(e.target.checked)} />} label="Enforce Multi-Factor Authentication (MFA) via Entra Authenticator" />

            <FormControl fullWidth size="small">
              <InputLabel>User Status</InputLabel>
              <Select value={formStatus} label="User Status" onChange={(e) => setFormStatus(e.target.value as string)}>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Suspended">Suspended</MenuItem>
                <MenuItem value="Locked">Locked (Security Hold)</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setIsUserModalOpen(false)} color="inherit" sx={{ textTransform: "none", fontWeight: 700 }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" startIcon={<SaveIcon />} sx={{ textTransform: "none", fontWeight: 700 }}>
              Commit Changes
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
