import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, languageMeta, holidayCalendars } from "../lib/translations";

export interface UserPreferences {
  language: string;
  theme: "light" | "dark" | "system";
  timezone: string;
  dateFormat: "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY";
  timeFormat: "12h" | "24h";
  numberFormat: "US" | "EU" | "IN" | "JP";
  defaultCurrency: string;
  firstDayOfWeek: "Sunday" | "Monday";
  fontSize: "small" | "normal" | "large" | "extra_large";
  density: "compact" | "comfortable";
  hiddenWidgets: string[];
  widgetOrder: string[];
}

export interface DraftData {
  formId: string;
  data: any;
  timestamp: number;
}

interface LocalizationContextType {
  language: string;
  setLanguage: (lang: string) => void;
  isRtl: boolean;
  t: (key: string) => string;
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  resetPreferences: () => void;
  
  // Formatters
  formatDate: (date: Date | string) => string;
  formatTime: (date: Date | string) => string;
  formatCurrency: (amount: number, currencyCode?: string) => string;
  formatNumber: (num: number) => string;
  
  // Offline State
  isOnline: boolean;
  
  // Holiday Queries
  getCountryHolidays: (country: string) => { date: string; name: string }[];
  isHoliday: (country: string, date: string | Date) => boolean;
  
  // Draft / Autosave System
  drafts: Record<string, DraftData>;
  saveFormDraft: (formId: string, data: any) => void;
  discardFormDraft: (formId: string) => void;
  getFormDraft: (formId: string) => DraftData | null;
  
  // Layout customization triggers
  reorderWidgets: (widgetOrder: string[]) => void;
  toggleWidgetVisibility: (widgetId: string) => void;
  
  // Keyboard Shortcut hooks
  registerShortcutCallback: (shortcut: string, callback: () => void) => () => void;
}

export const defaultPreferences: UserPreferences = {
  language: "en",
  theme: "system",
  timezone: "Asia/Kolkata",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24h",
  numberFormat: "IN",
  defaultCurrency: "INR",
  firstDayOfWeek: "Monday",
  fontSize: "normal",
  density: "comfortable",
  hiddenWidgets: [],
  widgetOrder: ["metrics", "readiness", "validation", "approvals", "distribution"]
};

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error("useLocalization must be used within a LocalizationProvider");
  }
  return context;
}

interface LocalizationProviderProps {
  children: ReactNode;
  themeState: "dark" | "light";
  setThemeState: (theme: "dark" | "light") => void;
  onNavigateToTab?: (tab: string) => void;
  onOpenNewEventModal?: () => void;
  onTriggerUploadClick?: () => void;
}

