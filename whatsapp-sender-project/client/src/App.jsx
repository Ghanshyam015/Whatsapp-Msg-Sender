import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AuthPage from "./pages/AuthPage.jsx";
import DashboardPages from "./pages/DashboardPages.jsx";
import PublicPages from "./pages/PublicPages.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import api from "./services/api.js";

function ProtectedApp() {
  const [status, setStatus] = useState("checking");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem("token");
    if (!token) {
      setStatus("unauthenticated");
      return () => { active = false; };
    }

    api.get("/auth/me")
      .then(() => { if (active) setStatus("authenticated"); })
      .catch(error => {
        if (!active) return;
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem("token");
          setStatus("unauthenticated");
        } else {
          setStatus("error");
        }
      });

    return () => { active = false; };
  }, [retry]);

  if (status === "unauthenticated") return <Navigate to="/login" replace />;
  if (status === "checking") return <div role="status">Checking your session…</div>;
  if (status === "error") {
    return <div role="alert">
      Could not verify your session. Check the API connection and try again.{" "}
      <button onClick={() => { setStatus("checking"); setRetry(value => value + 1); }}>Retry</button>
    </div>;
  }
  return <DashboardLayout><DashboardPages /></DashboardLayout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
      <Route path="/verify" element={<AuthPage mode="verify" />} />
      <Route path="/app/*" element={<ProtectedApp />} />
      <Route path="/*" element={<PublicPages />} />
    </Routes>
  );
}
