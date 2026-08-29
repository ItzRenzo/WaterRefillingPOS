import { useState } from "react";

/* ── Types ───────────────────────────────────────────────────────────── */
type Role = "admin" | "cashier";
interface User         { name: string; role: Role; }
interface InventoryItem { id: number; name: string; unit: string; quantity: number; minStock: number; pricePerUnit: number; lastUpdated: string; }
interface Transaction   { id: number; qty: number; total: number; cashier: string; time: string; }

/* ── Constants ───────────────────────────────────────────────────────── */
const BLUE   = "#1e40af";
const BLUE_L = "#eff6ff";
const BLUE_B = "#bfdbfe";

const USERS = {
  admin:   { username: "admin",   password: "admin123",   name: "Maria Santos",   role: "admin"   as Role },
  cashier: { username: "cashier", password: "cashier123", name: "Rico Dela Cruz", role: "cashier" as Role },
};

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 1, name: "1-Gallon Purified Water", unit: "gallon", quantity: 100, minStock: 20, pricePerUnit: 30, lastUpdated: "2026-08-25" },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 1, qty: 3, total: 90,  cashier: "Rico Dela Cruz", time: "08:14 AM" },
  { id: 2, qty: 1, total: 30,  cashier: "Rico Dela Cruz", time: "09:02 AM" },
  { id: 3, qty: 5, total: 150, cashier: "Rico Dela Cruz", time: "10:30 AM" },
];

/* ── Small helpers ───────────────────────────────────────────────────── */
function stockVariant(qty: number, min: number): "ok" | "low" | "critical" {
  const r = qty / min;
  if (r <= 0.5) return "critical";
  if (r <= 1)   return "low";
  return "ok";
}

