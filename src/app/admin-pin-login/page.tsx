"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPinLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        router.replace("/admin");
        router.refresh();
      } else {
        setError(data.error ?? "بيانات خاطئة");
      }
    } catch {
      setError("حدث خطأ، حاول مرة ثانية");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 24,
          padding: "40px 32px",
          backdropFilter: "blur(16px)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: 24,
            }}
          >
            🔐
          </div>
          <div style={{ color: "#f1f5f9", fontSize: 20, fontWeight: 700 }}>لوحة التحكم</div>
          <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 6 }}>أدخل بياناتك للدخول</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              اسم المستخدم
            </label>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="أدخل اسم المستخدم"
              style={{
                width: "100%",
                height: 48,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.07)",
                color: "#f1f5f9",
                padding: "0 16px",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                direction: "ltr",
                textAlign: "right",
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              كلمة المرور
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="أدخل كلمة المرور"
              style={{
                width: "100%",
                height: 48,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.07)",
                color: "#f1f5f9",
                padding: "0 16px",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                direction: "ltr",
                textAlign: "right",
              }}
            />
          </div>

          {error ? (
            <div
              style={{
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 12,
                padding: "10px 14px",
                color: "#fca5a5",
                fontSize: 13,
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: 52,
              borderRadius: 16,
              background: loading ? "#4338ca" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "opacity 0.2s",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "جاري الدخول..." : "دخول"}
          </button>
        </form>
      </div>
    </div>
  );
}
