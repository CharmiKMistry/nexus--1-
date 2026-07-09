import React from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  UploadFile as UploadFileIcon,
  GppBad as GppBadIcon,
  CompareArrows as CompareArrowsIcon,
  FactCheck as FactCheckIcon,
  TrendingUp as TrendingUpIcon,
  Public as PublicIcon,
  History as HistoryIcon,
  BarChart as BarChartIcon,
  Link as LinkIcon,
  SupportAgent as SupportAgentIcon,
  Settings as SettingsIcon,
  AutoAwesome as SparklesIcon,
} from "@mui/icons-material";
import { useLocalization } from "./LocalizationContext";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  theme: "dark" | "light";
  currentRole: string;
  permissionsMatrix: any[];
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  theme,
  currentRole,
  permissionsMatrix,
}: SidebarProps) {
  const { t } = useLocalization();

  // Navigation menu items mapped with Material Icons
  const menuItems = [
    { id: "dashboard", label: "Dashboard", translationKey: "dashboard", icon: DashboardIcon },
    { id: "manpower", label: "Employee Directory", translationKey: "manpower", icon: PeopleIcon },
    { id: "client_timesheets", label: "Client Timesheets", translationKey: "client_timesheets", icon: AssignmentIcon },
    { id: "events", label: "Payroll Event Center", translationKey: "payroll_events", icon: AssignmentIcon },
    { id: "upload", label: "Smart Excel Upload", translationKey: "smart_upload", icon: UploadFileIcon },
    { id: "validation", label: "Validation Center", translationKey: "validation", icon: GppBadIcon },
    { id: "reconciliation", label: "Reconciliation Center", translationKey: "reconciliation", icon: CompareArrowsIcon },
    { id: "approval", label: "Approval Center", translationKey: "approval_center", icon: FactCheckIcon },
    { id: "readiness", label: "Payroll Readiness", translationKey: "payroll_readiness", icon: TrendingUpIcon },
    { id: "rules", label: "Country Rule Engine", translationKey: "rule_engine", icon: PublicIcon },
    { id: "compliance", label: "Compliance & Audit", translationKey: "compliance_audit", icon: HistoryIcon },
    { id: "reports", label: "Reports", translationKey: "reports", icon: BarChartIcon },
    //{ id: "integration", label: "Integration Hub", translationKey: "integration_hub", icon: LinkIcon },
    { id: "copilot", label: "Nexus Assistant", translationKey: "nexus_assistant", icon: SupportAgentIcon },
    { id: "preferences", label: "User Preferences", translationKey: "user_preferences", icon: SettingsIcon },
    { id: "admin", label: "Administration", translationKey: "admin_console", icon: SettingsIcon },
  ];

  // Resolve active role's customized permissions
  const rolePermissionsObj = permissionsMatrix?.find((r) => r.role === currentRole);
  const perms = rolePermissionsObj ? rolePermissionsObj.permissions : null;

  const filteredMenuItems = menuItems.filter((item) => {
    // Super Admin role overrides all permission checkpoints
    if (currentRole === "Super Admin") return true;
    if (!perms) return true; // Loading fallback safety

    switch (item.id) {
      case "dashboard":
      case "manpower":
      case "copilot":
      case "client_timesheets":
        return true; // Basic utility views accessible by all registered workforce
      case "upload":
      case "events":
      case "integration":
        return !!perms["Payroll Upload"];
      case "validation":
        return !!perms["Validation"];
      case "reconciliation":
      case "approval":
      case "readiness":
        return !!perms["Approvals"];
      case "rules":
        return !!perms["Country Rules"];
      case "compliance":
        return !!perms["Audit"];
      case "reports":
        return !!perms["Reports"];
      case "admin":
        return !!perms["Administration"];
      default:
        return true;
    }
  });

  // Enterprise Sidebar styling specifications
  const sidebarBg = "#0A0F1D"; // Extremely attractive deep sapphire black
  const textColor = "#CBD5E1"; // Slate 300 for premium readability
  const hoverBg = "rgba(255, 255, 255, 0.08)";
  const selectedBg = "#2563EB"; // Royal blue
  const iconColor = "#FFFFFF";

  return (
    <Box
      sx={{
        width: collapsed ? 64 : 250,
        height: "100%",
        backgroundColor: sidebarBg,
        color: textColor,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        overflowX: "hidden",
        borderRight: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "4px 0 10px rgba(0, 0, 0, 0.15)",
        zIndex: 100,
      }}
      id="nexus_sidebar"
    >
      {/* Brand Header */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          minHeight: 64,
        }}
      >
        {!collapsed ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "6px",
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                color: "#FFFFFF",
                fontSize: "1.1rem",
                boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.3)",
              }}
            >
              N
            </Box>
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 800,
                  color: "#FFFFFF",
                  letterSpacing: "0.5px",
                  lineHeight: 1.1,
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                NEXUS
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontSize: "9px",
                  color: "rgba(255, 255, 255, 0.6)",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  fontWeight: 600,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  mt: 0.2,
                }}
              >
                <SparklesIcon sx={{ fontSize: 9, color: "#FFD700" }} /> PAYROLL
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "6px",
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              color: "#FFFFFF",
              fontSize: "1rem",
              boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.3)",
            }}
          >
            N
          </Box>
        )}

        {!collapsed && (
          <IconButton
            size="small"
            onClick={() => setCollapsed(true)}
            sx={{
              color: "rgba(255, 255, 255, 0.6)",
              "&:hover": { color: "#FFFFFF", backgroundColor: "rgba(255, 255, 255, 0.08)" },
            }}
            id="toggle_sidebar_btn"
          >
            <ChevronLeftIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </Box>

      {/* Collapse button when sidebar is collapsed */}
      {collapsed && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 1.5 }}>
          <IconButton
            size="small"
            onClick={() => setCollapsed(false)}
            sx={{
              color: "rgba(255, 255, 255, 0.6)",
              "&:hover": { color: "#FFFFFF", backgroundColor: "rgba(255, 255, 255, 0.08)" },
            }}
            id="toggle_sidebar_btn"
          >
            <ChevronRightIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      )}

      {/* Menu Navigation */}
      <List sx={{ flex: 1, py: 1, px: 1, overflowY: "auto", overflowX: "hidden" }}>
        {filteredMenuItems.map((item) => {
          const ItemIcon = item.icon;
          const isActive = activeTab === item.id;

          const buttonContent = (
            <ListItemButton
              onClick={() => setActiveTab(item.id)}
              id={`nav_btn_${item.id}`}
              sx={{
                minHeight: 44,
                borderRadius: "8px",
                mb: 0.5,
                px: collapsed ? 1.5 : 2,
                justifyContent: collapsed ? "center" : "initial",
                backgroundColor: isActive ? selectedBg : "transparent",
                color: textColor,
                "&:hover": {
                  backgroundColor: isActive ? selectedBg : hoverBg,
                  color: "#FFFFFF",
                },
                transition: "all 0.15s ease",
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: collapsed ? 0 : 2,
                  justifyContent: "center",
                  color: iconColor,
                  opacity: isActive ? 1 : 0.8,
                }}
              >
                <ItemIcon sx={{ fontSize: 18 }} />
              </ListItemIcon>
              {!collapsed && (
                <ListItemText>
                  <Typography
                    sx={{
                      fontSize: "12.5px",
                      fontWeight: isActive ? 700 : 500,
                      letterSpacing: "0.2px",
                      fontFamily: "'Outfit', sans-serif",
                      color: "inherit"
                    }}
                  >
                    {t(item.translationKey || item.id)}
                  </Typography>
                </ListItemText>
              )}
            </ListItemButton>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.id} title={t(item.translationKey || item.id)} placement="right" arrow>
                <ListItem disablePadding sx={{ display: "block" }}>
                  {buttonContent}
                </ListItem>
              </Tooltip>
            );
          }

          return (
            <ListItem key={item.id} disablePadding sx={{ display: "block" }}>
              {buttonContent}
            </ListItem>
          );
        })}
      </List>

      {/* Footer Branding */}
      <Box
        sx={{
          p: collapsed ? 1.5 : 2.5,
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          textAlign: "center",
          backgroundColor: "rgba(0, 0, 0, 0.15)",
        }}
      >
        {!collapsed ? (
          <Box>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 800,
                fontSize: "10px",
                letterSpacing: "1.2px",
                color: "rgba(255, 255, 255, 0.8)",
                fontFamily: "'Roboto', sans-serif",
              }}
            >
              NEXUS ENTERPRISE
            </Typography>
            <Typography
              variant="caption"
              sx={{ fontSize: "8.5px", color: "rgba(255, 255, 255, 0.4)", mt: 0.5, display: "block" }}
            >
              v3.0 Production
            </Typography>
          </Box>
        ) : (
          <Typography
            variant="body2"
            sx={{ fontWeight: 800, fontSize: "9px", color: "rgba(255, 255, 255, 0.6)" }}
          >
            NEXUS
          </Typography>
        )}
      </Box>
    </Box>
  );
}
