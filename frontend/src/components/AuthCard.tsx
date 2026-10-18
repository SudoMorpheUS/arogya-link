"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, LogIn, UserPlus, Shield, Stethoscope, UserCheck, Sparkles, CheckCircle2 } from "lucide-react";
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  getFriendlyAuthErrorMessage,
} from "@/lib/firebase";
import type { Hospital, Role } from "@/lib/types";

interface AuthCardProps {
  hospitals: Hospital[];
}

const DEMO_PASSWORD = "AarogyaLink@123";

const DEMO_PERSONAS = [
  {
    label: "Karthik Iyer",
    roleLabel: "Patient",
    email: "karthik.iyer@example.in",
    role: "patient" as Role,
  },
  {
    label: "Ananya Sharma",
    roleLabel: "Patient",
    email: "ananya.sharma@example.in",
    role: "patient" as Role,
  },
  {
    label: "Dr. Nisha Kapoor",
    roleLabel: "Doctor · Fortis",
    email: "nisha.kapoor@example.in",
    role: "doctor" as Role,
  },
  {
    label: "Dr. Rohan Mehta",
    roleLabel: "Doctor · Apollo",
    email: "rohan.mehta@example.in",
    role: "doctor" as Role,
  },
  {
    label: "Central Admin",
    roleLabel: "Administrator",
    email: "admin@arogyalink.in",
    role: "admin" as Role,
  },
];