function Badge({ variant }: { variant: "ok" | "low" | "critical" }) {
  const map = {
    ok:       { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0", label: "In stock" },
    low:      { bg: "#fffbeb", color: "#b45309", border: "#fde68a", label: "Low stock" },
    critical: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", label: "Critical" },
  }[variant];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px",
      borderRadius: 99, fontSize: 11, fontWeight: 600, letterSpacing: "0.02em",
      background: map.bg, color: map.color, border: `1px solid ${map.border}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: map.color }} />
      {map.label}
    </span>
  );
}

function DropIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2C6 5.5 3.5 7.5 3.5 10a4.5 4.5 0 009 0C12.5 7.5 10 5.5 8 2z" fill="currentColor"/>
    </svg>
  );
}

/* ── Input field ─────────────────────────────────────────────────────── */
function Field({
  label, type = "text", value, onChange, placeholder, hint, autoFocus,
}: {
  label: string; type?: string; value: string | number;
  onChange: (v: string) => void; placeholder?: string; hint?: string; autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{label}</label>
        {hint && <span style={{ fontSize: 11, color: "#9ca3af" }}>{hint}</span>}
      </div>
      <input
        type={type} value={value} placeholder={placeholder} autoFocus={autoFocus}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: "100%", padding: "9px 12px", borderRadius: 8, fontSize: 14,
          color: "#111827", background: "#fff", outline: "none",
          border: `1.5px solid ${focused ? BLUE : "#e5e7eb"}`,
          boxShadow: focused ? `0 0 0 3px ${BLUE_L}` : "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
      />
    </div>
  );
}

/* ── Modal shell ─────────────────────────────────────────────────────── */
function Modal({ title, subtitle, onClose, children, width = 440 }: {
  title: string; subtitle?: string; onClose: () => void;
  children: React.ReactNode; width?: number;
}) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50, display: "flex",
        alignItems: "center", justifyContent: "center", padding: 16,
        background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)",
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: "100%", maxWidth: width, background: "#fff", borderRadius: 14,
        boxShadow: "0 24px 64px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}>
        {/* Modal header */}
        <div style={{ padding: "20px 24px 0", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0, letterSpacing: "-0.01em" }}>{title}</h3>
              {subtitle && <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>{subtitle}</p>}
            </div>
            <button onClick={onClose} style={{
              width: 28, height: 28, borderRadius: 7, border: "1px solid #e5e7eb",
              background: "#f9fafb", cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", color: "#6b7280", fontSize: 16, flexShrink: 0, marginLeft: 12,
            }}>×</button>
          </div>
        </div>
        <div style={{ padding: "0 24px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

/* ── Btn ─────────────────────────────────────────────────────────────── */
function Btn({ children, onClick, variant = "primary", disabled, fullWidth, size = "md" }: {
  children: React.ReactNode; onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "outline";
  disabled?: boolean; fullWidth?: boolean; size?: "sm" | "md";
}) {
  const [hov, setHov] = useState(false);
  const pad = size === "sm" ? "5px 10px" : "9px 18px";
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: hov && !disabled ? "#1d3a9e" : BLUE,      color: "#fff",     border: "none" },
    ghost:   { background: hov ? "#f3f4f6" : "#f9fafb",               color: "#374151",  border: "1.5px solid #e5e7eb" },
    danger:  { background: hov && !disabled ? "#b91c1c" : "#dc2626",  color: "#fff",     border: "none" },
    outline: { background: hov ? BLUE_L : "#fff",                     color: BLUE,       border: `1.5px solid ${BLUE_B}` },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: pad, borderRadius: 8, fontSize: 13, fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.55 : 1,
        width: fullWidth ? "100%" : undefined, transition: "background 0.12s, box-shadow 0.12s",
        boxShadow: variant === "primary" && !disabled ? "0 1px 3px rgba(30,64,175,0.25)" : "none",
        ...styles[variant],
      }}
    >{children}</button>
  );
}

/* ── Edit / Add modal ────────────────────────────────────────────────── */
function EditModal({ item, isNew, onSave, onClose }: {
  item: InventoryItem | null; isNew: boolean;
  onSave: (i: InventoryItem) => void; onClose: () => void;
}) {
  const blank: InventoryItem = {
    id: Date.now(), name: "", unit: "gallon", quantity: 0,
    minStock: 20, pricePerUnit: 30, lastUpdated: new Date().toISOString().split("T")[0],
  };
  const [f, setF] = useState<InventoryItem>(item ?? blank);
  const set = (k: keyof InventoryItem, v: string) =>
    setF(p => ({ ...p, [k]: ["quantity","minStock","pricePerUnit"].includes(k) ? Number(v) : v }));

  const isValid = f.name.trim().length > 0 && f.unit.trim().length > 0;

  return (
    <Modal
      title={isNew ? "Add new product" : "Edit product"}
      subtitle={isNew ? "Add a product to your inventory." : `Editing "${item?.name}"`}
      onClose={onClose}
    >
      <div style={{ display: "grid", gap: 14 }}>
        <Field label="Product name" value={f.name} onChange={v => set("name", v)} placeholder="e.g. 1-Gallon Purified Water" autoFocus />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Unit" value={f.unit} onChange={v => set("unit", v)} placeholder="gallon" />
          <Field label="Price per unit" type="number" value={f.pricePerUnit} onChange={v => set("pricePerUnit", v)} hint="₱" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Quantity" type="number" value={f.quantity} onChange={v => set("quantity", v)} hint="current stock" />
          <Field label="Min stock alert" type="number" value={f.minStock} onChange={v => set("minStock", v)} hint="reorder at" />
        </div>

        {/* Preview */}
        {f.name && (
          <div style={{
            padding: "10px 12px", borderRadius: 8,
            background: BLUE_L, border: `1px solid ${BLUE_B}`,
            fontSize: 12, color: BLUE, display: "flex", justifyContent: "space-between",
          }}>
            <span style={{ fontWeight: 500 }}>{f.name}</span>
            <span style={{ fontFamily: "var(--font-mono)" }}>₱{f.pricePerUnit} / {f.unit || "unit"}</span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        <Btn variant="ghost" onClick={onClose} fullWidth>Cancel</Btn>
        <Btn variant="primary" onClick={() => isValid && onSave({ ...f, lastUpdated: new Date().toISOString().split("T")[0] })} disabled={!isValid} fullWidth>
          {isNew ? "Add product" : "Save changes"}
        </Btn>
      </div>
    </Modal>
  );
}

/* ── Sale modal ──────────────────────────────────────────────────────── */
function SaleModal({ item, onSell, onClose }: {
  item: InventoryItem; onSell: (qty: number) => void; onClose: () => void;
}) {
  const [qty, setQty] = useState(1);
  const total = qty * item.pricePerUnit;
  const change = (d: number) => setQty(q => Math.min(item.quantity, Math.max(1, q + d)));

  return (
    <Modal title="Process sale" subtitle={item.name} onClose={onClose} width={380}>
      {/* Product info */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", background: BLUE_L, border: `1px solid ${BLUE_B}`,
        borderRadius: 8, marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: BLUE }}><DropIcon /></span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1e3a8a" }}>₱{item.pricePerUnit} / {item.unit}</span>
        </div>
        <span style={{ fontSize: 12, color: "#6b7280", fontFamily: "var(--font-mono)" }}>{item.quantity} available</span>
      </div>

      {/* Qty stepper */}
      <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}>Quantity</label>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <button onClick={() => change(-1)}
          style={{
            width: 40, height: 40, borderRadius: 10, border: "1.5px solid #e5e7eb",
            background: "#f9fafb", fontSize: 20, cursor: "pointer", color: "#374151",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>−</button>
        <input type="number" min={1} max={item.quantity} value={qty}
          onChange={e => setQty(Math.min(item.quantity, Math.max(1, Number(e.target.value))))}
          style={{
            flex: 1, padding: "10px 0", textAlign: "center", border: "1.5px solid #e5e7eb",
            borderRadius: 10, fontSize: 26, fontWeight: 800, fontFamily: "var(--font-mono)",
            color: "#111827", outline: "none", background: "#fff",
          }}
        />
        <button onClick={() => change(1)}
          style={{
            width: 40, height: 40, borderRadius: 10, border: "1.5px solid #e5e7eb",
            background: "#f9fafb", fontSize: 20, cursor: "pointer", color: "#374151",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>+</button>
      </div>

      {/* Total */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 16px", background: "#f9fafb", borderRadius: 10,
        border: "1px solid #f3f4f6", marginBottom: 20,
      }}>
        <span style={{ fontSize: 13, color: "#6b7280" }}>Total amount</span>
        <span style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-mono)", color: "#111827", letterSpacing: "-0.03em" }}>
          ₱{total.toLocaleString()}
        </span>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <Btn variant="ghost" onClick={onClose} fullWidth>Cancel</Btn>
        <Btn variant="primary" onClick={() => onSell(qty)} fullWidth>Confirm sale</Btn>
      </div>
    </Modal>
  );
}

/* ── Delete confirm ──────────────────────────────────────────────────── */
function DeleteModal({ name, onConfirm, onClose }: { name: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal title="Delete product" onClose={onClose} width={360}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="#dc2626"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 4v4m0 2v.5" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
            You are about to delete <strong>"{name}"</strong>. This will permanently remove it from inventory and cannot be undone.
          </p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn variant="ghost" onClick={onClose} fullWidth>Keep it</Btn>
        <Btn variant="danger" onClick={onConfirm} fullWidth>Yes, delete</Btn>
      </div>
    </Modal>
  );
}

/* ── Toast ───────────────────────────────────────────────────────────── */
function Toast({ message, type = "success" }: { message: string; type?: "success" | "info" }) {
  return (
    <div style={{
      position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
      zIndex: 100, background: "#111827", color: "#f9fafb",
      padding: "11px 18px", borderRadius: 10, fontSize: 13, fontWeight: 500,
      boxShadow: "0 8px 32px rgba(0,0,0,0.24)", whiteSpace: "nowrap",
      display: "flex", alignItems: "center", gap: 9,
      border: "1px solid rgba(255,255,255,0.07)",
    }}>
      {type === "success"
        ? <svg width="15" height="15" viewBox="0 0 15 15"><circle cx="7.5" cy="7.5" r="6.5" stroke="#22c55e" strokeWidth="1.4" fill="none"/><path d="M4.5 7.5l2.2 2.2 3.8-3.8" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        : <svg width="15" height="15" viewBox="0 0 15 15"><circle cx="7.5" cy="7.5" r="6.5" stroke="#60a5fa" strokeWidth="1.4" fill="none"/><path d="M7.5 5v4m0 1.5v.5" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round"/></svg>
      }
      {message}
    </div>
  );
}

/* ── Stat card ───────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div style={{
      borderRadius: 12, padding: "18px 20px",
      border: `1px solid ${accent ? BLUE_B : "#e2e8f0"}`,
      background: accent ? BLUE_L : "#fff",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: accent ? BLUE : "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--font-mono)", letterSpacing: "-0.03em", color: accent ? BLUE : "#111827" }}>{value}</div>
      <div style={{ fontSize: 12, color: accent ? "#3b82f6" : "#9ca3af", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

/* ── Login ───────────────────────────────────────────────────────────── */
function LoginPage({ onLogin }: { onLogin: (u: User) => void }) {
  const [role, setRole]         = useState<Role>("cashier");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [busy, setBusy]         = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    setTimeout(() => {
      const u = USERS[role];
      if (username === u.username && password === u.password) {
        onLogin({ name: u.name, role: u.role });
      } else {
        setError("Incorrect username or password.");
        setBusy(false);
      }
    }, 400);
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 20px",
      backgroundColor: "#060f2a",
      backgroundImage: `
        radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px),
        radial-gradient(ellipse 80% 60% at 50% 44%, rgba(37,99,235,0.62) 0%, transparent 68%),
        radial-gradient(ellipse 50% 38% at 50% 36%, rgba(147,197,253,0.2)  0%, transparent 58%),
        radial-gradient(ellipse 35% 25% at 14% 86%, rgba(29,78,216,0.28)  0%, transparent 65%),
        radial-gradient(ellipse 35% 25% at 86% 12%, rgba(29,78,216,0.22)  0%, transparent 65%)
      `,
      backgroundSize: "28px 28px, auto, auto, auto, auto",
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* ── Single self-contained card ── */}
        <div style={{
          background: "#fff", borderRadius: 24,
          boxShadow: "0 12px 56px rgba(30,64,175,0.18), 0 2px 8px rgba(0,0,0,0.06)",
          border: "1px solid #bfdbfe", overflow: "hidden",
        }}>

          {/* Blue header band */}
          <div style={{
            background: "linear-gradient(160deg, #0f2460 0%, #1e40af 60%, #2563eb 100%)",
            padding: "32px 28px 0", position: "relative", overflow: "hidden",
            display: "flex", flexDirection: "column", alignItems: "center",
          }}>
            {/* Subtle rings */}
            <svg style={{ position: "absolute", top: -60, right: -60, opacity: 0.09 }} width="240" height="240" viewBox="0 0 240 240" fill="none">
              <circle cx="120" cy="120" r="110" stroke="#fff" strokeWidth="1.5"/>
              <circle cx="120" cy="120" r="75"  stroke="#fff" strokeWidth="1.5"/>
              <circle cx="120" cy="120" r="40"  stroke="#fff" strokeWidth="1.5"/>
            </svg>
            <svg style={{ position: "absolute", bottom: 10, left: -40, opacity: 0.06 }} width="160" height="160" viewBox="0 0 160 160" fill="none">
              <circle cx="80" cy="80" r="70" stroke="#fff" strokeWidth="1.5"/>
              <circle cx="80" cy="80" r="45" stroke="#fff" strokeWidth="1.5"/>
            </svg>

            {/* Animated drop — centred and larger */}
            <svg width="88" height="100" viewBox="0 0 160 180" fill="none" style={{ position: "relative", zIndex: 1 }}>
              <defs>
                <clipPath id="dc"><path d="M80 10C55 42 16 66 16 102a64 64 0 00128 0c0-36-39-60-64-92z"/></clipPath>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#bfdbfe"/>
                  <stop offset="100%" stopColor="#93c5fd"/>
                </linearGradient>
                <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa"/>
                  <stop offset="100%" stopColor="#1e3a8a"/>
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="160" height="180" fill="url(#sg)" clipPath="url(#dc)"/>
              <path clipPath="url(#dc)" fill="url(#wg)">
                <animate attributeName="d"
                  values="M-40,108 C0,93 40,123 80,108 C120,93 160,123 200,108 L200,180 L-40,180 Z;M-40,108 C0,123 40,93 80,108 C120,123 160,93 200,108 L200,180 L-40,180 Z;M-40,108 C0,93 40,123 80,108 C120,93 160,123 200,108 L200,180 L-40,180 Z"
                  dur="2.4s" repeatCount="indefinite"/>
              </path>
              <path clipPath="url(#dc)" fill="#1d4ed8" opacity="0.5">
                <animate attributeName="d"
                  values="M-40,120 C0,105 40,135 80,120 C120,105 160,135 200,120 L200,180 L-40,180 Z;M-40,120 C0,135 40,105 80,120 C120,135 160,105 200,120 L200,180 L-40,180 Z;M-40,120 C0,105 40,135 80,120 C120,105 160,135 200,120 L200,180 L-40,180 Z"
                  dur="1.9s" begin="-0.6s" repeatCount="indefinite"/>
              </path>
              <ellipse cx="57" cy="70" rx="9" ry="15" fill="rgba(255,255,255,0.5)" transform="rotate(-25 57 70)" clipPath="url(#dc)"/>
              <path d="M80 10C55 42 16 66 16 102a64 64 0 00128 0c0-36-39-60-64-92z" stroke="rgba(255,255,255,0.35)" strokeWidth="2"/>
            </svg>

            {/* Brand text — centred */}
            <div style={{ textAlign: "center", marginTop: 12, marginBottom: 28, position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>RJane Water</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 5 }}>Inventory System</div>
            </div>

            {/* Wave cutout */}
            <svg viewBox="0 0 420 24" preserveAspectRatio="none" fill="#fff"
              style={{ position: "absolute", bottom: -1, left: 0, right: 0, width: "100%", display: "block" }}>
              <path d="M0,24 L0,14 C70,0 140,24 210,12 C280,0 350,22 420,12 L420,24 Z"/>
            </svg>
          </div>

          {/* Form body */}
          <div style={{ padding: "22px 28px 26px" }}>
            <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 600, color: "#374151" }}>Sign in as</p>

            {/* Role cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
              {([
                { r: "cashier" as Role, icon: "👤", label: "Cashier", sub: "Process sales" },
                { r: "admin"   as Role, icon: "🔧", label: "Admin",   sub: "Full control"  },
              ]).map(({ r, icon, label, sub }) => (
                <button key={r} onClick={() => { setRole(r); setError(""); setUsername(""); setPassword(""); }}
                  style={{
                    padding: "11px 8px 10px", borderRadius: 11, cursor: "pointer", textAlign: "center",
                    border: `2px solid ${role === r ? BLUE : "#e5e7eb"}`,
                    background: role === r ? BLUE_L : "#fafafa",
                    transition: "all 0.15s", outline: "none",
                  }}>
                  <div style={{ fontSize: 20, lineHeight: 1, marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: role === r ? BLUE : "#374151", marginBottom: 1 }}>{label}</div>
                  <div style={{ fontSize: 11, color: role === r ? "#3b82f6" : "#9ca3af" }}>{sub}</div>
                </button>
              ))}
            </div>

            <form onSubmit={submit}>
              <div style={{ marginBottom: 11 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>Username</label>
                <div style={{ position: "relative" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input type="text" value={username} placeholder={`${role} username`}
                    onChange={e => setUsername(e.target.value)} autoComplete="username"
                    style={{ width: "100%", padding: "11px 13px 11px 36px", borderRadius: 10, fontSize: 14, color: "#111827", background: "#f8fafc", outline: "none", border: "1.5px solid #e2e8f0", transition: "all 0.15s", boxSizing: "border-box" }}
                    onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.background = "#fff"; e.target.style.boxShadow = `0 0 0 3px ${BLUE_L}`; }}
                    onBlur={e =>  { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; e.target.style.boxShadow = "none"; }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>Password</label>
                <div style={{ position: "relative" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                  <input type={showPw ? "text" : "password"} value={password} placeholder="••••••••"
                    onChange={e => setPassword(e.target.value)} autoComplete="current-password"
                    style={{ width: "100%", padding: "11px 44px 11px 36px", borderRadius: 10, fontSize: 14, color: "#111827", background: "#f8fafc", outline: "none", border: "1.5px solid #e2e8f0", transition: "all 0.15s", boxSizing: "border-box" }}
                    onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.background = "#fff"; e.target.style.boxShadow = `0 0 0 3px ${BLUE_L}`; }}
                    onBlur={e =>  { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; e.target.style.boxShadow = "none"; }}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, color: "#9ca3af", display: "flex", alignItems: "center" }}>
                    {showPw
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 10, display: "flex", alignItems: "center", gap: 8, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 13, color: "#dc2626" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}><circle cx="7" cy="7" r="6" stroke="#dc2626" strokeWidth="1.2" fill="none"/><path d="M7 4v3.5M7 9.5v.5" stroke="#dc2626" strokeWidth="1.4" strokeLinecap="round"/></svg>
                  {error}
                </div>
              )}

              <button type="submit" disabled={busy} style={{
                width: "100%", padding: "13px 0", borderRadius: 11, border: "none",
                background: busy ? "#93c5fd" : `linear-gradient(135deg, #1e3a8a, ${BLUE} 55%, #3b82f6)`,
                color: "#fff", fontSize: 15, fontWeight: 700,
                cursor: busy ? "not-allowed" : "pointer",
                boxShadow: busy ? "none" : "0 4px 18px rgba(30,64,175,0.38)",
                transition: "all 0.15s",
              }}>
                {busy ? "Signing in…" : "Sign in →"}
              </button>
            </form>

            <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#94a3b8", marginBottom: 0 }}>
              © 2026 RJane Water Refilling Station
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Paginator ───────────────────────────────────────────────────────── */
const PAGE_SIZE = 5;

