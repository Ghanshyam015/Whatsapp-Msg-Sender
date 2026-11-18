import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LockKeyhole, MessageSquare, ShieldCheck } from "lucide-react";
import api from "../services/api.js";

export default function AuthPage({ mode }) {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [business, setBusiness] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const isLogin = mode === "login";
  const isRegister = mode === "register";
  const isVerify = mode === "verify";
  const isForgot = mode === "forgot";
  const inviteToken = new URLSearchParams(location.search).get("invite") || "";
  const title = isLogin ? "Welcome back" : isRegister ? "Create your workspace" : isVerify ? "Verify your email" : "Reset your password";
  const subtitle = isLogin ? "Sign in to pick up where your business left off." :
    isRegister ? "Start connecting with customers, the thoughtful way." :
      isVerify ? "Enter the one-time code sent to your email address." :
        isForgot ? resetRequested ? "Enter the code from your email and choose a new password." : "We’ll email a reset code if this email belongs to an account." :
          "Enter the one-time code sent to your email address.";

  async function submit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      if (isLogin) {
        const { data } = await api.post("/auth/login", { email, password });
        if (!data?.token) throw new Error("The server response did not include a session token.");
        localStorage.setItem("token", data.token);
        navigate("/app/dashboard", { replace: true });
      } else if (isRegister) {
        await api.post("/auth/register", { email, password, business, phone, inviteToken });
        navigate("/verify", { replace: true, state: { email } });
      } else if (isVerify) {
        const { data } = await api.post("/auth/verify-email", { email, code });
        localStorage.setItem("token", data.token);
        navigate("/app/dashboard", { replace: true });
      } else if (isForgot && !resetRequested) {
        const { data } = await api.post("/auth/password-reset/request", { email });
        setResetRequested(true);
        setNotice(data.message);
      } else if (isForgot) {
        await api.post("/auth/password-reset/confirm", { email, code, password });
        navigate("/login", { replace: true, state: { notice: "Password reset. Sign in with your new password." } });
      } else {
        throw new Error("This authentication flow is not available.");
      }
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message || "The request failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="auth-page">
    <div className="auth-story">
      <Link to="/" className="brand auth-brand"><span className="brand-mark"><MessageSquare size={19} /></span>whats<span className="brand-blue">send</span></Link>
      <div className="auth-story-content">
        <span className="eyebrow eyebrow-light"><i /> BUILT FOR BETTER CONVERSATIONS</span>
        <h1>Make every message<br />feel more <span>human.</span></h1>
        <p>One calm, considered workspace for the conversations that move your business forward.</p>
        <div className="auth-proof"><div className="proof-avatars"><i>R</i><i>A</i><i>M</i><i>+</i></div><span>Made for teams that care about the details.</span></div>
        <div className="auth-story-foot"><ShieldCheck size={16} /> Your customer data stays yours.</div>
      </div>
      <span className="auth-orb auth-orb-one" /><span className="auth-orb auth-orb-two" />
    </div>
    <div className="auth-form-side">
      <Link className="back-link" to="/"><ArrowLeft size={15} /> Back to home</Link>
      <div className="auth-form-box">
        <div className="auth-lock"><LockKeyhole size={19} /></div>
        <h2>{title}</h2><p className="auth-subtitle">{subtitle}</p>
        <form onSubmit={submit} className="form-stack">
          {isRegister && !inviteToken && <label>Business name<input value={business} onChange={event => setBusiness(event.target.value)} placeholder="e.g. Studio North" autoComplete="organization" required /></label>}
          {(!isVerify || !email) && <label>Work email<input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@company.com" autoComplete="email" required /></label>}
          {isLogin && <label>Password<div className="password-field"><input type={showPassword ? "text" : "password"} value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>}
          {isRegister && <label>Password<input type="password" value={password} onChange={event => setPassword(event.target.value)} minLength="12" autoComplete="new-password" required /><small>Use at least 12 characters.</small></label>}
          {isRegister && <label>WhatsApp number <span className="optional-label">Optional for now</span><input type="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="+91 98765 43210" autoComplete="tel" /></label>}
          {(isVerify || (isForgot && resetRequested)) && <label>6-digit code<input inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={code} onChange={event => setCode(event.target.value)} placeholder="000000" autoComplete="one-time-code" required /></label>}
          {isForgot && resetRequested && <label>New password<input type="password" value={password} onChange={event => setPassword(event.target.value)} minLength="12" autoComplete="new-password" required /><small>Use at least 12 characters.</small></label>}
          {isLogin && <div className="auth-inline"><label className="check-label"><input type="checkbox" /> Remember me</label><Link to="/forgot-password">Forgot password?</Link></div>}
          {error && <div className="form-alert error-alert" role="alert">{error}</div>}
          {notice && <div className="form-alert info-alert" role="status">{notice}</div>}
          <button className="button button-primary auth-submit" disabled={busy}>{busy ? "Please wait…" : isLogin ? "Sign in" : isRegister ? "Create account" : isVerify ? "Verify email" : isForgot ? resetRequested ? "Reset password" : "Send reset code" : "Continue"} <ArrowRight size={16} /></button>
        </form>
        {isVerify && email && <button className="text-link auth-resend" disabled={busy} onClick={async () => {
          setError("");
          try {
            const { data } = await api.post("/auth/resend-verification", { email });
            setNotice(data.message);
          } catch (requestError) {
            setError(requestError.response?.data?.error || "Could not resend the verification code.");
          }
        }}>Resend verification code</button>}
        {isLogin && location.state?.notice && <div className="form-alert info-alert" role="status">{location.state.notice}</div>}
        {isLogin && <div className="auth-divider"><span>or continue with</span></div>}
        {isLogin && <button className="button button-secondary whatsapp-login" onClick={() => setNotice("WhatsApp OTP login is not configured on this server. No code was requested.")}><MessageSquare size={17} /> Continue with WhatsApp</button>}
        {(isLogin || isRegister) && <p className="auth-switch">{isLogin ? "New to Whats Send?" : "Already have an account?"} <Link to={isLogin ? "/register" : "/login"}>{isLogin ? "Create an account" : "Sign in"}</Link></p>}
        {!isLogin && !isRegister && <p className="auth-switch"><Link to="/login">Return to sign in</Link></p>}
        <div className="auth-assurance"><Check size={14} /> Secure sign-in · Protected workspace</div>
      </div>
      <footer className="auth-legal"><span>© 2025 Whats Send</span><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></footer>
    </div>
  </div>;
}
