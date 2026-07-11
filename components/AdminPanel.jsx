"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Yönetim paneli: yalnız adminlere görünür (RLS: profiles_select_admin politikası
// sayesinde adminler tüm profil kayıtlarını okuyabilir; finans/not verileri ASLA
// buradan erişilemez — onların RLS'i sahibe kilitli kalır).

const card = {
  border: "1px solid rgba(255,255,255,.14)",
  borderRadius: 20,
  padding: 18,
  background: "linear-gradient(150deg, rgba(15,23,42,.72), rgba(30,27,75,.34))",
};

function fmtDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("tr-TR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

export default function AdminPanel({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const { data, error: err } = await supabase
      .from("profiles")
      .select("id, full_name, email, created_at, is_admin")
      .order("created_at", { ascending: false });
    if (err) setError(err.message || "Kullanıcılar yüklenemedi.");
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.is_admin).length;
    const now = Date.now();
    const last7 = users.filter((u) => u.created_at && now - new Date(u.created_at).getTime() < 7 * 24 * 3600 * 1000).length;
    return { total, admins, last7 };
  }, [users]);

  return (
    <section style={{ display: "grid", gap: 18 }}>
      <div style={{ ...card, padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h3 className="gradientTitle" style={{ margin: "0 0 4px" }}>Yönetim Paneli</h3>
            <p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>Kayıtlı kullanıcılar ve genel istatistikler. Kullanıcı verileri (finans/not) gizlidir; yalnız hesap bilgileri görünür.</p>
          </div>
          <button type="button" className="secondaryButton" onClick={load} disabled={loading}>{loading ? "Yükleniyor…" : "Yenile"}</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginTop: 16 }}>
          <Stat label="Toplam Kullanıcı" value={stats.total} color="#60a5fa" />
          <Stat label="Son 7 Günde Katılan" value={stats.last7} color="#34d399" />
          <Stat label="Admin" value={stats.admins} color="#a78bfa" />
        </div>
      </div>

      <div style={card}>
        <h3 className="gradientTitle" style={{ margin: "0 0 12px" }}>Kullanıcılar</h3>
        {error ? <div style={{ color: "#fca5a5", fontSize: 13, marginBottom: 10 }}>⚠️ {error}</div> : null}
        {loading ? (
          <div style={{ color: "#94a3b8", fontSize: 13, padding: "16px 0", textAlign: "center" }}>Yükleniyor…</div>
        ) : users.length === 0 ? (
          <div style={{ color: "#94a3b8", fontSize: 13, padding: "16px 0", textAlign: "center" }}>Kayıtlı kullanıcı bulunamadı.</div>
        ) : (
          <div style={{ overflowX: "auto", borderRadius: 14, border: "1px solid rgba(255,255,255,.10)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", color: "#e2e8f0", fontSize: 13 }}>
              <thead style={{ background: "rgba(15,23,42,.9)" }}>
                <tr>
                  <Th>Ad Soyad</Th>
                  <Th>E-posta</Th>
                  <Th>Kayıt Tarihi</Th>
                  <Th>Rol</Th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderTop: "1px solid rgba(255,255,255,.08)", background: u.id === currentUserId ? "rgba(96,165,250,.08)" : "transparent" }}>
                    <Td>
                      <strong style={{ color: "#fff" }}>{u.full_name || "—"}</strong>
                      {u.id === currentUserId ? <span style={{ color: "#93c5fd", fontSize: 11, marginLeft: 8 }}>(sen)</span> : null}
                    </Td>
                    <Td>{u.email || "—"}</Td>
                    <Td>{fmtDate(u.created_at)}</Td>
                    <Td>
                      {u.is_admin
                        ? <span style={{ color: "#c4b5fd", fontWeight: 800, fontSize: 12 }}>👑 Admin</span>
                        : <span style={{ color: "#94a3b8", fontSize: 12 }}>Kullanıcı</span>}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ border: `1px solid ${color}44`, borderRadius: 16, padding: "12px 14px", background: `linear-gradient(150deg, ${color}22, ${color}0a)` }}>
      <div style={{ color: "#cbd5e1", fontSize: 11, fontWeight: 800, letterSpacing: ".03em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ color, fontSize: 26, fontWeight: 900, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function Th({ children }) {
  return <th style={{ textAlign: "left", padding: "11px 12px", color: "#bfdbfe", fontSize: 11, letterSpacing: ".05em", textTransform: "uppercase" }}>{children}</th>;
}

function Td({ children }) {
  return <td style={{ padding: "11px 12px", verticalAlign: "middle" }}>{children}</td>;
}
