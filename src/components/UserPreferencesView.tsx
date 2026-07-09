import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  Select,
  MenuItem,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Paper,
  RadioGroup,
  Radio,
  Tooltip,
  IconButton
} from "@mui/material";
import {
  Language as LanguageIcon,
  Palette as PaletteIcon,
  FormatSize as FontSizeIcon,
  DensityMedium as DensityIcon,
  DashboardCustomize as DashboardIcon,
  NotificationsActive as NotificationsIcon,
  Public as CountryIcon,
  Restore as RestoreIcon,
  Save as SaveIcon,
  ArrowUpward as UpIcon,
  ArrowDownward as DownIcon,
  Visibility as VisibleIcon,
  VisibilityOff as HiddenIcon
} from "@mui/icons-material";
import { useLocalization, defaultPreferences } from "./LocalizationContext";
import { languageMeta } from "../lib/translations";

export default function UserPreferencesView() {
  const {
    preferences,
    updatePreference,
    resetPreferences,
    t,
    formatDate,
    formatCurrency
  } = useLocalization();

  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSystem, setNotifSystem] = useState(true);
  const [notifHighSeverity, setNotifHighSeverity] = useState(false);
  const [defaultLanding, setDefaultLanding] = useState("dashboard");

  const availableLanguages = Object.keys(languageMeta);

  const themeOptions = [
    { value: "light", label: "Light Theme" },
    { value: "dark", label: "Dark Theme" },
    { value: "system", label: "System (Auto)" }
  ];

  const fontSizeOptions = [
    { value: "small", label: t("small") },
    { value: "normal", label: t("normal") },
    { value: "large", label: t("large") },
    { value: "extra_large", label: t("extra_large") }
  ];

  const densityOptions = [
    { value: "compact", label: t("compact") },
    { value: "comfortable", label: t("comfortable") }
  ];

  const dateFormatOptions = [
    { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
    { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
    { value: "MM/DD/YYYY", label: "MM/DD/YYYY" }
  ];

  const timeFormatOptions = [
    { value: "12h", label: "12-Hour (AM/PM)" },
    { value: "24h", label: "24-Hour (Military)" }
  ];

  const numberFormatOptions = [
    { value: "US", label: "US (12,500.00)" },
    { value: "EU", label: "Germany (12.500,00)" },
    { value: "IN", label: "India (12,50,000.00)" },
    { value: "JP", label: "Japan (1,250,000)" }
  ];

  const currencyOptions = [
    { value: "USD", label: "USD ($)" },
    { value: "EUR", label: "EUR (€)" },
    { value: "SGD", label: "SGD (S$)" },
    { value: "JPY", label: "JPY (¥)" },
    { value: "INR", label: "INR (₹)" }
  ];

  // Widget ordering and toggles helper
  const widgets = [
    { id: "metrics", label: "KPI Performance Metrics" },
    { id: "readiness", label: "Global Readiness Progress" },
    { id: "validation", label: "AI Real-time Validation Errors" },
    { id: "approvals", label: "Pending Workflow Approvals" },
    { id: "distribution", label: "Country Cost Allocation Charts" }
  ];

  const handleMoveWidget = (index: number, direction: "up" | "down") => {
    const order = [...(preferences.widgetOrder || defaultPreferences.widgetOrder)];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= order.length) return;

    // Swap elements
    const temp = order[index];
    order[index] = order[targetIndex];
    order[targetIndex] = temp;
    updatePreference("widgetOrder", order);
  };

  const handleToggleWidget = (widgetId: string) => {
    const hidden = [...(preferences.hiddenWidgets || [])];
    let updated: string[];
    if (hidden.includes(widgetId)) {
      updated = hidden.filter((id) => id !== widgetId);
    } else {
      updated = [...hidden, widgetId];
    }
    updatePreference("hiddenWidgets", updated);
  };

  return (
    <Box sx={{ p: 3 }} id="user_preferences_page">
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          {t("user_preferences")}
        </Typography>
        <Button
          variant="outlined"
          color="warning"
          startIcon={<RestoreIcon />}
          onClick={resetPreferences}
          id="btn_reset_all_preferences"
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          {t("reset_to_default")}
        </Button>
      </Box>

      {/* Tailwind Responsive Grid layout instead of MUI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Localization & Region Panel */}
        <div>
          <Card id="preferences_card_localization" sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <LanguageIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {t("language")} &amp; Locale Formats
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-1 sm:col-span-2">
                  <FormControl fullWidth size="small">
                    <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 700, color: "text.secondary" }}>
                      Select Language
                    </Typography>
                    <Select
                      value={preferences.language}
                      onChange={(e) => updatePreference("language", e.target.value)}
                      id="select_preference_language"
                    >
                      {availableLanguages.map((lang) => (
                        <MenuItem key={lang} value={lang}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <span>{languageMeta[lang]?.flag}</span>
                            <span>{languageMeta[lang]?.label}</span>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>

                <div>
                  <FormControl fullWidth size="small">
                    <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 700, color: "text.secondary" }}>
                      {t("date_format")}
                    </Typography>
                    <Select
                      value={preferences.dateFormat}
                      onChange={(e) => updatePreference("dateFormat", e.target.value as any)}
                      id="select_preference_date_format"
                    >
                      {dateFormatOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>

                <div>
                  <FormControl fullWidth size="small">
                    <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 700, color: "text.secondary" }}>
                      {t("time_format")}
                    </Typography>
                    <Select
                      value={preferences.timeFormat}
                      onChange={(e) => updatePreference("timeFormat", e.target.value as any)}
                      id="select_preference_time_format"
                    >
                      {timeFormatOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>

                <div>
                  <FormControl fullWidth size="small">
                    <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 700, color: "text.secondary" }}>
                      {t("number_format")}
                    </Typography>
                    <Select
                      value={preferences.numberFormat}
                      onChange={(e) => updatePreference("numberFormat", e.target.value as any)}
                      id="select_preference_number_format"
                    >
                      {numberFormatOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>

                <div>
                  <FormControl fullWidth size="small">
                    <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 700, color: "text.secondary" }}>
                      {t("default_currency")}
                    </Typography>
                    <Select
                      value={preferences.defaultCurrency}
                      onChange={(e) => updatePreference("defaultCurrency", e.target.value)}
                      id="select_preference_default_currency"
                    >
                      {currencyOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
              </div>

              {/* Live localization previews */}
              <Paper sx={{ p: 2, mt: 3, bgcolor: "action.hover", borderRadius: "6px" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: "11px" }}>
                  Live Format Previews (Based on Preferences)
                </Typography>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <Typography sx={{ fontSize: "11px", color: "text.secondary" }}>Formatted Date:</Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: "12.5px" }}>{formatDate(new Date())}</Typography>
                  </div>
                  <div>
                    <Typography sx={{ fontSize: "11px", color: "text.secondary" }}>Formatted Salary (12,500):</Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: "12.5px" }}>{formatCurrency(12500)}</Typography>
                  </div>
                </div>
              </Paper>
            </CardContent>
          </Card>
        </div>

        {/* Look & Feel panel (Accessibility & Themes) */}
        <div>
          <Card id="preferences_card_appearance" sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <PaletteIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {t("theme")} &amp; Accessibility (WCAG)
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <div className="space-y-4">
                <div>
                  <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 700, color: "text.secondary", display: "block" }}>
                    Theme Setting
                  </Typography>
                  <RadioGroup
                    row
                    value={preferences.theme}
                    onChange={(e) => updatePreference("theme", e.target.value as any)}
                  >
                    {themeOptions.map((opt) => (
                      <FormControlLabel
                        key={opt.value}
                        value={opt.value}
                        control={<Radio size="small" />}
                        label={opt.label}
                        sx={{ "& .MuiFormControlLabel-label": { fontSize: "12.5px" } }}
                        id={`radio_theme_${opt.value}`}
                      />
                    ))}
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FormControl fullWidth size="small">
                      <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 700, color: "text.secondary" }}>
                        Adjustable {t("font_size")}
                      </Typography>
                      <Select
                        value={preferences.fontSize}
                        onChange={(e) => updatePreference("fontSize", e.target.value as any)}
                        id="select_preference_font_size"
                      >
                        {fontSizeOptions.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </div>

                  <div>
                    <FormControl fullWidth size="small">
                      <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 700, color: "text.secondary" }}>
                        Display {t("density")}
                      </Typography>
                      <Select
                        value={preferences.density}
                        onChange={(e) => updatePreference("density", e.target.value as any)}
                        id="select_preference_density"
                      >
                        {densityOptions.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </div>
                </div>

                <div>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "block", mb: 0.5 }}>
                    First Day of the Week
                  </Typography>
                  <RadioGroup
                    row
                    value={preferences.firstDayOfWeek}
                    onChange={(e) => updatePreference("firstDayOfWeek", e.target.value as any)}
                  >
                    <FormControlLabel control={<Radio size="small" />} value="Monday" label="Monday" sx={{ "& .MuiFormControlLabel-label": { fontSize: "12px" } }} />
                    <FormControlLabel control={<Radio size="small" />} value="Sunday" label="Sunday" sx={{ "& .MuiFormControlLabel-label": { fontSize: "12px" } }} />
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Personalization Grid Manager */}
        <div>
          <Card id="preferences_card_dashboard" sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <DashboardIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Dashboard Layout &amp; Widgets
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, fontSize: "12px" }}>
                Reorder the widget execution flow or toggle visibility to optimize your executive workspace context.
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                {(preferences.widgetOrder || defaultPreferences.widgetOrder).map((widgetId, index) => {
                  const info = widgets.find((w) => w.id === widgetId);
                  if (!info) return null;
                  const isHidden = (preferences.hiddenWidgets || []).includes(widgetId);

                  return (
                    <Paper
                      key={widgetId}
                      sx={{
                        p: 1.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        border: "1px solid",
                        borderColor: isHidden ? "action.disabledBackground" : "divider",
                        opacity: isHidden ? 0.6 : 1,
                        borderRadius: "6px"
                      }}
                      id={`widget_prefer_${widgetId}`}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleWidget(widgetId)}
                          id={`btn_toggle_widget_${widgetId}`}
                          sx={{ color: isHidden ? "text.secondary" : "primary.main" }}
                        >
                          {isHidden ? <HiddenIcon sx={{ fontSize: 18 }} /> : <VisibleIcon sx={{ fontSize: 18 }} />}
                        </IconButton>
                        <Typography sx={{ fontSize: "12.5px", fontWeight: 600 }}>
                          {info.label}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <IconButton
                          size="small"
                          disabled={index === 0}
                          onClick={() => handleMoveWidget(index, "up")}
                          id={`btn_move_widget_up_${widgetId}`}
                        >
                          <UpIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          disabled={index === (preferences.widgetOrder?.length || 5) - 1}
                          onClick={() => handleMoveWidget(index, "down")}
                          id={`btn_move_widget_down_${widgetId}`}
                        >
                          <DownIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </div>

        {/* Enterprise Notifications & Defaults Sync */}
        <div>
          <Card id="preferences_card_notifications" sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <NotificationsIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Landing View &amp; Notifications Hub
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <FormControl fullWidth size="small">
                  <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 700, color: "text.secondary" }}>
                    Default Landing Tab
                  </Typography>
                  <Select
                    value={defaultLanding}
                    onChange={(e) => setDefaultLanding(e.target.value)}
                    id="select_preference_landing_page"
                  >
                    <MenuItem value="dashboard">Dashboard Overview</MenuItem>
                    <MenuItem value="manpower">Manpower Directory</MenuItem>
                    <MenuItem value="events">Payroll Event Center</MenuItem>
                    <MenuItem value="validation">AI Validation Center</MenuItem>
                  </Select>
                </FormControl>

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "12px", mb: 1 }}>
                    Communication Channels &amp; Alerts
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <FormControlLabel
                      control={<Switch size="small" checked={notifEmail} onChange={(e) => setNotifEmail(e.target.checked)} />}
                      label="Sync email reports on successful runs"
                      sx={{ "& .MuiFormControlLabel-label": { fontSize: "12px" } }}
                    />
                    <FormControlLabel
                      control={<Switch size="small" checked={notifSystem} onChange={(e) => setNotifSystem(e.target.checked)} />}
                      label="Instant desktop in-app compliance alerts"
                      sx={{ "& .MuiFormControlLabel-label": { fontSize: "12px" } }}
                    />
                    <FormControlLabel
                      control={<Switch size="small" checked={notifHighSeverity} onChange={(e) => setNotifHighSeverity(e.target.checked)} />}
                      label="Block warnings - only high severity breaches"
                      sx={{ "& .MuiFormControlLabel-label": { fontSize: "12px" } }}
                    />
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </div>

      </div>
    </Box>
  );
}