export function AuthCard({ hospitals }: AuthCardProps) {
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [loading, setLoading] = useState(false);
  const [activePersonaEmail, setActivePersonaEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Common fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Registration fields
  const [role, setRole] = useState<Role>("patient");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("1995-06-15");
  const [gender, setGender] = useState<"M" | "F" | "O">("M");
  const [bloodGroup, setBloodGroup] = useState("B+");
  const [contactNumber, setContactNumber] = useState("9876543210");
  const [hospitalId, setHospitalId] = useState(hospitals[0]?.hospital_id ?? "HSP-01");
  const [specialization, setSpecialization] = useState("General Medicine");
  const [licenseNumber, setLicenseNumber] = useState("MCI-REG-5001");

  const quickLoginPersona = async (persona: (typeof DEMO_PERSONAS)[0]) => {
    setEmail(persona.email);
    setPassword(DEMO_PASSWORD);
    setActivePersonaEmail(persona.email);
    setError(null);
    setLoading(true);
    setSuccess(`Signing in as ${persona.label}...`);

    try {
      // 1. Try Firebase Authentication
      try {
        await signInWithEmailAndPassword(auth, persona.email, DEMO_PASSWORD);
      } catch (authErr: any) {
        if (authErr.code === "auth/user-not-found" || authErr.code === "auth/invalid-credential") {
          try {
            await createUserWithEmailAndPassword(auth, persona.email, DEMO_PASSWORD);
          } catch {}
        }
      }

      // 2. Establish server session
      const resp = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: persona.email,
          role: persona.role,
          displayName: persona.label,
        }),
      });

      const data = await resp.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to establish session");
      }

      setSuccess(`Signed in as ${persona.label}! Loading dashboard...`);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "Sign in failed");
      setLoading(false);
      setActivePersonaEmail(null);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      let firebaseEmail = email.trim();
      let displayName: string | null = null;

      try {
        const userCredential = await signInWithEmailAndPassword(auth, firebaseEmail, password);
        firebaseEmail = userCredential.user.email || firebaseEmail;
        displayName = userCredential.user.displayName;
      } catch (authErr: any) {
        // If it's one of the demo passwords, auto-create in Firebase if needed
        const isDefaultPassword = password === DEMO_PASSWORD || password === "ArogyaLink@2026";
        if (isDefaultPassword) {
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, firebaseEmail, password);
            firebaseEmail = userCredential.user.email || firebaseEmail;
          } catch {}
        } else {
          throw authErr;
        }
      }

      let savedRole: string | null = null;
      try {
        savedRole =
          localStorage.getItem(`arogya_role_${firebaseEmail.toLowerCase()}`) ||
          localStorage.getItem("arogya_last_role");
      } catch {}

      const resp = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: firebaseEmail,
          displayName,
          preferredRole: savedRole || undefined,
        }),
      });

      const res = await resp.json();
      if (!res.success) {
        throw new Error(res.error || "Failed to establish session");
      }

      try {
        if (res.session?.role) {
          localStorage.setItem(`arogya_role_${firebaseEmail.toLowerCase()}`, res.session.role);
          localStorage.setItem("arogya_last_role", res.session.role);
        }
      } catch {}

      setSuccess("Authenticated successfully. Redirecting to dashboard...");
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(getFriendlyAuthErrorMessage(err.code || "") || err.message);
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      try {
        await updateProfile(user, { displayName: fullName.trim() });
      } catch (profileErr) {
        console.warn("Could not set displayName:", profileErr);
      }

      try {
        localStorage.setItem(`arogya_role_${email.trim().toLowerCase()}`, role);
        localStorage.setItem("arogya_last_role", role);
      } catch {}

      const resp = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email || email.trim(),
          displayName: fullName.trim(),
          role,
          isRegistration: true,
          dateOfBirth: role === "patient" ? dateOfBirth : undefined,
          gender: role === "patient" ? gender : undefined,
          bloodGroup: role === "patient" ? bloodGroup : undefined,
          contactNumber: role === "patient" ? contactNumber : undefined,
          hospitalId: role === "doctor" ? hospitalId : undefined,
          specialization: role === "doctor" ? specialization : undefined,
          licenseNumber: role === "doctor" ? licenseNumber : undefined,
        }),
      });

      const res = await resp.json();
      if (!res.success) {
        throw new Error(res.error || "Failed to create account profile");
      }

      setSuccess("Account created successfully! Redirecting...");
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(getFriendlyAuthErrorMessage(err.code || "") || err.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-tabs" role="tablist" aria-label="Authentication Options">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signin"}
          className={`auth-tab ${mode === "signin" ? "auth-tab--active" : ""}`}
          onClick={() => {
            setMode("signin");
            setError(null);
            setSuccess(null);
          }}
        >
          <LogIn size={18} aria-hidden="true" />
          <span>Sign In</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "register"}
          className={`auth-tab ${mode === "register" ? "auth-tab--active" : ""}`}
          onClick={() => {
            setMode("register");
            setError(null);
            setSuccess(null);
          }}
        >
          <UserPlus size={18} aria-hidden="true" />
          <span>Create Account</span>
        </button>
      </div>

      <div className="card stack-sm">
        {error ? (
          <p className="notice notice--error" role="alert">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="notice" role="status" style={{ borderColor: "var(--blue-600)", background: "var(--blue-50)" }}>
            <CheckCircle2 size={16} aria-hidden="true" style={{ color: "var(--blue-700)", marginRight: 6 }} />
            {success}
          </p>
        ) : null}

        {mode === "signin" ? (
          <form onSubmit={handleSignIn} className="stack-sm">
            <div>
              <h2 style={{ fontSize: "var(--fs-lg)", marginBottom: 4 }}>Sign in with Email</h2>
              <p className="muted" style={{ fontSize: "var(--fs-sm)" }}>
                Access unified health records, consents, and hospital portals with Firebase.
              </p>
            </div>

            <div className="input__container" data-label="EMAIL">
              <div className="shadow__input" />
              <input
                type="email"
                required
                autoComplete="email"
                className="input__search"
                placeholder="ENTER EMAIL ADDRESS"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="input__container" data-label="PASSWORD">
              <div className="shadow__input" />
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                className="input__search"
                placeholder="ENTER PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="input__button__shadow"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "See password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                <span>{showPassword ? "HIDE" : "SHOW"}</span>
              </button>
            </div>

            <button type="submit" className="btn" disabled={loading} style={{ width: "100%", marginTop: 8 }}>
              {loading && !activePersonaEmail ? "Authenticating with Firebase..." : "Sign in to AarogyaLink"}
            </button>

            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                <span className="muted" style={{ fontSize: "var(--fs-xs)", fontWeight: 600 }}>
                  ⚡ 1-CLICK INSTANT DEMO LOGIN
                </span>
                <span className="muted" style={{ fontSize: "var(--fs-xs)" }}>
                  Password: <code>{DEMO_PASSWORD}</code>
                </span>
              </div>
              <div className="persona-pills" role="group" aria-label="Demo login shortcuts">
                {DEMO_PERSONAS.map((p) => {
                  const isCurrent = activePersonaEmail === p.email;
                  return (
                    <button
                      key={p.email}
                      type="button"
                      disabled={loading}
                      className="persona-pill"
                      onClick={() => quickLoginPersona(p)}
                      title={`Click to immediately sign in as ${p.label}`}
                      style={{
                        background: isCurrent ? "var(--blue-200)" : undefined,
                        borderColor: isCurrent ? "var(--blue-600)" : undefined,
                      }}
                    >
                      <Sparkles size={13} aria-hidden="true" style={{ color: "var(--blue-600)" }} />
                      <strong>{p.label}</strong> ({p.roleLabel})
                      {isCurrent ? " · Signing in..." : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="stack-sm">
            <div>
              <h2 style={{ fontSize: "var(--fs-lg)", marginBottom: 4 }}>Create AarogyaLink Account</h2>
              <p className="muted" style={{ fontSize: "var(--fs-sm)" }}>
                Register with email and password, powered by Firebase Authentication.
              </p>
            </div>

            <fieldset className="field">
              <legend style={{ fontSize: "var(--fs-sm)", fontWeight: 600, marginBottom: 6 }}>Select Account Role</legend>
              <div className="role-selector">
                <button
                  type="button"
                  className={`role-btn ${role === "patient" ? "role-btn--active" : ""}`}
                  onClick={() => setRole("patient")}
                >
                  <UserCheck size={18} style={{ margin: "0 auto 4px" }} />
                  <div>Patient</div>
                </button>
                <button
                  type="button"
                  className={`role-btn ${role === "doctor" ? "role-btn--active" : ""}`}
                  onClick={() => setRole("doctor")}
                >
                  <Stethoscope size={18} style={{ margin: "0 auto 4px" }} />
                  <div>Doctor</div>
                </button>
                <button
                  type="button"
                  className={`role-btn ${role === "admin" ? "role-btn--active" : ""}`}
                  onClick={() => setRole("admin")}
                >
                  <Shield size={18} style={{ margin: "0 auto 4px" }} />
                  <div>Admin</div>
                </button>
              </div>
            </fieldset>

            <div className="input__container" data-label="FULL NAME">
              <div className="shadow__input" />
              <input
                type="text"
                required
                className="input__search"
                placeholder={role === "doctor" ? "DR. PRIYA KRISHNAN" : "ANANYA SHARMA"}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="input__container" data-label="EMAIL">
              <div className="shadow__input" />
              <input
                type="email"
                required
                autoComplete="email"
                className="input__search"
                placeholder="YOU@DOMAIN.IN"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="input__container" data-label="PASSWORD (MIN 6 CHARS)">
              <div className="shadow__input" />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="input__search"
                placeholder="ENTER PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="input__button__shadow"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "See password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                <span>{showPassword ? "HIDE" : "SHOW"}</span>
              </button>
            </div>

            <div className="input__container" data-label="CONFIRM PASSWORD">
              <div className="shadow__input" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                className="input__search"
                placeholder="REPEAT PASSWORD"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="input__button__shadow"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                title={showConfirmPassword ? "Hide password" : "See password"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                <span>{showConfirmPassword ? "HIDE" : "SHOW"}</span>
              </button>
            </div>

            {role === "patient" ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <label className="field">
                    <span>Date of Birth</span>
                    <input
                      type="date"
                      required
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      disabled={loading}
                    />
                  </label>
                  <label className="field">
                    <span>Gender</span>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as "M" | "F" | "O")}
                      disabled={loading}
                    >
                      <option value="M">Male (M)</option>
                      <option value="F">Female (F)</option>
                      <option value="O">Other (O)</option>
                    </select>
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <label className="field">
                    <span>Blood Group</span>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      disabled={loading}
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Contact Number</span>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      disabled={loading}
                    />
                  </label>
                </div>
              </>
            ) : null}

            {role === "doctor" ? (
              <>
                <label className="field">
                  <span>Affiliated Hospital</span>
                  <select
                    value={hospitalId}
                    onChange={(e) => setHospitalId(e.target.value)}
                    disabled={loading}
                  >
                    {hospitals.map((h) => (
                      <option key={h.hospital_id} value={h.hospital_id}>
                        {h.hospital_name} ({h.hospital_id})
                      </option>
                    ))}
                  </select>
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <label className="field">
                    <span>Specialization</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cardiology"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      disabled={loading}
                    />
                  </label>
                  <label className="field">
                    <span>Medical License No.</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MCI-DL-12345"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      disabled={loading}
                    />
                  </label>
                </div>
              </>
            ) : null}

            <button type="submit" className="btn" disabled={loading} style={{ width: "100%", marginTop: 8 }}>
              {loading ? "Creating Firebase account..." : "Register & Sign in"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