function Paginator({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }

  const btnBase: React.CSSProperties = {
    minWidth: 32, height: 32, borderRadius: 7, border: "1.5px solid #e2e8f0",
    background: "#f9fafb", fontSize: 13, cursor: "pointer", fontWeight: 500,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.12s", color: "#374151",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderTop: "1px solid #f3f4f6" }}>
      <span style={{ fontSize: 12, color: "#9ca3af" }}>
        Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total}
      </span>
      {totalPages > 1 && <div style={{ display: "flex", gap: 4 }}>
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          style={{ ...btnBase, opacity: page === 1 ? 0.35 : 1, cursor: page === 1 ? "not-allowed" : "pointer" }}>
          ←
        </button>
        {pages.map((p, i) =>
          p === "…"
            ? <span key={`ellipsis-${i}`} style={{ ...btnBase, border: "none", cursor: "default", color: "#9ca3af" }}>…</span>
            : <button key={p} onClick={() => onChange(p as number)}
                style={{ ...btnBase, background: page === p ? BLUE : "#f9fafb", color: page === p ? "#fff" : "#374151", borderColor: page === p ? BLUE : "#e2e8f0" }}>
                {p}
              </button>
        )}
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
          style={{ ...btnBase, opacity: page === totalPages ? 0.35 : 1, cursor: page === totalPages ? "not-allowed" : "pointer" }}>
          →
        </button>
      </div>}
    </div>
  );
}