export function LocalizationProvider({
  children,
  themeState,
  setThemeState,
  onNavigateToTab,
  onOpenNewEventModal,
  onTriggerUploadClick
}: LocalizationProviderProps) {
  // Load initial preferences
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem("nexus_user_preferences");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultPreferences, ...parsed };
      } catch (e) {
        return defaultPreferences;
      }
    }
    return defaultPreferences;
  });

  const [language, setLanguageState] = useState<string>(preferences.language);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [drafts, setDrafts] = useState<Record<string, DraftData>>(() => {
    const saved = localStorage.getItem("nexus_form_drafts");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  // Watch for system theme changes if set to "system"
  useEffect(() => {
    if (preferences.theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleThemeChange = (e: MediaQueryListEvent) => {
        setThemeState(e.matches ? "dark" : "light");
      };
      setThemeState(mediaQuery.matches ? "dark" : "light");
      mediaQuery.addEventListener("change", handleThemeChange);
      return () => mediaQuery.removeEventListener("change", handleThemeChange);
    } else {
      setThemeState(preferences.theme as "dark" | "light");
    }
  }, [preferences.theme, setThemeState]);

  // Handle Online / Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sync draft local storage
  useEffect(() => {
    localStorage.setItem("nexus_form_drafts", JSON.stringify(drafts));
  }, [drafts]);

  // Custom function to update single user preference
  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences((prev) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem("nexus_user_preferences", JSON.stringify(updated));
      if (key === "language") {
        setLanguageState(value as string);
      }
      return updated;
    });
  };

  const setLanguage = (lang: string) => {
    updatePreference("language", lang);
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
    setLanguageState("en");
    localStorage.setItem("nexus_user_preferences", JSON.stringify(defaultPreferences));
  };

  const isRtl = languageMeta[language]?.rtl || false;

  // Translation function t(key)
  const t = (key: string): string => {
    const langDictionary = translations[language] || translations["en"];
    const text = langDictionary[key];
    if (text !== undefined) return text;
    // Fallback to English
    const fallbackText = translations["en"][key];
    if (fallbackText !== undefined) return fallbackText;
    // If no translation found, format key elegantly
    return key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  // 1. Regional Formatting: Dates
  const formatDate = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return String(date);
    const locale = languageMeta[language]?.locale || "en-US";
    
    // Choose format style based on preference
    let formatOptions: Intl.DateTimeFormatOptions = { dateStyle: "medium" };
    if (preferences.dateFormat === "DD/MM/YYYY") {
      formatOptions = { day: "2-digit", month: "2-digit", year: "numeric" };
    } else if (preferences.dateFormat === "MM/DD/YYYY") {
      formatOptions = { month: "2-digit", day: "2-digit", year: "numeric" };
    } else if (preferences.dateFormat === "YYYY-MM-DD") {
      formatOptions = { year: "numeric", month: "2-digit", day: "2-digit" };
    }
    
    return new Intl.DateTimeFormat(locale, formatOptions).format(d);
  };

  // 2. Regional Formatting: Time
  const formatTime = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return String(date);
    const locale = languageMeta[language]?.locale || "en-US";
    return new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: preferences.timeFormat === "12h"
    }).format(d);
  };

  // 3. Regional Formatting: Currency (Intl formatted based on locale & preferred currency)
  const formatCurrency = (amount: number, currencyCode?: string): string => {
    const curr = currencyCode || preferences.defaultCurrency || "USD";
    const locale = languageMeta[language]?.locale || "en-US";
    
    // Customize locale style depending on numberFormat selection
    let formatLocale = locale;
    if (preferences.numberFormat === "EU") {
      formatLocale = "de-DE";
    } else if (preferences.numberFormat === "US") {
      formatLocale = "en-US";
    } else if (preferences.numberFormat === "IN") {
      formatLocale = "en-IN";
    } else if (preferences.numberFormat === "JP") {
      formatLocale = "ja-JP";
    }

    try {
      return new Intl.NumberFormat(formatLocale, {
        style: "currency",
        currency: curr,
        minimumFractionDigits: curr === "JPY" ? 0 : 2,
        maximumFractionDigits: curr === "JPY" ? 0 : 2,
      }).format(amount);
    } catch (e) {
      return `${curr} ${amount.toFixed(2)}`;
    }
  };

  // 4. Regional Formatting: Numbers
  const formatNumber = (num: number): string => {
    const locale = languageMeta[language]?.locale || "en-US";
    let formatLocale = locale;
    if (preferences.numberFormat === "EU") {
      formatLocale = "de-DE";
    } else if (preferences.numberFormat === "US") {
      formatLocale = "en-US";
    } else if (preferences.numberFormat === "IN") {
      formatLocale = "en-IN";
    } else if (preferences.numberFormat === "JP") {
      formatLocale = "ja-JP";
    }
    return new Intl.NumberFormat(formatLocale).format(num);
  };

  // 5. Holiday calendars helper
  const getCountryHolidays = (country: string) => {
    return holidayCalendars[country] || holidayCalendars["Singapore"] || [];
  };

  const isHoliday = (country: string, date: string | Date): boolean => {
    const dStr = typeof date === "string" ? date.split("T")[0] : date.toISOString().split("T")[0];
    const countryHolidays = getCountryHolidays(country);
    return countryHolidays.some((h) => h.date === dStr);
  };

  // 6. Form Draft Management (Autosave every 30s)
  const saveFormDraft = (formId: string, data: any) => {
    setDrafts((prev) => ({
      ...prev,
      [formId]: {
        formId,
        data,
        timestamp: Date.now()
      }
    }));
  };

  const discardFormDraft = (formId: string) => {
    setDrafts((prev) => {
      const copy = { ...prev };
      delete copy[formId];
      return copy;
    });
  };

  const getFormDraft = (formId: string): DraftData | null => {
    return drafts[formId] || null;
  };

  // 7. Dashboard Layout Reordering
  const reorderWidgets = (widgetOrder: string[]) => {
    updatePreference("widgetOrder", widgetOrder);
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    const currentlyHidden = preferences.hiddenWidgets || [];
    let updatedHidden: string[];
    if (currentlyHidden.includes(widgetId)) {
      updatedHidden = currentlyHidden.filter((id) => id !== widgetId);
    } else {
      updatedHidden = [...currentlyHidden, widgetId];
    }
    updatePreference("hiddenWidgets", updatedHidden);
  };

  // 8. Custom shortcuts registration
  const [shortcutCallbacks, setShortcutCallbacks] = useState<Record<string, () => void>>({});

  const registerShortcutCallback = (shortcut: string, callback: () => void) => {
    setShortcutCallbacks((prev) => ({ ...prev, [shortcut]: callback }));
    return () => {
      setShortcutCallbacks((prev) => {
        const copy = { ...prev };
        delete copy[shortcut];
        return copy;
      });
    };
  };

  // Listen to Global Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcut keydowns if typing inside interactive input elements
      const target = e.target as HTMLElement;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) {
        if (e.key === "Escape") {
          // ESC is allowed to trigger close even from input fields
          const escCb = shortcutCallbacks["Esc"] || shortcutCallbacks["Escape"];
          if (escCb) {
            e.preventDefault();
            escCb();
          }
        }
        return;
      }

      // Check key configurations (Case-insensitive matching)
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === "k") {
          e.preventDefault();
          if (shortcutCallbacks["Ctrl+K"]) shortcutCallbacks["Ctrl+K"]();
        } else if (key === "u") {
          e.preventDefault();
          if (shortcutCallbacks["Ctrl+U"]) shortcutCallbacks["Ctrl+U"]();
          if (onTriggerUploadClick) onTriggerUploadClick();
        } else if (key === "r") {
          e.preventDefault();
          if (shortcutCallbacks["Ctrl+R"]) shortcutCallbacks["Ctrl+R"]();
          if (onNavigateToTab) onNavigateToTab("reports");
        } else if (key === "d") {
          e.preventDefault();
          if (shortcutCallbacks["Ctrl+D"]) shortcutCallbacks["Ctrl+D"]();
          if (onNavigateToTab) onNavigateToTab("dashboard");
        } else if (key === "n") {
          e.preventDefault();
          if (shortcutCallbacks["Ctrl+N"]) shortcutCallbacks["Ctrl+N"]();
          if (onOpenNewEventModal) onOpenNewEventModal();
        }
      } else if (e.key === "Escape") {
        if (shortcutCallbacks["Esc"] || shortcutCallbacks["Escape"]) {
          e.preventDefault();
          const escCb = shortcutCallbacks["Esc"] || shortcutCallbacks["Escape"];
          if (escCb) escCb();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcutCallbacks, onNavigateToTab, onOpenNewEventModal, onTriggerUploadClick]);

  // Set RTL Class on document body
  useEffect(() => {
    const rtl = isRtl;
    document.documentElement.dir = rtl ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [isRtl, language]);

  // Set up DOM dynamic translation observer (for fully dynamic i18n support without changing code)
  useEffect(() => {
    if (language === "en") return;

    // Create the translation map
    const map = new Map<string, string>();
    const enDict = translations["en"] || {};
    const targetDict = translations[language] || {};

    Object.keys(enDict).forEach((key) => {
      const enText = enDict[key]?.toLowerCase().trim();
      const targetText = targetDict[key];
      if (enText && targetText) {
        map.set(enText, targetText);
      }
    });

    // Add extra custom mappings for common dashboard/sidebar/header titles/labels
    const extraMappings: Record<string, string> = {
      "dashboard overview": targetDict["dashboard"] || "",
      "manpower directory": targetDict["manpower"] || "",
      "payroll event center": targetDict["payroll_events"] || "",
      "smart excel upload": targetDict["smart_upload"] || "",
      "validation center": targetDict["validation"] || "",
      "reconciliation center": targetDict["reconciliation"] || "",
      "approval center": targetDict["approval_center"] || "",
      "payroll readiness": targetDict["payroll_readiness"] || "",
      "country rule engine": targetDict["rule_engine"] || "",
      "compliance & audit": targetDict["compliance_audit"] || "",
      "reports": targetDict["reports"] || "",
      "integration hub": targetDict["integration_hub"] || "",
      "nexus assistant": targetDict["nexus_assistant"] || "",
      "user preferences": targetDict["user_preferences"] || "",
      "admin console": targetDict["admin_console"] || "",
      "administration": targetDict["admin_console"] || "",
    };

    Object.entries(extraMappings).forEach(([enText, targetText]) => {
      if (targetText) {
        map.set(enText, targetText);
      }
    });

    const translateNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue?.trim() || "";
        if (!text) return;

        const lowerText = text.toLowerCase();
        
        // 1. Direct exact mapping
        if (map.has(lowerText)) {
          node.nodeValue = map.get(lowerText) || node.nodeValue;
          return;
        }

        // 2. Mapping by stripping symbols like punctuation/whitespace
        const cleanLower = lowerText.replace(/[:.!?•✓❌+]/g, "").trim();
        if (map.has(cleanLower)) {
          const originalWithSymbols = node.nodeValue || "";
          const prefixMatch = originalWithSymbols.match(/^[:.!?•✓❌+\s]+/);
          const suffixMatch = originalWithSymbols.match(/[:.!?•✓❌+\s]+$/);
          
          let translated = map.get(cleanLower) || "";
          if (prefixMatch) translated = prefixMatch[0] + translated;
          if (suffixMatch) translated = translated + suffixMatch[0];
          
          node.nodeValue = translated;
          return;
        }

        // 3. Substring translation for compound buttons/titles
        for (const [enText, targetText] of map.entries()) {
          if (enText.length > 3 && lowerText.includes(enText)) {
            const regex = new RegExp(`\\b${enText}\\b`, "gi");
            if (regex.test(node.nodeValue || "")) {
              node.nodeValue = (node.nodeValue || "").replace(regex, targetText);
            }
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toUpperCase();
        if (tagName === "SCRIPT" || tagName === "STYLE" || tagName === "TEXTAREA" || tagName === "INPUT") {
          return;
        }

        if (element.hasAttribute("placeholder")) {
          const placeholder = element.getAttribute("placeholder")?.trim() || "";
          const lowerPlaceholder = placeholder.toLowerCase();
          if (map.has(lowerPlaceholder)) {
            element.setAttribute("placeholder", map.get(lowerPlaceholder)!);
          }
        }

        let child = element.firstChild;
        while (child) {
          translateNode(child);
          child = child.nextSibling;
        }
      }
    };

    // Initial translation of the whole body
    translateNode(document.body);

    // Watch for dynamic DOM changes (React updates)
    let isTranslating = false;
    const observer = new MutationObserver((mutations) => {
      if (isTranslating) return;
      isTranslating = true;
      
      observer.disconnect();

      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            translateNode(node);
          });
        } else if (mutation.type === "characterData") {
          translateNode(mutation.target);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      isTranslating = false;
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [language]);

  return (
    <LocalizationContext.Provider
      value={{
        language,
        setLanguage,
        isRtl,
        t,
        preferences,
        updatePreference,
        resetPreferences,
        formatDate,
        formatTime,
        formatCurrency,
        formatNumber,
        isOnline,
        getCountryHolidays,
        isHoliday,
        drafts,
        saveFormDraft,
        discardFormDraft,
        getFormDraft,
        reorderWidgets,
        toggleWidgetVisibility,
        registerShortcutCallback
      }}
    >
      {/* Global Accessible CSS injection based on preferences (Density, Font Size) */}
      <style>{`
        html {
          font-size: ${
            preferences.fontSize === "small"
              ? "13px"
              : preferences.fontSize === "large"
              ? "18px"
              : preferences.fontSize === "extra_large"
              ? "21px"
              : "15px"
          };
        }
        
        /* Focus Indicators (WCAG compliance) */
        button:focus-visible,
        input:focus-visible,
        select:focus-visible,
        textarea:focus-visible,
        [tabindex]:focus-visible {
          outline: 3px solid #2563EB !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.4) !important;
        }

        /* Density adjustments */
        .density-compact td,
        .density-compact th {
          padding-top: 4px !important;
          padding-bottom: 4px !important;
          height: auto !important;
        }
        .density-compact .MuiCardContent-root,
        .density-compact .p-4,
        .density-compact .p-6 {
          padding: 8px !important;
        }
        .density-comfortable td,
        .density-comfortable th {
          padding-top: 12px !important;
          padding-bottom: 12px !important;
        }
      `}</style>
      
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div
          id="global_offline_banner"
          aria-live="assertive"
          className="fixed top-0 inset-x-0 bg-red-600 text-white font-bold text-center py-2 z-[9999] shadow-md flex items-center justify-center gap-2 text-xs transition-transform duration-300 transform translate-y-0"
        >
          <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
          <span>{t("offline_banner")}</span>
        </div>
      )}
      
      <div className={preferences.density === "compact" ? "density-compact" : "density-comfortable"}>
        {children}
      </div>
    </LocalizationContext.Provider>
  );
}
