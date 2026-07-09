import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  Typography,
  Tooltip,
  Avatar,
  Paper,
  Button,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemText
} from "@mui/material";
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  WbSunny as SunIcon,
  NightsStay as MoonIcon,
  Shield as ShieldIcon,
  Logout as LogoutIcon,
  AccessTime as AccessTimeIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Help as HelpIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  ListAlt as ListAltIcon,
  ContactMail as ContactIcon,
  VpnKey as VpnKeyIcon,
  TravelExplore as TravelIcon
} from "@mui/icons-material";
import { UserRole, Employee, Country, ValidationResult, ReconciliationResult, AuditLog } from "../types";
import { useLocalization } from "./LocalizationContext";
import { languageMeta } from "../lib/translations";

interface HeaderProps {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  globalSearch: string;
  setGlobalSearch: (search: string) => void;
  notificationsCount: number;
  onOpenNotifications: () => void;
  currentUser: any;
  onSignOut: () => void;
  
  // Enterprise search lists (optional fallback)
  employees?: Employee[];
  countries?: Country[];
  validations?: ValidationResult[];
  reconciliations?: ReconciliationResult[];
  auditLogs?: AuditLog[];
  setActiveTab?: (tab: string) => void;
}

export default function Header({
  currentRole,
  setCurrentRole,
  theme,
  setTheme,
  globalSearch,
  setGlobalSearch,
  notificationsCount,
  onOpenNotifications,
  currentUser,
  onSignOut,
  employees = [],
  countries = [],
  validations = [],
  reconciliations = [],
  auditLogs = [],
  setActiveTab
}: HeaderProps) {
  const { language, setLanguage, isRtl, t, formatDate, formatCurrency } = useLocalization();
  
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [roleAnchorEl, setRoleAnchorEl] = useState<null | HTMLElement>(null);
  const [languageAnchorEl, setLanguageAnchorEl] = useState<null | HTMLElement>(null);
  const [helpAnchorEl, setHelpAnchorEl] = useState<null | HTMLElement>(null);
  
  // Dialog Open States for Help Center
  const [openUserGuide, setOpenUserGuide] = useState(false);
  const [openFaq, setOpenFaq] = useState(false);
  const [openShortcuts, setOpenShortcuts] = useState(false);
  const [openContactAdmin, setOpenContactAdmin] = useState(false);
  const [openAbout, setOpenAbout] = useState(false);
  const [openReleaseNotes, setOpenReleaseNotes] = useState(false);
  
  // Search state
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Fallback user info
  const userObj = currentUser || {
    name: "Ronak Surve",
    email: "ronaksurve96@gmail.com",
    department: "Executive Office",
    country: "India",
    roles: ["Super Admin"],
  };

  const isSuperAdmin = userObj.roles?.includes("Super Admin") || currentRole === "Super Admin";

  const availableRoles: UserRole[] = isSuperAdmin 
    ? ["Super Admin"] 
    : (userObj.roles || []).filter((r: string) => r !== "Super Admin") as UserRole[];

  const isDark = theme === "dark";

  // Initials generator
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Close search popup if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileAnchorEl(null);
  };

  const handleRoleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (availableRoles.length > 1) {
      setRoleAnchorEl(event.currentTarget);
    }
  };

  const handleRoleMenuClose = () => {
    setRoleAnchorEl(null);
  };

  const handleLanguageMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLanguageAnchorEl(event.currentTarget);
  };

  const handleLanguageMenuClose = () => {
    setLanguageAnchorEl(null);
  };

  const handleHelpMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setHelpAnchorEl(event.currentTarget);
  };

  const handleHelpMenuClose = () => {
    setHelpAnchorEl(null);
  };

  // Filter lists based on Global Search query
  const query = globalSearch.toLowerCase().trim();
  const searchResults = {
    employees: query ? employees.filter(e => e.name.toLowerCase().includes(query) || e.id.toLowerCase().includes(query) || e.title.toLowerCase().includes(query) || e.department.toLowerCase().includes(query)) : [],
    countries: query ? countries.filter(c => c.name.toLowerCase().includes(query) || c.id.toLowerCase().includes(query)) : [],
    validations: query ? validations.filter(v => v.employeeName.toLowerCase().includes(query) || v.issueType.toLowerCase().includes(query) || v.explanation.toLowerCase().includes(query)) : [],
    reconciliations: query ? reconciliations.filter(r => r.name.toLowerCase().includes(query) || r.discrepancy.toLowerCase().includes(query)) : [],
    auditLogs: query ? auditLogs.filter(a => a.user.toLowerCase().includes(query) || a.action.toLowerCase().includes(query) || a.details.toLowerCase().includes(query)) : []
  };

  const hasAnyResults = query && (
    searchResults.employees.length > 0 ||
    searchResults.countries.length > 0 ||
    searchResults.validations.length > 0 ||
    searchResults.reconciliations.length > 0 ||
    searchResults.auditLogs.length > 0
  );

  return (
    <Box
      sx={{
        height: 56,
        px: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: isDark ? "#111827" : "#FFFFFF",
        borderBottom: `1px solid ${isDark ? "#374151" : "#E5E7EB"}`,
        color: isDark ? "#F3F4F6" : "#111827",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        zIndex: 50,
      }}
      id="nexus_header"
    >
      {/* Global Search Component with Instant Category Overlay */}
      <Box
        ref={searchContainerRef}
        sx={{
          display: "flex",
          flexDirection: "column",
          position: "relative",
          width: "100%",
          maxWidth: 360,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            backgroundColor: isDark ? "#1F2937" : "#F3F4F6",
            borderRadius: "6px",
            px: 1.5,
            py: 0.5,
            border: `1px solid ${isDark ? "transparent" : "#E5E7EB"}`,
            transition: "all 0.2s ease",
            "&:focus-within": {
              border: "1px solid #2563EB",
              backgroundColor: isDark ? "#111827" : "#FFFFFF",
              boxShadow: "0 0 0 1px #2563EB",
            },
          }}
        >
          <SearchIcon sx={{ color: isDark ? "#9CA3AF" : "#6B7280", fontSize: 18, mr: 1 }} />
          <InputBase
            placeholder={t("global_search")}
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            sx={{
              fontSize: "12.5px",
              color: "inherit",
              width: "100%",
              fontFamily: "inherit",
            }}
            id="global_search_input"
          />
        </Box>

        {/* Global Search Result Dropdown Drawer */}
        {searchFocused && query && (
          <Paper
            id="global_search_dropdown"
            sx={{
              position: "absolute",
              top: 48,
              left: 0,
              right: 0,
              maxHeight: 450,
              overflowY: "auto",
              zIndex: 9999,
              backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
              border: `1px solid ${isDark ? "#374151" : "#E5E7EB"}`,
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              borderRadius: "6px",
              p: 1.5,
            }}
          >
            {!hasAnyResults ? (
              <Box sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  No results found for "{globalSearch}"
                </Typography>
              </Box>
            ) : (
              <Box>
                {/* Employee Results */}
                {searchResults.employees.length > 0 && (
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main", textTransform: "uppercase" }}>
                      Employees ({searchResults.employees.length})
                    </Typography>
                    <List dense sx={{ py: 0 }}>
                      {searchResults.employees.slice(0, 3).map(emp => (
                        <ListItem
                          key={emp.id}
                          onClick={() => {
                            if (setActiveTab) setActiveTab("manpower");
                            setSearchFocused(false);
                          }}
                          sx={{ py: 0.5, borderRadius: "4px", cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                        >
                          <ListItemText
                            primary={
                              <Typography sx={{ fontSize: "11.5px", fontWeight: 600 }}>
                                {emp.name}
                              </Typography>
                            }
                            secondary={
                              <Typography sx={{ fontSize: "10px", color: "text.secondary" }}>
                                {`${emp.id} • ${emp.country} • ${emp.department} • ${formatCurrency(emp.salary)}`}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Country Results */}
                {searchResults.countries.length > 0 && (
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main", textTransform: "uppercase" }}>
                      Countries ({searchResults.countries.length})
                    </Typography>
                    <List dense sx={{ py: 0 }}>
                      {searchResults.countries.slice(0, 3).map(c => (
                        <ListItem
                          key={c.id}
                          onClick={() => {
                            if (setActiveTab) setActiveTab("rules");
                            setSearchFocused(false);
                          }}
                          sx={{ py: 0.5, borderRadius: "4px", cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                        >
                          <ListItemText
                            primary={
                              <Typography sx={{ fontSize: "11.5px", fontWeight: 600 }}>
                                {c.flag} {c.name}
                              </Typography>
                            }
                            secondary={
                              <Typography sx={{ fontSize: "10px", color: "text.secondary" }}>
                                {`Working Hours: ${c.workingHours}h • Currency: ${c.currency}`}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Validation Results */}
                {searchResults.validations.length > 0 && (
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main", textTransform: "uppercase" }}>
                      Validation Issues ({searchResults.validations.length})
                    </Typography>
                    <List dense sx={{ py: 0 }}>
                      {searchResults.validations.slice(0, 3).map(v => (
                        <ListItem
                          key={v.id}
                          onClick={() => {
                            if (setActiveTab) setActiveTab("validation");
                            setSearchFocused(false);
                          }}
                          sx={{ py: 0.5, borderRadius: "4px", cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                        >
                          <ListItemText
                            primary={
                              <Typography sx={{ fontSize: "11.5px", fontWeight: 600 }}>
                                {v.employeeName} - {v.issueType}
                              </Typography>
                            }
                            secondary={
                              <Typography sx={{ fontSize: "10px", color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {v.explanation}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Reconciliation Reports */}
                {searchResults.reconciliations.length > 0 && (
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main", textTransform: "uppercase" }}>
                      Reconciliation Discrepancies ({searchResults.reconciliations.length})
                    </Typography>
                    <List dense sx={{ py: 0 }}>
                      {searchResults.reconciliations.slice(0, 3).map(r => (
                        <ListItem
                          key={r.id}
                          onClick={() => {
                            if (setActiveTab) setActiveTab("reconciliation");
                            setSearchFocused(false);
                          }}
                          sx={{ py: 0.5, borderRadius: "4px", cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                        >
                          <ListItemText
                            primary={
                              <Typography sx={{ fontSize: "11.5px", fontWeight: 600 }}>
                                {r.name}
                              </Typography>
                            }
                            secondary={
                              <Typography sx={{ fontSize: "10px", color: "text.secondary" }}>
                                {`Diff: ${r.discrepancy} (${r.type})`}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Audit Logs */}
                {searchResults.auditLogs.length > 0 && (
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main", textTransform: "uppercase" }}>
                      Audit Logs ({searchResults.auditLogs.length})
                    </Typography>
                    <List dense sx={{ py: 0 }}>
                      {searchResults.auditLogs.slice(0, 3).map(a => (
                        <ListItem
                          key={a.id}
                          onClick={() => {
                            if (setActiveTab) setActiveTab("compliance");
                            setSearchFocused(false);
                          }}
                          sx={{ py: 0.5, borderRadius: "4px", cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                        >
                          <ListItemText
                            primary={
                              <Typography sx={{ fontSize: "11.5px", fontWeight: 600 }}>
                                {a.user} - {a.action}
                              </Typography>
                            }
                            secondary={
                              <Typography sx={{ fontSize: "10px", color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {`${formatDate(a.timestamp)} • ${a.details}`}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        )}
      </Box>

      {/* Action Area */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        {/* UTC Clock */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            gap: 0.8,
            fontSize: "11px",
            fontFamily: "'Roboto Mono', monospace",
            color: isDark ? "#9CA3AF" : "#6B7280",
            backgroundColor: isDark ? "#1F2937" : "#F3F4F6",
            px: 1.5,
            py: 0.5,
            borderRadius: "4px",
            border: `1px solid ${isDark ? "#374151" : "#E5E7EB"}`,
          }}
        >
          <AccessTimeIcon sx={{ fontSize: 12 }} />
          <span>UTC 2026-07-09 07:15</span>
        </Box>

        {/* Dynamic Language Selector with Country Flags */}
        <Tooltip title="Switch Language" arrow>
          <Button
            onClick={handleLanguageMenuOpen}
            id="language_selector_dropdown"
            variant="text"
            size="small"
            startIcon={<span>{languageMeta[language]?.flag || "🇺🇸"}</span>}
            sx={{
              height: 34,
              textTransform: "none",
              fontSize: "12px",
              fontWeight: 700,
              color: isDark ? "#F3F4F6" : "#4B5563",
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
              "&:hover": {
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)",
              },
            }}
          >
            {language.toUpperCase()}
          </Button>
        </Tooltip>
        <Menu
          anchorEl={languageAnchorEl}
          open={Boolean(languageAnchorEl)}
          onClose={handleLanguageMenuClose}
          id="language_selector_menu"
          sx={{
            "& .MuiPaper-root": {
              maxHeight: 400,
              backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
              border: `1px solid ${isDark ? "#374151" : "#E5E7EB"}`,
              color: isDark ? "#F3F4F6" : "#111827",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              borderRadius: "6px",
            }
          }}
        >
          {Object.entries(languageMeta).map(([code, meta]) => (
            <MenuItem
              key={code}
              id={`lang_select_${code}`}
              selected={code === language}
              onClick={() => {
                setLanguage(code);
                handleLanguageMenuClose();
              }}
              sx={{
                fontSize: "12.5px",
                py: 1.2,
                px: 2.5,
                fontWeight: code === language ? 700 : 500,
                color: code === language ? (isDark ? "#60A5FA" : "#2563EB") : "inherit",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <span>{meta.flag}</span>
                <span>{meta.label}</span>
              </Box>
            </MenuItem>
          ))}
        </Menu>

        {/* Help Center Menu */}
        <Tooltip title={t("help_center")} arrow>
          <IconButton
            onClick={handleHelpMenuOpen}
            id="help_center_dropdown_trigger"
            sx={{
              color: isDark ? "#D1D5DB" : "#4B5563",
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
              "&:hover": {
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)",
              },
              p: 1,
            }}
          >
            <HelpIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={helpAnchorEl}
          open={Boolean(helpAnchorEl)}
          onClose={handleHelpMenuClose}
          id="help_center_menu"
          sx={{
            "& .MuiPaper-root": {
              width: 220,
              backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
              border: `1px solid ${isDark ? "#374151" : "#E5E7EB"}`,
              color: isDark ? "#F3F4F6" : "#111827",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              borderRadius: "6px",
            }
          }}
        >
          <MenuItem onClick={() => { handleHelpMenuClose(); setOpenUserGuide(true); }}>
            <TravelIcon sx={{ fontSize: 16, mr: 1.5, color: "primary.main" }} />
            {t("user_guide")}
          </MenuItem>
          <MenuItem onClick={() => { handleHelpMenuClose(); setOpenFaq(true); }}>
            <ListAltIcon sx={{ fontSize: 16, mr: 1.5, color: "primary.main" }} />
            {t("help_faq")}
          </MenuItem>
          <MenuItem onClick={() => { handleHelpMenuClose(); setOpenShortcuts(true); }}>
            <VpnKeyIcon sx={{ fontSize: 16, mr: 1.5, color: "primary.main" }} />
            {t("kb_shortcuts")}
          </MenuItem>
          <MenuItem onClick={() => { handleHelpMenuClose(); setOpenContactAdmin(true); }}>
            <ContactIcon sx={{ fontSize: 16, mr: 1.5, color: "primary.main" }} />
            {t("contact_admin")}
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { handleHelpMenuClose(); setOpenReleaseNotes(true); }}>
            <ListAltIcon sx={{ fontSize: 16, mr: 1.5, color: "primary.main" }} />
            {t("release_notes")}
          </MenuItem>
          <MenuItem onClick={() => { handleHelpMenuClose(); setOpenAbout(true); }}>
            <InfoIcon sx={{ fontSize: 16, mr: 1.5, color: "primary.main" }} />
            {t("about_nexus")}
          </MenuItem>
        </Menu>

        {/* Theme Toggle */}
        <Tooltip title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"} arrow>
          <IconButton
            onClick={() => setTheme(isDark ? "light" : "dark")}
            id="theme_toggle_btn"
            sx={{
              color: isDark ? "#FBBF24" : "#D97706",
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
              "&:hover": {
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)",
              },
              p: 1,
            }}
          >
            {isDark ? <SunIcon sx={{ fontSize: 18 }} /> : <MoonIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </Tooltip>

        {/* Notifications Trigger */}
        <Tooltip title={t("notifications")} arrow>
          <IconButton
            onClick={onOpenNotifications}
            id="notif_panel_btn"
            sx={{
              color: isDark ? "#D1D5DB" : "#4B5563",
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
              "&:hover": {
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)",
              },
              p: 1,
            }}
          >
            <Badge badgeContent={notificationsCount} color="error" variant="dot">
              <NotificationsIcon sx={{ fontSize: 18 }} />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Multi-role Switching Button */}
        {!isSuperAdmin && availableRoles.length > 1 && (
          <Box>
            <Button
              onClick={handleRoleMenuOpen}
              id="role_dropdown_btn"
              variant="outlined"
              endIcon={<ArrowDownIcon sx={{ fontSize: 14 }} />}
              sx={{
                height: 34,
                textTransform: "none",
                fontSize: "12px",
                fontWeight: 700,
                borderRadius: "6px",
                px: 1.8,
                color: isDark ? "#60A5FA" : "#2563EB",
                borderColor: isDark ? "rgba(96, 165, 250, 0.3)" : "rgba(37, 99, 235, 0.3)",
                backgroundColor: isDark ? "rgba(96, 165, 250, 0.05)" : "rgba(37, 99, 235, 0.03)",
                "&:hover": {
                  borderColor: isDark ? "#60A5FA" : "#2563EB",
                  backgroundColor: isDark ? "rgba(96, 165, 250, 0.1)" : "rgba(37, 99, 235, 0.08)",
                },
              }}
            >
              <ShieldIcon sx={{ fontSize: 14, mr: 0.8 }} />
              {currentRole}
            </Button>
            <Menu
              anchorEl={roleAnchorEl}
              open={Boolean(roleAnchorEl)}
              onClose={handleRoleMenuClose}
              id="role_switcher_menu"
              sx={{
                "& .MuiPaper-root": {
                  backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                  border: `1px solid ${isDark ? "#374151" : "#E5E7EB"}`,
                  color: isDark ? "#F3F4F6" : "#111827",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  borderRadius: "6px",
                  mt: 0.5,
                  minWidth: 160,
                },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  px: 2,
                  py: 1,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: isDark ? "#9CA3AF" : "#6B7280",
                  borderBottom: `1px solid ${isDark ? "#374151" : "#E5E7EB"}`,
                  mb: 0.5,
                }}
              >
                Switch Role Context
              </Typography>
              {availableRoles.map((role) => (
                <MenuItem
                  key={role}
                  id={`role_select_${role.replace(/\s+/g, "_")}`}
                  selected={role === currentRole}
                  onClick={() => {
                    setCurrentRole(role);
                    handleRoleMenuClose();
                  }}
                  sx={{
                    fontSize: "12.5px",
                    py: 1,
                    px: 2,
                    fontWeight: role === currentRole ? 700 : 500,
                    color: role === currentRole ? (isDark ? "#60A5FA" : "#2563EB") : "inherit",
                    backgroundColor: role === currentRole ? (isDark ? "rgba(96, 165, 250, 0.1)" : "rgba(37, 99, 235, 0.05)") : "transparent",
                    "&:hover": {
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#F3F4F6",
                    },
                  }}
                >
                  {role}
                </MenuItem>
              ))}
            </Menu>
          </Box>
        )}

        {/* Super Admin Badge */}
        {isSuperAdmin && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              backgroundColor: isDark ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.08)",
              border: `1px solid ${isDark ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.2)"}`,
              color: isDark ? "#34D399" : "#059669",
              px: 1.5,
              py: 0.5,
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            <ShieldIcon sx={{ fontSize: 12 }} />
            Super Admin
          </Box>
        )}

        {/* User Profile avatar */}
        <Box
          onClick={handleProfileMenuOpen}
          id="user_profile_trigger"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.2,
            cursor: "pointer",
            p: 0.5,
            borderRadius: "6px",
            "&:hover": {
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
            },
            transition: "all 0.15s ease",
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              fontSize: "13px",
              fontWeight: 700,
              backgroundColor: isDark ? "#2563EB" : "#1D4ED8",
              color: "#FFFFFF",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}`,
            }}
          >
            {getInitials(userObj.name)}
          </Avatar>
        </Box>

        {/* Profile Menu Dropdown */}
        <Menu
          anchorEl={profileAnchorEl}
          open={Boolean(profileAnchorEl)}
          onClose={handleProfileMenuClose}
          id="user_profile_popover"
          sx={{
            "& .MuiPaper-root": {
              width: 300,
              p: 2,
              backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
              border: `1px solid ${isDark ? "#374151" : "#E5E7EB"}`,
              color: isDark ? "#F3F4F6" : "#111827",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
              borderRadius: "8px",
              mt: 1,
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, pb: 1.5, borderBottom: `1px solid ${isDark ? "#374151" : "#E5E7EB"}` }}>
            <Avatar sx={{ width: 48, height: 48, fontSize: "18px", fontWeight: 700, backgroundColor: isDark ? "#2563EB" : "#1D4ED8" }}>
              {getInitials(userObj.name)}
            </Avatar>
            <Box sx={{ overflow: "hidden" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                {userObj.name}
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? "#9CA3AF" : "#6B7280", display: "block" }}>
                {userObj.email}
              </Typography>
            </Box>
          </Box>

          <Button
            onClick={() => {
              handleProfileMenuClose();
              if (setActiveTab) setActiveTab("preferences");
            }}
            variant="outlined"
            fullWidth
            startIcon={<SettingsIcon />}
            sx={{ mb: 1, textTransform: "none", fontSize: "12px", fontWeight: 700 }}
          >
            {t("user_preferences")}
          </Button>

          <Button
            onClick={() => {
              handleProfileMenuClose();
              onSignOut();
            }}
            variant="contained"
            color="error"
            fullWidth
            startIcon={<LogoutIcon />}
            id="sign_out_btn"
            sx={{
              py: 1,
              textTransform: "none",
              fontWeight: 700,
              fontSize: "12px",
              borderRadius: "6px",
            }}
          >
            Sign Out from NEXUS
          </Button>
        </Menu>
      </Box>

      {/* --- help center dialogs --- */}

      {/* User Guide */}
      <Dialog open={openUserGuide} onClose={() => setOpenUserGuide(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>📖 NEXUS User Guide</DialogTitle>
        <DialogContent dividers>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>1. Global Payroll Onboarding</Typography>
          <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
            To onboard countries, use the "Country Rule Engine" to set working hours, tax bands, leave limits, and holiday calendars. Use "Smart Excel Upload" or configure automated pipelines via "Integration Hub".
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>2. AI Compliance &amp; Real-Time Validation</Typography>
          <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
            The NEXUS compliance validation engine checks hourly thresholds, rest intervals, CPF statutory caps, and holiday overtime premiums dynamically upon raw ledger upload.
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>3. Approvals and Audit Trails</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            All operations are tracked in real-time under "Compliance &amp; Audit". Approvals can be certified globally using custom SLA nodes within "Approval Center".
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUserGuide(false)}>{t("cancel")}</Button>
        </DialogActions>
      </Dialog>

      {/* FAQ */}
      <Dialog open={openFaq} onClose={() => setOpenFaq(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>❓ Frequently Asked Questions</DialogTitle>
        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: "13.5px" }}>Q: How do country holiday rules affect overtime?</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
              A: If an employee works on a pre-defined gazetted holiday, the validation engine flags a warning if the 1.5x holiday premium isn't aligned.
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: "13.5px" }}>Q: Can I reorder my dashboard workspace?</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
              A: Yes! Head over to User Preferences &gt; Dashboard Layout to hide or drag-reorder metrics and charts.
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: "13.5px" }}>Q: What happens to my draft changes when I go offline?</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
              A: Form edits auto-save every 30 seconds to browser local storage. If you lose connection, working offline is supported and drafts will synchronize as soon as you reconnect!
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFaq(false)}>{t("cancel")}</Button>
        </DialogActions>
      </Dialog>

      {/* Keyboard Shortcuts */}
      <Dialog open={openShortcuts} onClose={() => setOpenShortcuts(false)} maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>⌨️ Productivity Shortcuts</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: "13px", fontWeight: 600 }}>Global Search</Typography>
              <Paper variant="outlined" sx={{ px: 1, py: 0.2, fontSize: "11px", fontWeight: 700, bgcolor: "action.hover" }}>Ctrl + K</Paper>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: "13px", fontWeight: 600 }}>Excel Upload</Typography>
              <Paper variant="outlined" sx={{ px: 1, py: 0.2, fontSize: "11px", fontWeight: 700, bgcolor: "action.hover" }}>Ctrl + U</Paper>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: "13px", fontWeight: 600 }}>Reports View</Typography>
              <Paper variant="outlined" sx={{ px: 1, py: 0.2, fontSize: "11px", fontWeight: 700, bgcolor: "action.hover" }}>Ctrl + R</Paper>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: "13px", fontWeight: 600 }}>Dashboard</Typography>
              <Paper variant="outlined" sx={{ px: 1, py: 0.2, fontSize: "11px", fontWeight: 700, bgcolor: "action.hover" }}>Ctrl + D</Paper>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: "13px", fontWeight: 600 }}>New Payroll Event</Typography>
              <Paper variant="outlined" sx={{ px: 1, py: 0.2, fontSize: "11px", fontWeight: 700, bgcolor: "action.hover" }}>Ctrl + N</Paper>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: "13px", fontWeight: 600 }}>Close Dialog</Typography>
              <Paper variant="outlined" sx={{ px: 1, py: 0.2, fontSize: "11px", fontWeight: 700, bgcolor: "action.hover" }}>Esc</Paper>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenShortcuts(false)}>{t("cancel")}</Button>
        </DialogActions>
      </Dialog>

      {/* Contact Administrator */}
      <Dialog open={openContactAdmin} onClose={() => setOpenContactAdmin(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>📞 Contact Administrator</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ fontSize: "13.5px", mb: 1, fontWeight: 600 }}>NEXUS Global Enterprise Ops Desk:</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.5 }}>• Email: compliance-desk@nexus.corporate.local</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.5 }}>• Internal Extension: +1 (800) 555-NXUS</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>• Azure AD Directory Group: "NEXUS Core Governance Administrators"</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenContactAdmin(false)}>{t("cancel")}</Button>
        </DialogActions>
      </Dialog>

      {/* Release Notes */}
      <Dialog open={openReleaseNotes} onClose={() => setOpenReleaseNotes(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>🚀 Release Notes - v3.0.0</DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "primary.main" }}>v3.0 - Global Deployable Release (Current)</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            Added multi-language localizations across 16 world regions, offline local cache handling, automatic draft preservation, accessibility (WCAG AA) standard contrast indicators, and customized widget layouts.
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>v2.5 - AI Co-pilot Integration</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Launched fully integrated Gemini-assisted real-time validations, automated CPF cap reconciliations, and compliance audits.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReleaseNotes(false)}>{t("cancel")}</Button>
        </DialogActions>
      </Dialog>

      {/* About */}
      <Dialog open={openAbout} onClose={() => setOpenAbout(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>🏢 About NEXUS</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ fontWeight: 700, fontSize: "14px", mb: 1 }}>NEXUS Governance Engine</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
            NEXUS is an elite, multi-national enterprise payroll validation and reconciliation platform built to align localized legislative guidelines with corporate record streams.
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", fontStyle: "italic" }}>
            Designed with secure zero-trust identity rules and absolute audit trails.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAbout(false)}>{t("cancel")}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
