import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  Snackbar,
  Paper
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  ArrowBack,
  Shield,
  VpnKey,
  Devices,
  Key,
  CheckCircle,
  Help,
  LightMode,
  DarkMode
} from "@mui/icons-material";
import { motion, AnimatePresence } from "motion/react";

interface LoginViewProps {
  theme: "dark" | "light";
  onLoginSuccess: (user: any) => void;
  setTheme?: (theme: "dark" | "light") => void;
}

export default function LoginView({ theme, onLoginSuccess, setTheme }: LoginViewProps) {
  // Authentication states
  const [step, setStep] = useState<"email" | "password" | "sso_loading" | "mfa" | "forgot" | "reset" | "register">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Registration states
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  
  // Simulated OTP & Forgot password states
  const [otp, setOtp] = useState("");
  const [simulatedOtpCode, setSimulatedOtpCode] = useState("");
  const [mfaMethod, setMfaMethod] = useState<"email" | "authenticator">("email");
  const [otpTimer, setOtpTimer] = useState(300); // 5 minutes (300 seconds)
  const [otpErrorCount, setOtpErrorCount] = useState(0);
  const [forgotPasswordLink, setForgotPasswordLink] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Loading & notification states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Theme support
  const isDark = theme === "dark";

  // Countdown timer for MFA OTP
  useEffect(() => {
    let interval: any;
    if (step === "mfa" && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (step === "mfa" && otpTimer === 0) {
      setErrorMessage("The verification code has expired. Please request a new OTP code.");
    }
    return () => clearInterval(interval);
  }, [step, otpTimer]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const triggerSnackbar = (msg: string) => {
    setSnackbarMessage(msg);
    setSnackbarOpen(true);
  };

  // 1. Step Email Validation / Move to Password or SSO
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid business email address.");
      return;
    }

    setErrorMessage("");
    setIsLoading(true);

    // Simulate directory lookup
    setTimeout(() => {
      setIsLoading(false);
      const isNexusEmail = email.toLowerCase().endsWith("@nexus-corp.com") || email.toLowerCase().endsWith("@nexus.com");
      
      if (isNexusEmail) {
        // Automatically switch to Entra ID SSO loading flow
        setStep("sso_loading");
        handleSsoFlow();
      } else {
        // Fallback to username/password
        setStep("password");
        triggerSnackbar("SSO unavailable for this domain. Switched to corporate password portal.");
      }
    }, 900);
  };

  // 2. SSO Automatic Redirection Simulation
  const handleSsoFlow = () => {
    setIsLoading(true);
    setErrorMessage("");

    setTimeout(async () => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            isSso: true,
            browser: navigator.userAgent.includes("Chrome") ? "Chrome" : "Edge",
            device: "Windows Desktop",
            ip: "192.168.1." + Math.floor(Math.random() * 254)
          })
        });
        const data = await res.json();
        setIsLoading(false);

        if (res.ok) {
          if (data.mfaRequired) {
            setSimulatedOtpCode(data.simulatedOtp || "");
            setStep("mfa");
            setOtpTimer(300); // reset 5 minutes
            triggerSnackbar("✓ Microsoft Entra SSO Authorized! Verification code issued.");
          } else {
            // Logged in directly
            onLoginSuccess(data.user);
          }
        } else {
          setStep("email");
          setErrorMessage(data.error || "Microsoft SSO authentication failed.");
        }
      } catch (err) {
        setIsLoading(false);
        setStep("email");
        setErrorMessage("Network error during Microsoft Entra handshake.");
      }
    }, 1800);
  };

  // 3. Password Auth Submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMessage("Please enter your corporate password.");
      return;
    }

    setErrorMessage("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          isSso: false,
          browser: "Chrome",
          device: "Windows Desktop",
          ip: "192.168.1.111"
        })
      });
      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        if (data.mfaRequired) {
          setSimulatedOtpCode(data.simulatedOtp || "");
          setStep("mfa");
          setOtpTimer(300);
        } else {
          onLoginSuccess(data.user);
        }
      } else {
        setErrorMessage(data.error || "Invalid password or account locked.");
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage("Failed to establish corporate server link.");
    }
  };

  // 4. Verification Code MFA Submission
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setErrorMessage("Please enter a complete 6-digit verification code.");
      return;
    }

    setErrorMessage("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          browser: "Chrome",
          device: "Windows Desktop",
          ip: "192.168.1.111"
        })
      });
      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        onLoginSuccess(data.user);
      } else {
        setOtpErrorCount((prev) => prev + 1);
        setErrorMessage(data.error || "Invalid verification code.");
        if (data.error && data.error.includes("LOCKED")) {
          // Go back to email
          setTimeout(() => {
            setStep("email");
            setErrorMessage(data.error);
          }, 4000);
        }
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage("Could not verify verification code with cloud security service.");
    }
  };

  // 5. Resend OTP
  const handleResendOtp = async () => {
    setErrorMessage("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setIsLoading(false);
      if (res.ok) {
        setSimulatedOtpCode(data.simulatedOtp || "");
        setOtpTimer(300);
        triggerSnackbar("✓ A fresh 6-digit MFA OTP code has been dispatched.");
      } else {
        setErrorMessage("Failed to dispatch code.");
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage("Network error.");
    }
  };

  // 6. Forgot Password (Initiate)
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !resetEmail.includes("@")) {
      setErrorMessage("Please enter a valid registered corporate email address.");
      return;
    }

    setErrorMessage("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        setForgotPasswordLink(data.resetLink || "");
        setSuccessMessage("✓ Security validation passed. Simulated password recovery ticket dispatched successfully.");
      } else {
        setErrorMessage(data.error || "Validation failed.");
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage("Network connection error.");
    }
  };

  // 7. Reset Password (Link submission)
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMessage("The password must contain at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter both fields.");
      return;
    }

    setErrorMessage("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, password: newPassword })
      });
      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        triggerSnackbar("✓ Password reset successfully! Redirecting to sign in.");
        setTimeout(() => {
          setEmail(resetEmail);
          setResetEmail("");
          setNewPassword("");
          setConfirmPassword("");
          setForgotPasswordLink("");
          setSuccessMessage("");
          setStep("email");
        }, 3000);
      } else {
        setErrorMessage(data.error || "Failed to commit new password.");
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage("Server error during credentials commit.");
    }
  };

  // 7. Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      setErrorMessage("Please fill in all registration fields.");
      return;
    }
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          department: "Executive Office",
          country: "India",
          roles: ["Super Admin", "Executive Leadership"]
        })
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        setSuccessMessage("✓ Registration Successful! Logging you in...");
        triggerSnackbar("✓ Enterprise Account Created successfully!");
        
        // Auto sign-in the user after successful registration
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 1500);
      } else {
        setErrorMessage(data.error || "Registration failed.");
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage("Could not connect to registration service.");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: isDark
          ? "radial-gradient(circle at 10% 20%, #0d1b2a 0%, #020813 100%)"
          : "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        p: 2,
        fontFamily: "'Inter', sans-serif",
        position: "relative"
      }}
      id="enterprise_auth_container"
    >
      {setTheme && (
        <IconButton
          id="login_theme_toggle"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          sx={{
            position: "absolute",
            top: 24,
            right: 24,
            bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            color: isDark ? "#ffb900" : "#fb8c00",
            border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
            p: 1.2,
            transition: "all 0.2s",
            "&:hover": {
              bgcolor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
              transform: "scale(1.05)"
            }
          }}
          title="Toggle Dark / Light Theme"
        >
          {isDark ? <LightMode /> : <DarkMode />}
        </IconButton>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.35 }}
          style={{ width: "100%", maxWidth: 440 }}
        >
          <Card
            elevation={isDark ? 24 : 8}
            sx={{
              borderRadius: "12px",
              border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.06)",
              bgcolor: isDark ? "rgba(10, 25, 41, 0.95)" : "rgba(255, 255, 255, 0.98)",
              backdropFilter: "blur(12px)",
              overflow: "hidden"
            }}
            id="auth_card"
          >
            {/* Microsoft Portal Header Banner */}
            <Box
              sx={{
                height: "6px",
                background: "linear-gradient(90deg, #f25022 0%, #7fba00 25%, #00a4ef 50%, #ffb900 75%, #573087 100%)"
              }}
            />

            <CardContent sx={{ p: 4 }}>
              {/* Branding Header */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: "#1565C0",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "18px",
                    boxShadow: "0 2px 8px rgba(21, 101, 192, 0.4)"
                  }}
                >
                  N
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: "-0.5px", color: isDark ? "white" : "#0d1b2a", lineHeight: 1 }}>
                    NEXUS
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#00ACC1", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", fontSize: "9px" }}>
                    Global Payroll Governance
                  </Typography>
                </Box>
              </Box>

              {errorMessage && (
                <Alert severity="error" sx={{ mb: 2.5, borderRadius: "8px", fontSize: "11.5px" }}>
                  {errorMessage}
                </Alert>
              )}

              {successMessage && (
                <Alert severity="success" sx={{ mb: 2.5, borderRadius: "8px", fontSize: "11.5px" }}>
                  {successMessage}
                </Alert>
              )}

              {/* -------------------- STEP 1: EMAIL ADDRESS -------------------- */}
              {step === "email" && (
                <form onSubmit={handleEmailSubmit} id="auth_email_form">
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: isDark ? "white" : "#1a252f" }}>
                    Sign in
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                    to access your NEXUS Global Payroll Portal.
                  </Typography>

                  <TextField
                    fullWidth
                    label="Company Email Address"
                    variant="outlined"
                    id="login_email_input"
                    placeholder="firstname.lastname@nexus-corp.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email sx={{ color: "text.secondary", fontSize: 18 }} />
                          </InputAdornment>
                        )
                      }
                    }}
                    sx={{
                      mb: 2.5,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        bgcolor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)"
                      }
                    }}
                  />

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          color="primary"
                          size="small"
                        />
                      }
                      label={<Typography sx={{ fontSize: "12.5px" }}>Keep me signed in</Typography>}
                    />
                    <Typography
                      onClick={() => {
                        setResetEmail(email);
                        setStep("forgot");
                        setErrorMessage("");
                        setSuccessMessage("");
                      }}
                      sx={{
                        fontSize: "12.5px",
                        color: "#1565C0",
                        cursor: "pointer",
                        fontWeight: 600,
                        "&:hover": { textDecoration: "underline" }
                      }}
                      id="forgot_pwd_link"
                    >
                      Forgot password?
                    </Typography>
                  </Box>

                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    disabled={isLoading}
                    sx={{
                      py: 1.2,
                      borderRadius: "8px",
                      bgcolor: "#1565C0",
                      fontWeight: 700,
                      textTransform: "none",
                      fontSize: "14px",
                      boxShadow: "0 4px 12px rgba(21, 101, 192, 0.3)",
                      "&:hover": { bgcolor: "#0d47a1" }
                    }}
                    id="email_next_btn"
                  >
                    {isLoading ? <CircularProgress size={22} color="inherit" /> : "Sign In"}
                  </Button>

                  {/* SSO Alternate Button */}
                  <Box sx={{ mt: 3, pt: 2.5, borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)", textCenter: "center" }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => {
                        if (!email || !email.includes("@")) {
                          setErrorMessage("Please enter your official @nexus-corp.com company email address first to launch Entra SSO.");
                          return;
                        }
                        setStep("sso_loading");
                        handleSsoFlow();
                      }}
                      sx={{
                        py: 1.1,
                        borderRadius: "8px",
                        textTransform: "none",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: isDark ? "white" : "#323130",
                        borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
                        "&:hover": {
                          borderColor: "#1565C0",
                          bgcolor: isDark ? "rgba(21,101,192,0.05)" : "rgba(21,101,192,0.02)"
                        }
                      }}
                      id="continue_sso_btn"
                    >
                      <svg width="16" height="16" viewBox="0 0 23 23" style={{ marginRight: 8 }}>
                        <path fill="#f35325" d="M0 0h11v11H0z" />
                        <path fill="#81bc06" d="M12 0h11v11H12z" />
                        <path fill="#05a6f0" d="M0 12h11v11H0z" />
                        <path fill="#ffba08" d="M12 12h11v11H12z" />
                      </svg>
                      Continue with Microsoft (SSO)
                    </Button>
                  </Box>

                  {/* Register link */}
                  <Box sx={{ mt: 2.5, textAlign: "center" }}>
                    <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "12.5px" }}>
                      Don't have an enterprise account?{" "}
                      <span
                        onClick={() => {
                          setRegEmail(email);
                          setStep("register");
                          setErrorMessage("");
                          setSuccessMessage("");
                        }}
                        style={{
                          color: "#1565C0",
                          cursor: "pointer",
                          fontWeight: 700,
                          textDecoration: "underline"
                        }}
                        id="register_me_link"
                      >
                        Register Me
                      </span>
                    </Typography>
                  </Box>
                </form>
              )}

              {/* -------------------- STEP: REGISTER -------------------- */}
              {step === "register" && (
                <form onSubmit={handleRegisterSubmit} id="auth_register_form">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                    <IconButton 
                      onClick={() => setStep("email")} 
                      size="small" 
                      id="back_to_login_btn"
                      sx={{ color: isDark ? "white" : "text.primary", p: 0.5 }}
                    >
                      <ArrowBack fontSize="small" />
                    </IconButton>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary", cursor: "pointer" }} onClick={() => setStep("email")}>
                      Back to Sign In
                    </Typography>
                  </Box>

                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: isDark ? "white" : "#1a252f" }}>
                    Register Enterprise Account
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                    Create your security credentials for NEXUS Payroll Portal.
                  </Typography>

                  <TextField
                    fullWidth
                    label="Full Name"
                    variant="outlined"
                    id="register_name_input"
                    placeholder="Ronak Surve"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    sx={{
                      mb: 2,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        bgcolor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)"
                      }
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Corporate Email Address"
                    variant="outlined"
                    id="register_email_input"
                    placeholder="ronaksurve@gmail.com"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    sx={{
                      mb: 2,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        bgcolor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)"
                      }
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Password"
                    variant="outlined"
                    id="register_password_input"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ p: 0.5 }}>
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                    sx={{
                      mb: 3,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        bgcolor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)"
                      }
                    }}
                  />

                  <Button
                    fullWidth
                    type="submit"
                    disabled={isLoading}
                    variant="contained"
                    sx={{
                      py: 1.2,
                      borderRadius: "8px",
                      bgcolor: "#107C10",
                      fontWeight: 700,
                      textTransform: "none",
                      fontSize: "14px",
                      boxShadow: "0 4px 12px rgba(16, 124, 16, 0.3)",
                      "&:hover": { bgcolor: "#0b590b" }
                    }}
                    id="register_submit_btn"
                  >
                    {isLoading ? <CircularProgress size={22} color="inherit" /> : "Register & Sign In"}
                  </Button>
                </form>
              )}

              {/* -------------------- STEP 2: PASSWORD FALLBACK -------------------- */}
              {step === "password" && (
                <form onSubmit={handlePasswordSubmit} id="auth_password_form">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <IconButton size="small" onClick={() => setStep("email")} sx={{ color: "text.secondary", p: 0 }}>
                      <ArrowBack fontSize="small" />
                    </IconButton>
                    <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                      {email}
                    </Typography>
                  </Box>

                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: isDark ? "white" : "#1a252f" }}>
                    Enter password
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 3.5 }}>
                    Enter your corporate network password to authenticate.
                  </Typography>

                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    variant="outlined"
                    id="login_password_input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock sx={{ color: "text.secondary", fontSize: 18 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                    sx={{
                      mb: 3,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        bgcolor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)"
                      }
                    }}
                  />

                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    disabled={isLoading}
                    sx={{
                      py: 1.2,
                      borderRadius: "8px",
                      bgcolor: "#1565C0",
                      fontWeight: 700,
                      textTransform: "none",
                      fontSize: "14px",
                      boxShadow: "0 4px 12px rgba(21, 101, 192, 0.3)",
                      "&:hover": { bgcolor: "#0d47a1" }
                    }}
                    id="password_signin_btn"
                  >
                    {isLoading ? <CircularProgress size={22} color="inherit" /> : "Verify Identity"}
                  </Button>
                </form>
              )}

              {/* -------------------- STEP 3: SSO HANDSHAKE LOADING -------------------- */}
              {step === "sso_loading" && (
                <Box sx={{ textAlign: "center", py: 4 }} id="sso_loading_container">
                  <CircularProgress size={45} sx={{ color: "#00a4ef", mb: 3 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? "white" : "#1a252f", mb: 1 }}>
                    Connecting to Microsoft...
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: "80%", mx: "auto" }}>
                    Redirecting to Microsoft Entra Active Directory secure SSO environment.
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{
                      mt: 3,
                      p: 1.5,
                      borderRadius: "8px",
                      bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 1.5
                    }}
                  >
                    <Shield sx={{ color: "#7fba00", fontSize: 16 }} />
                    <Typography sx={{ fontSize: "11px", fontStyle: "italic", fontFamily: "monospace" }}>
                      nexus-adfs-federation-active
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* -------------------- STEP 4: MULTI-FACTOR AUTH (OTP) -------------------- */}
              {step === "mfa" && (
                <form onSubmit={handleOtpVerify} id="auth_mfa_form">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <IconButton size="small" onClick={() => setStep("email")} sx={{ color: "text.secondary", p: 0 }}>
                      <ArrowBack fontSize="small" />
                    </IconButton>
                    <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                      {email}
                    </Typography>
                  </Box>

                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: isDark ? "white" : "#1a252f", display: "flex", alignItems: "center", gap: 1 }}>
                    <Shield sx={{ color: "#2E7D32" }} />
                    2-Step Verification
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                    To safeguard global payroll, we require secondary authentication. A 6-digit verification code has been dispatched to your corporate inbox.
                  </Typography>

                  {/* Simulated Email OTP Delivery Help Banner */}
                  {simulatedOtpCode && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        mb: 3,
                        borderRadius: "8px",
                        bgcolor: "rgba(46, 125, 50, 0.08)",
                        border: "1px dashed rgba(46, 125, 50, 0.3)",
                        textAlign: "center"
                      }}
                    >
                      <Typography sx={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", color: "#2E7D32", letterSpacing: "0.5px", mb: 0.5 }}>
                        📧 Simulated Enterprise Email Delivery
                      </Typography>
                      <Typography sx={{ fontSize: "12px", mb: 1 }}>
                        Your secure verification code is:
                      </Typography>
                      <Typography variant="h4" sx={{ fontFamily: "monospace", letterSpacing: "6px", fontWeight: 800, color: "#2E7D32" }}>
                        {simulatedOtpCode}
                      </Typography>
                    </Paper>
                  )}

                  <TextField
                    fullWidth
                    label="6-Digit Code"
                    variant="outlined"
                    id="mfa_otp_input"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    sx={{
                      mb: 2,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        fontFamily: "monospace",
                        fontSize: "20px",
                        letterSpacing: "6px",
                        textAlign: "center",
                        bgcolor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)"
                      }
                    }}
                  />

                  {/* Countdown Timer Display */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Typography sx={{ fontSize: "12.5px", color: otpTimer < 60 ? "#D32F2F" : "text.secondary", display: "flex", alignItems: "center", gap: 0.5 }}>
                      Code expires in: <span style={{ fontWeight: 700 }}>{formatTimer(otpTimer)}</span>
                    </Typography>
                    <Button
                      onClick={handleResendOtp}
                      disabled={otpTimer > 240 || isLoading}
                      size="small"
                      sx={{ textTransform: "none", fontSize: "12.5px", fontWeight: 700 }}
                      id="resend_otp_btn"
                    >
                      Resend Code
                    </Button>
                  </Box>

                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    disabled={isLoading || otpTimer === 0}
                    sx={{
                      py: 1.2,
                      borderRadius: "8px",
                      bgcolor: "#2E7D32",
                      fontWeight: 700,
                      textTransform: "none",
                      fontSize: "14px",
                      boxShadow: "0 4px 12px rgba(46, 125, 80, 0.3)",
                      "&:hover": { bgcolor: "#1b5e20" }
                    }}
                    id="mfa_verify_btn"
                  >
                    {isLoading ? <CircularProgress size={22} color="inherit" /> : "Verify & Access Nexus"}
                  </Button>
                </form>
              )}

              {/* -------------------- STEP 5: FORGOT PASSWORD -------------------- */}
              {step === "forgot" && (
                <form onSubmit={handleForgotPassword} id="auth_forgot_form">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <IconButton size="small" onClick={() => setStep("email")} sx={{ color: "text.secondary", p: 0 }}>
                      <ArrowBack fontSize="small" />
                    </IconButton>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Back to login
                    </Typography>
                  </Box>

                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: isDark ? "white" : "#1a252f" }}>
                    Forgot Password
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 3.5 }}>
                    Enter your registered corporate email to confirm authorization and reset your login password.
                  </Typography>

                  <TextField
                    fullWidth
                    label="Corporate Email Address"
                    variant="outlined"
                    id="forgot_email_input"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email sx={{ color: "text.secondary", fontSize: 18 }} />
                          </InputAdornment>
                        )
                      }
                    }}
                    sx={{
                      mb: 2.5,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px"
                      }
                    }}
                  />

                  {/* Simulated Security reset link helpful box */}
                  {forgotPasswordLink && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        mb: 3,
                        borderRadius: "8px",
                        bgcolor: "rgba(21, 101, 192, 0.08)",
                        border: "1px dashed rgba(21, 101, 192, 0.3)",
                        textAlign: "left"
                      }}
                    >
                      <Typography sx={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#1565C0", mb: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
                        <CheckCircle fontSize="small" /> Secure Token Generated
                      </Typography>
                      <Typography sx={{ fontSize: "11.5px", mb: 2 }}>
                        For safety, we simulate the email receipt in the browser. Click the recovery link below to authorize credentials reset:
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={() => {
                          setStep("reset");
                          setErrorMessage("");
                          setSuccessMessage("");
                        }}
                        sx={{ textTransform: "none", fontSize: "11.5px", fontWeight: 700 }}
                        id="forgot_reset_link_btn"
                      >
                        Reset Corporate Password Now
                      </Button>
                    </Paper>
                  )}

                  {!forgotPasswordLink && (
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      disabled={isLoading}
                      sx={{
                        py: 1.2,
                        borderRadius: "8px",
                        bgcolor: "#1565C0",
                        fontWeight: 700,
                        textTransform: "none",
                        fontSize: "14px",
                        "&:hover": { bgcolor: "#0d47a1" }
                      }}
                      id="forgot_submit_btn"
                    >
                      {isLoading ? <CircularProgress size={22} color="inherit" /> : "Validate Account"}
                    </Button>
                  )}
                </form>
              )}

              {/* -------------------- STEP 6: PASSWORD RESET INPUTS -------------------- */}
              {step === "reset" && (
                <form onSubmit={handleResetPasswordSubmit} id="auth_reset_form">
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: isDark ? "white" : "#1a252f" }}>
                    Create new password
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 3.5 }}>
                    Securely update your credentials. Make sure to choose a strong combination of characters.
                  </Typography>

                  <TextField
                    fullWidth
                    label="New Password"
                    type="password"
                    variant="outlined"
                    id="reset_new_password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                  />

                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type="password"
                    variant="outlined"
                    id="reset_confirm_password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                  />

                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    disabled={isLoading}
                    sx={{
                      py: 1.2,
                      borderRadius: "8px",
                      bgcolor: "#1565C0",
                      fontWeight: 700,
                      textTransform: "none",
                      fontSize: "14px",
                      "&:hover": { bgcolor: "#0d47a1" }
                    }}
                    id="reset_submit_btn"
                  >
                    {isLoading ? <CircularProgress size={22} color="inherit" /> : "Confirm New Credentials"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Snackbar notification feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      />
    </Box>
  );
}