/* ── Dashboard ───────────────────────────────────────────────────────── */
function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [inventory, setInventory]       = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [search, setSearch]             = useState("");
  const [modal, setModal]               = useState<{ item: InventoryItem | null; isNew: boolean } | null>(null);
  const [deleteId, setDeleteId]         = useState<number | null>(null);
  const [saleItem, setSaleItem]         = useState<InventoryItem | null>(null);
  const [toast, setToast]               = useState<string | null>(null);
  const [tab, setTab]                   = useState<"inventory" | "transactions">("inventory");
  const [invPage, setInvPage]           = useState(1);
  const [txPage, setTxPage]             = useState(1);

  const item = inventory[0];
  const filtered = inventory.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  const pagedInv = filtered.slice((invPage - 1) * PAGE_SIZE, invPage * PAGE_SIZE);
  const pagedTx  = transactions.slice((txPage - 1) * PAGE_SIZE, txPage * PAGE_SIZE);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }
  function handleSearch(v: string) { setSearch(v); setInvPage(1); }

  function saveItem(i: InventoryItem) {
    setInventory(prev => {
      const idx = prev.findIndex(x => x.id === i.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = i; return n; }
      return [...prev, i];
    });
    setModal(null);
    showToast(i.name + " saved.");
  }

  function processSale(qty: number) {
    if (!saleItem) return;
    const total = qty * saleItem.pricePerUnit;
    const time  = new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
    setInventory(prev => prev.map(i => i.id === saleItem.id
      ? { ...i, quantity: i.quantity - qty, lastUpdated: new Date().toISOString().split("T")[0] } : i));
    setTransactions(prev => [{ id: Date.now(), qty, total, cashier: user.name, time }, ...prev]);
    setSaleItem(null);
    showToast(`Sold ${qty} gallon${qty > 1 ? "s" : ""} — ₱${total.toLocaleString()}`);
  }

  const totalSales  = transactions.reduce((s, t) => s + t.total, 0);
  const deleteItem  = inventory.find(i => i.id === deleteId);
  const variant     = item ? stockVariant(item.quantity, item.minStock) : "ok";

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40, background: "#fff",
        borderBottom: "1px solid #e2e8f0", height: 58,
        display: "flex", alignItems: "center", padding: "0 28px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: BLUE, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff" }}><DropIcon /></span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em", color: "#111827" }}>RJane Water</span>
          <span style={{ width: 1, height: 16, background: "#e2e8f0", margin: "0 8px" }} />
          <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 500 }}>Inventory</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{user.name}</div>
            <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "capitalize", fontFamily: "var(--font-mono)" }}>{user.role}</div>
          </div>
          <button onClick={onLogout} style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", color: "#6b7280", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Sign out</button>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 28px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 28 }}>
          <StatCard label="In stock" value={item ? String(item.quantity) : "—"} sub="gallons available" accent={variant !== "ok"} />
          <StatCard label="Price / gallon" value={item ? `₱${item.pricePerUnit}` : "—"} sub="per unit" />
          <StatCard label="Min stock" value={item ? String(item.minStock) : "—"} sub="reorder threshold" />
          <StatCard label="Revenue today" value={`₱${totalSales.toLocaleString()}`} sub={`${transactions.length} transaction${transactions.length !== 1 ? "s" : ""}`} />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "#f1f5f9", borderRadius: 10, padding: 4, width: "fit-content" }}>
          {(["inventory", "transactions"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                padding: "7px 18px", border: "none", borderRadius: 8, cursor: "pointer",
                fontSize: 13, fontWeight: 600, transition: "all 0.12s",
                background: tab === t ? BLUE : "transparent",
                color: tab === t ? "#fff" : "#6b7280",
                boxShadow: tab === t ? "0 1px 4px rgba(30,64,175,0.2)" : "none",
              }}
            >{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>

        {/* ── Inventory tab ── */}
        {tab === "inventory" && (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Products</div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{filtered.length} item{filtered.length !== 1 ? "s" : ""}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} fill="none">
                    <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
                    <path d="M10 10l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  <input type="text" placeholder="Search products…" value={search}
                    onChange={e => handleSearch(e.target.value)}
                    style={{
                      padding: "8px 12px 8px 30px", border: "1.5px solid #e2e8f0", borderRadius: 8,
                      fontSize: 13, outline: "none", background: "#f8fafc", color: "#111827", width: 200,
                      transition: "border-color 0.15s",
                    }}
                    onFocus={e => (e.target.style.borderColor = BLUE)}
                    onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
                  />
                </div>
                {user.role === "admin" && (
                  <Btn variant="primary" onClick={() => setModal({ item: null, isNew: true })}>
                    + Add product
                  </Btn>
                )}
              </div>
            </div>

            <div style={{ height: 1, background: "#f3f4f6" }} />

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Product", "Unit", "Qty", "Min Stock", "Price", "Status", "Updated", ""].map(h => (
                      <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontWeight: 600, fontSize: 11, color: "#9ca3af", borderBottom: "1px solid #e2e8f0", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: "center", padding: 56, color: "#9ca3af", fontSize: 13 }}>No products found.</td></tr>
                  ) : pagedInv.map(itm => {
                    const v = stockVariant(itm.quantity, itm.minStock);
                    return (
                      <tr key={itm.id} style={{ borderBottom: "1px solid #f8fafc", transition: "background 0.1s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#fafafa")}
                        onMouseLeave={e => (e.currentTarget.style.background = "")}>
                        <td style={{ padding: "14px 20px", fontWeight: 600, color: "#111827" }}>{itm.name}</td>
                        <td style={{ padding: "14px 20px", color: "#6b7280", fontFamily: "var(--font-mono)", fontSize: 12 }}>{itm.unit}</td>
                        <td style={{ padding: "14px 20px", fontWeight: 800, fontFamily: "var(--font-mono)", color: v === "ok" ? "#111827" : "#dc2626" }}>{itm.quantity}</td>
                        <td style={{ padding: "14px 20px", color: "#9ca3af", fontFamily: "var(--font-mono)", fontSize: 12 }}>{itm.minStock}</td>
                        <td style={{ padding: "14px 20px", fontFamily: "var(--font-mono)", fontSize: 12, color: "#374151" }}>₱{itm.pricePerUnit}</td>
                        <td style={{ padding: "14px 20px" }}><Badge variant={v} /></td>
                        <td style={{ padding: "14px 20px", color: "#9ca3af", fontFamily: "var(--font-mono)", fontSize: 12 }}>{itm.lastUpdated}</td>
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            {user.role === "admin" ? (
                              <>
                                <Btn variant="ghost" size="sm" onClick={() => setModal({ item: itm, isNew: false })}>Edit</Btn>
                                <Btn variant="outline" size="sm" onClick={() => setDeleteId(itm.id)}>
                                  <span style={{ color: "#dc2626" }}>Delete</span>
                                </Btn>
                              </>
                            ) : (
                              <Btn variant="primary" size="sm" onClick={() => itm.quantity > 0 && setSaleItem(itm)} disabled={itm.quantity === 0}>
                                Sell
                              </Btn>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Paginator page={invPage} total={filtered.length} onChange={setInvPage} />
          </div>
        )}

        {/* ── Transactions tab ── */}
        {tab === "transactions" && (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Transaction Log</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{transactions.length} records today</div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["#", "Gallons", "Total", "Cashier", "Time"].map(h => (
                      <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontWeight: 600, fontSize: 11, color: "#9ca3af", borderBottom: "1px solid #e2e8f0", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: "center", padding: 56, color: "#9ca3af", fontSize: 13 }}>No transactions yet.</td></tr>
                  ) : pagedTx.map((t, i) => (
                    <tr key={t.id} style={{ borderBottom: "1px solid #f8fafc", transition: "background 0.1s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                      onMouseLeave={e => (e.currentTarget.style.background = "")}>
                      <td style={{ padding: "13px 20px", color: "#d1d5db", fontFamily: "var(--font-mono)", fontSize: 12 }}>{String(transactions.length - ((txPage - 1) * PAGE_SIZE + i)).padStart(3, "0")}</td>
                      <td style={{ padding: "13px 20px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "#111827" }}>{t.qty}</td>
                      <td style={{ padding: "13px 20px", fontWeight: 800, fontFamily: "var(--font-mono)", color: BLUE }}>₱{t.total.toLocaleString()}</td>
                      <td style={{ padding: "13px 20px", color: "#374151" }}>{t.cashier}</td>
                      <td style={{ padding: "13px 20px", color: "#9ca3af", fontFamily: "var(--font-mono)", fontSize: 12 }}>{t.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Paginator page={txPage} total={transactions.length} onChange={setTxPage} />
          </div>
        )}
      </main>

      {modal && <EditModal item={modal.item} isNew={modal.isNew} onSave={saveItem} onClose={() => setModal(null)} />}
      {deleteId !== null && deleteItem && (
        <DeleteModal name={deleteItem.name}
          onConfirm={() => { setInventory(p => p.filter(i => i.id !== deleteId)); setDeleteId(null); showToast("Product deleted."); }}
          onClose={() => setDeleteId(null)}
        />
      )}
      {saleItem && <SaleModal item={saleItem} onSell={processSale} onClose={() => setSaleItem(null)} />}
      {toast && <Toast message={toast} />}
    </div>
  );
}

/* ── Root ────────────────────────────────────────────────────────────── */
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  return user ? <Dashboard user={user} onLogout={() => setUser(null)} /> : <LoginPage onLogin={setUser} />;
}
