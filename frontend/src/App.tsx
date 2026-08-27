import { useState, useEffect, useRef } from "react";
import { api } from "./api";

type Role = "admin" | "cashier";
type View = "login" | "dashboard";

interface InventoryItem {
  id: number;
  name: string;
  unit: string;
  quantity: number;
  minStock: number;
  pricePerUnit: number;
  lastUpdated: string;
}

interface User {
  name: string;
  role: Role;
}

/* ─── Bubble canvas ─────────────────────────────────────────────────── */
interface Bubble { id: number; x: number; size: number; dur: number; delay: number; swayDur: number; }

function BubbleField() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const counter = useRef(0);

  useEffect(() => {
    const spawn = () => {
      setBubbles((prev) => {
        const next = prev.filter((b) => b.id > counter.current - 18);
        counter.current += 1;
        return [
          ...next,
          {
            id: counter.current,
            x: 5 + Math.random() * 90,
            size: 10 + Math.random() * 50,
            dur: 7 + Math.random() * 8,
            delay: 0,
            swayDur: 3 + Math.random() * 3,
          },
        ];
      });
    };
    const iv = setInterval(spawn, 600);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="bubble"
          style={{
            left: `${b.x}%`,
            width: b.size,
            height: b.size,
            animationDuration: `${b.dur}s, ${b.swayDur}s`,
            animationDelay: `${b.delay}s, 0s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Wave strip ────────────────────────────────────────────────────── */
function WaveStrip() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-28 overflow-hidden pointer-events-none">
      <svg
        viewBox="0 0 1440 112"
        className="absolute bottom-0"
        style={{
          width: "200%",
          animation: "wave 10s linear infinite",
          opacity: 0.18,
        }}
        preserveAspectRatio="none"
      >
        <path
          d="M0,56 C240,0 480,112 720,56 C960,0 1200,112 1440,56 L1440,112 L0,112 Z"
          fill="white"
        />
      </svg>
      <svg
        viewBox="0 0 1440 112"
        className="absolute bottom-0"
        style={{
          width: "200%",
          animation: "wave 14s linear infinite reverse",
          opacity: 0.1,
        }}
        preserveAspectRatio="none"
      >
        <path
          d="M0,70 C360,20 720,100 1080,50 C1260,25 1380,80 1440,70 L1440,112 L0,112 Z"
          fill="white"
        />
      </svg>
    </div>
  );
}

/* ─── Wave icon ─────────────────────────────────────────────────────── */
function WaveIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 40 24" fill="none">
      <path d="M2 8 C8 2, 14 14, 20 8 C26 2, 32 14, 38 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M2 14 C8 8, 14 20, 20 14 C26 8, 32 20, 38 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M2 20 C8 14, 14 26, 20 20 C26 14, 32 26, 38 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.4" />
    </svg>
  );
}

/* ─── Login page ────────────────────────────────────────────────────── */
function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [role, setRole] = useState<Role>("cashier");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api<{ user: User }>("/auth.php", {
        method: "POST",
        body: JSON.stringify({ username, password, role }),
      });
      onLogin(response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  const inputBase: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px 11px 42px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s, background 0.2s",
    backdropFilter: "blur(4px)",
  };

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #00d4ff 0%, #0066cc 35%, #003380 65%, #001133 100%)",
      }}
    >
      <BubbleField />
      <WaveStrip />

      {/* Back link */}
      <div className="absolute top-5 left-6 z-20">
        <a
          href="#"
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "rgba(255,255,255,0.7)" }}
          onClick={(e) => e.preventDefault()}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 8l5-5v3h7v4H7v3L2 8z"/>
          </svg>
          Back to Home
        </a>
      </div>

      {/* Card */}
      <div
        className="login-card relative z-10 w-full"
        style={{
          maxWidth: 420,
          margin: "0 16px",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: 20,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: "0 8px 48px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
          padding: "40px 36px 36px",
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="flex items-center justify-center mb-4"
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.25)",
              boxShadow: "0 0 24px rgba(0,212,255,0.3)",
            }}
          >
            <WaveIcon size={36} />
          </div>
          <h1 className="text-white font-bold text-2xl mb-1">Welcome Back</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
            Sign in to your <strong style={{ color: "rgba(255,255,255,0.85)" }}>RJane Water</strong> account
          </p>
        </div>

        {/* Role toggle */}
        <div
          className="flex mb-6 p-1 rounded-xl"
          style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          {(["cashier", "admin"] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => { setRole(r as Role); setError(""); setUsername(""); setPassword(""); }}
              className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all"
              style={{
                background: role === r
                  ? "linear-gradient(135deg, rgba(0,212,255,0.8), rgba(0,120,220,0.8))"
                  : "transparent",
                color: role === r ? "white" : "rgba(255,255,255,0.5)",
                boxShadow: role === r ? "0 2px 8px rgba(0,0,0,0.3)" : "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className="mb-4">
            <label className="block mb-2 text-xs font-semibold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.6)" }}>
              Username
            </label>
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.4)" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 8a3 3 0 100-6 3 3 0 000 6zM2 14s-1 0-1-1 1-4 7-4 7 3 7 4-1 1-1 1H2z"/>
                </svg>
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                style={inputBase}
                onFocus={(e) => { e.target.style.borderColor = "rgba(0,212,255,0.7)"; e.target.style.background = "rgba(255,255,255,0.12)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.2)"; e.target.style.background = "rgba(255,255,255,0.08)"; }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-5">
            <label className="block mb-2 text-xs font-semibold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.6)" }}>
              Password
            </label>
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.4)" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="3" y="7" width="10" height="8" rx="1.5"/>
                  <path d="M5 7V5a3 3 0 016 0v2" strokeWidth="1.5" stroke="currentColor" fill="none"/>
                </svg>
              </span>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{ ...inputBase, paddingRight: 42 }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(0,212,255,0.7)"; e.target.style.background = "rgba(255,255,255,0.12)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.2)"; e.target.style.background = "rgba(255,255,255,0.08)"; }}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute top-1/2 right-3 -translate-y-1/2"
                style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {showPass ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z"/>
                    <circle cx="8" cy="8" r="1.5" fill="rgba(0,0,0,0.4)"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" opacity="0.5"/>
                    <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center gap-2 mb-5">
            <input
              type="checkbox"
              id="remember"
              style={{ accentColor: "#00d4ff", width: 14, height: 14 }}
            />
            <label htmlFor="remember" style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
              Remember me
            </label>
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-lg text-sm"
              style={{ background: "rgba(255,80,80,0.15)", border: "1px solid rgba(255,80,80,0.3)", color: "#ffaaaa" }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 4a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 018 5zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
              </svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-bold rounded-xl text-sm tracking-widest uppercase transition-opacity"
            style={{
              background: loading
                ? "rgba(0,212,255,0.4)"
                : "linear-gradient(135deg, #00d4ff, #0099dd)",
              color: "white",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 20px rgba(0,180,255,0.45)",
              letterSpacing: "0.12em",
            }}
          >
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>

        {/* Account note */}
        <p
          className="text-center mt-5 text-xs"
          style={{ color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-mono)" }}
        >
          Use your assigned RJane Water account.
        </p>
      </div>
    </div>
  );
}

/* ─── Status badge ──────────────────────────────────────────────────── */
function StatusBadge({ quantity, minStock }: { quantity: number; minStock: number }) {
  const ratio = quantity / minStock;
  if (ratio <= 0.5)
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(220,50,50,0.12)", color: "#e55", border: "1px solid rgba(220,50,50,0.25)" }}>Critical</span>;
  if (ratio <= 1)
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(220,160,0,0.12)", color: "#c90", border: "1px solid rgba(220,160,0,0.25)" }}>Low</span>;
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(0,160,100,0.12)", color: "#0a5", border: "1px solid rgba(0,160,100,0.25)" }}>In Stock</span>;
}

/* ─── Edit modal ────────────────────────────────────────────────────── */
interface ModalProps { item: InventoryItem | null; isNew: boolean; onSave: (i: InventoryItem) => void; onClose: () => void; }

function EditModal({ item, isNew, onSave, onClose }: ModalProps) {
  const blank: InventoryItem = { id: Date.now(), name: "", unit: "jug", quantity: 0, minStock: 10, pricePerUnit: 0, lastUpdated: new Date().toISOString().split("T")[0] };
  const [form, setForm] = useState<InventoryItem>(item ?? blank);

  function set(k: keyof InventoryItem, v: string | number) { setForm((f) => ({ ...f, [k]: v })); }

  const iStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: "1px solid #dde3ed", background: "#f7f9fc",
    color: "#111", fontSize: 13, outline: "none",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,30,80,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl" style={{ background: "white" }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-base">{isNew ? "Add New Item" : "Edit Item"}</h3>
          <button onClick={onClose} style={{ background: "#f0f0f0", border: "none", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 16, color: "#666" }}>×</button>
        </div>
        <div className="space-y-4">
          {([
            { label: "Product Name", key: "name",         type: "text"   },
            { label: "Unit",         key: "unit",         type: "text"   },
            { label: "Quantity",     key: "quantity",     type: "number" },
            { label: "Min Stock",    key: "minStock",     type: "number" },
            { label: "Price (₱)",    key: "pricePerUnit", type: "number" },
          ] as { label: string; key: keyof InventoryItem; type: string }[]).map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: "#888" }}>{label}</label>
              <input type={type} value={form[key] as string | number}
                onChange={(e) => set(key, type === "number" ? Number(e.target.value) : e.target.value)}
                style={iStyle}
                onFocus={(e) => (e.target.style.borderColor = "#0099dd")}
                onBlur={(e) => (e.target.style.borderColor = "#dde3ed")}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: "#f0f0f0", color: "#555", border: "none", cursor: "pointer" }}>Cancel</button>
          <button
            onClick={() => onSave({ ...form, lastUpdated: new Date().toISOString().split("T")[0] })}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: "linear-gradient(135deg,#00d4ff,#0088cc)", color: "white", border: "none", cursor: "pointer" }}
          >
            {isNew ? "Add Item" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Sale modal (cashier) ──────────────────────────────────────────── */
interface SaleModalProps { item: InventoryItem; onSell: (qty: number) => void; onClose: () => void; }

function SaleModal({ item, onSell, onClose }: SaleModalProps) {
  const [qty, setQty] = useState(1);
  const max = item.quantity;
  const total = qty * item.pricePerUnit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,30,80,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-sm rounded-2xl p-6 shadow-2xl" style={{ background: "white" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-base">Process Sale</h3>
          <button onClick={onClose} style={{ background: "#f0f0f0", border: "none", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 16, color: "#666" }}>×</button>
        </div>
        <div className="rounded-xl p-3 mb-5" style={{ background: "#f0f8ff", border: "1px solid #c8e4f8" }}>
          <div className="font-semibold text-sm" style={{ color: "#003" }}>{item.name}</div>
          <div className="text-xs mt-0.5" style={{ color: "#88a", fontFamily: "var(--font-mono)" }}>
            ₱{item.pricePerUnit} / {item.unit} · {max} available
          </div>
        </div>
        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#888" }}>
          Quantity to sell
        </label>
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-9 h-9 rounded-lg font-bold text-lg flex items-center justify-center"
            style={{ background: "#eef", color: "#0088cc", border: "1px solid #c8e4f8", cursor: "pointer" }}
          >−</button>
          <input
            type="number"
            min={1}
            max={max}
            value={qty}
            onChange={(e) => setQty(Math.min(max, Math.max(1, Number(e.target.value))))}
            className="flex-1 text-center font-bold text-lg rounded-lg py-2"
            style={{ border: "1px solid #dde3ed", outline: "none", fontFamily: "var(--font-mono)" }}
          />
          <button
            onClick={() => setQty((q) => Math.min(max, q + 1))}
            className="w-9 h-9 rounded-lg font-bold text-lg flex items-center justify-center"
            style={{ background: "#eef", color: "#0088cc", border: "1px solid #c8e4f8", cursor: "pointer" }}
          >+</button>
        </div>
        <div className="flex items-center justify-between mb-5 px-1">
          <span className="text-sm" style={{ color: "#888" }}>Total</span>
          <span className="text-xl font-bold" style={{ color: "#0066cc", fontFamily: "var(--font-mono)" }}>₱{total.toLocaleString()}</span>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: "#f0f0f0", border: "none", cursor: "pointer" }}>Cancel</button>
          <button
            onClick={() => onSell(qty)}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg,#00d4ff,#0088cc)", border: "none", cursor: "pointer", boxShadow: "0 3px 12px rgba(0,150,220,0.3)" }}
          >Confirm Sale</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Delete confirm modal ──────────────────────────────────────────── */
function DeleteModal({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,30,80,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-sm rounded-2xl p-6 shadow-2xl" style={{ background: "white" }}>
        <div className="flex items-center justify-center mb-4">
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#fde8e8", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="#c0392b">
              <path d="M11 2a9 9 0 100 18A9 9 0 0011 2zm0 5v4m0 3v1" stroke="#c0392b" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
        </div>
        <h3 className="font-bold text-center mb-1">Delete this item?</h3>
        <p className="text-sm text-center mb-5" style={{ color: "#888" }}>This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: "#f0f0f0", border: "none", cursor: "pointer" }}>Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "#e74c3c", border: "none", cursor: "pointer" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Dashboard ─────────────────────────────────────────────────────── */
function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ item: InventoryItem | null; isNew: boolean } | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saleItem, setSaleItem] = useState<InventoryItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function loadInventory() {
    try {
      const response = await api<{ items: InventoryItem[] }>("/inventory.php");
      setInventory(response.items);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Unable to load inventory.");
    }
  }

  useEffect(() => { void loadInventory(); }, []);

  const filtered = inventory.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.unit.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnits  = inventory.reduce((s, i) => s + i.quantity, 0);
  const lowCount    = inventory.filter((i) => i.quantity <= i.minStock).length;
  const totalValue  = inventory.reduce((s, i) => s + i.quantity * i.pricePerUnit, 0);

  async function saveItem(item: InventoryItem) {
    try {
      const response = await api<{ item: InventoryItem }>("/inventory.php", {
        method: "POST",
        body: JSON.stringify({ ...item, action: modal?.isNew ? "create" : "update" }),
      });
      setInventory((prev) => {
        const exists = prev.some((current) => current.id === response.item.id);
        return exists ? prev.map((current) => current.id === response.item.id ? response.item : current) : [response.item, ...prev];
      });
      setModal(null);
      setToast("Inventory saved.");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Unable to save inventory.");
    }
  }

  async function processSale(qty: number) {
    if (!saleItem) return;
    try {
      const response = await api<{ total: number }>("/sales.php", {
        method: "POST",
        body: JSON.stringify({ id: saleItem.id, quantity: qty }),
      });
      setToast(`Sold ${qty} × ${saleItem.name} — ₱${response.total.toLocaleString()}`);
      setSaleItem(null);
      await loadInventory();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Unable to process sale.");
    }
  }

  async function deleteItem() {
    if (deleteId === null) return;
    try {
      await api("/inventory.php", { method: "POST", body: JSON.stringify({ action: "delete", id: deleteId }) });
      setInventory((prev) => prev.filter((item) => item.id !== deleteId));
      setToast("Item deleted.");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Unable to delete item.");
    } finally {
      setDeleteId(null);
    }
  }

  const headerGrad = "linear-gradient(135deg, #00d4ff 0%, #0066cc 50%, #003380 100%)";

  return (
    <div className="min-h-screen" style={{ background: "#f0f5fb" }}>
      {/* Header */}
      <header className="sticky top-0 z-40" style={{ background: headerGrad, boxShadow: "0 2px 16px rgba(0,60,180,0.25)" }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }}>
              <WaveIcon size={20} />
            </div>
            <span className="text-white font-bold tracking-wide">RJane Water</span>
            <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)", fontFamily: "var(--font-mono)" }}>
              Inventory
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-white text-xs font-semibold">{user.name}</div>
              <div className="text-xs capitalize" style={{ color: "rgba(255,255,255,0.65)", fontFamily: "var(--font-mono)" }}>{user.role}</div>
            </div>
            <button
              onClick={onLogout}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer" }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Units",    value: totalUnits.toLocaleString(), sub: "in stock",     icon: "📦", alert: false },
            { label: "Product Types",  value: inventory.length,            sub: "categories",   icon: "🗂️", alert: false },
            { label: "Low / Critical", value: lowCount,                    sub: "need restock", icon: "⚠️", alert: lowCount > 0 },
            { label: "Stock Value",    value: `₱${totalValue.toLocaleString()}`, sub: "estimated", icon: "💰", alert: false },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-5"
              style={{
                background: s.alert ? "linear-gradient(135deg,#fff5f5,#ffe8e8)" : "white",
                border: s.alert ? "1px solid #f5c6c2" : "1px solid #e4eaf4",
                boxShadow: "0 2px 12px rgba(0,60,180,0.06)",
              }}
            >
              <div className="text-xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold mb-0.5" style={{ color: s.alert ? "#c0392b" : "#0a1a3a" }}>{s.value}</div>
              <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#8899bb" }}>{s.label}</div>
              <div className="text-xs mt-0.5" style={{ color: "#aab", fontFamily: "var(--font-mono)" }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-bold text-base" style={{ color: "#0a1a3a" }}>Inventory</h2>
            <p className="text-xs mt-0.5" style={{ color: "#8899bb" }}>{filtered.length} of {inventory.length} items</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2" style={{ color: "#aab" }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M10.5 9.5l3.5 3.5M7 12A5 5 0 107 2a5 5 0 000 10z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                  borderRadius: 10, border: "1px solid #dde3ed", background: "white",
                  fontSize: 13, outline: "none", color: "#333", width: 180,
                }}
              />
            </div>
            {user.role === "admin" && (
              <button
                onClick={() => setModal({ item: null, isNew: true })}
                className="px-4 py-2 text-sm font-bold rounded-xl whitespace-nowrap"
                style={{ background: "linear-gradient(135deg,#00d4ff,#0088cc)", color: "white", border: "none", cursor: "pointer", boxShadow: "0 3px 12px rgba(0,150,220,0.35)" }}
              >+ Add Item</button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ boxShadow: "0 2px 20px rgba(0,60,180,0.08)", border: "1px solid #e4eaf4" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: "collapse", background: "white" }}>
              <thead>
                <tr style={{ background: "linear-gradient(90deg,#f0f8ff,#e8f2ff)", borderBottom: "1px solid #dde8f5" }}>
                  {["#", "Product Name", "Unit", "Qty", "Min Stock", "Price", "Status", "Updated", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#6680aa" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-14 text-sm" style={{ color: "#aab" }}>
                      No items found.
                    </td>
                  </tr>
                )}
                {filtered.map((item, idx) => (
                  <tr
                    key={item.id}
                    style={{ borderBottom: "1px solid #f0f4fb", transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f7faff")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    <td className="px-4 py-3 text-xs" style={{ color: "#aab", fontFamily: "var(--font-mono)" }}>
                      {String(idx + 1).padStart(2, "0")}
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: "#0a1a3a" }}>{item.name}</td>
                    <td className="px-4 py-3 text-xs capitalize" style={{ color: "#8899bb", fontFamily: "var(--font-mono)" }}>{item.unit}</td>
                    <td className="px-4 py-3 font-bold" style={{ fontFamily: "var(--font-mono)", color: item.quantity <= item.minStock ? "#c0392b" : "#0a1a3a" }}>{item.quantity}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#aab", fontFamily: "var(--font-mono)" }}>{item.minStock}</td>
                    <td className="px-4 py-3 text-xs" style={{ fontFamily: "var(--font-mono)", color: "#334" }}>₱{item.pricePerUnit}</td>
                    <td className="px-4 py-3"><StatusBadge quantity={item.quantity} minStock={item.minStock} /></td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#aab", fontFamily: "var(--font-mono)" }}>{item.lastUpdated}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {user.role === "admin" ? (
                          <>
                            <button
                              onClick={() => setModal({ item, isNew: false })}
                              className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                              style={{ background: "#e8f4ff", color: "#0088cc", border: "1px solid #c8e4f8", cursor: "pointer" }}
                            >Edit</button>
                            <button
                              onClick={() => setDeleteId(item.id)}
                              className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                              style={{ background: "#fde8e8", color: "#c0392b", border: "1px solid #f5c6c2", cursor: "pointer" }}
                            >Delete</button>
                          </>
                        ) : (
                          <button
                            onClick={() => item.quantity > 0 && setSaleItem(item)}
                            disabled={item.quantity === 0}
                            className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                            style={{
                              background: item.quantity > 0 ? "linear-gradient(135deg,#e0f8ff,#c8ecfa)" : "#f0f0f0",
                              color: item.quantity > 0 ? "#007bb5" : "#bbb",
                              border: item.quantity > 0 ? "1px solid #a0d8ef" : "1px solid #ddd",
                              cursor: item.quantity > 0 ? "pointer" : "not-allowed",
                            }}
                          >Sell</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs mt-3 text-right" style={{ color: "#aab", fontFamily: "var(--font-mono)" }}>
          {user.role === "cashier" ? "Cashier — use Sell to process a sale and deduct stock." : "Admin — full inventory management."}
        </p>
      </main>

      {modal && <EditModal item={modal.item} isNew={modal.isNew} onSave={saveItem} onClose={() => setModal(null)} />}
      {deleteId !== null && (
        <DeleteModal
          onConfirm={() => { void deleteItem(); }}
          onClose={() => setDeleteId(null)}
        />
      )}
      {saleItem && (
        <SaleModal item={saleItem} onSell={processSale} onClose={() => setSaleItem(null)} />
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold text-white flex items-center gap-2 shadow-xl"
          style={{ background: "linear-gradient(135deg,#00d4ff,#0077bb)", whiteSpace: "nowrap", boxShadow: "0 4px 24px rgba(0,100,200,0.35)" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
            <path d="M13 4L6.5 11 3 7.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          {toast}
        </div>
      )}
    </div>
  );
}

/* ─── Root ──────────────────────────────────────────────────────────── */
export default function App() {
  const [view, setView] = useState<View>("login");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    void api<{ user: User }>("/auth.php")
      .then(({ user: sessionUser }) => { setUser(sessionUser); setView("dashboard"); })
      .catch(() => undefined);
  }, []);

  async function logout() {
    try { await api("/auth.php", { method: "POST", body: JSON.stringify({ action: "logout" }) }); }
    finally { setUser(null); setView("login"); }
  }

  if (view === "dashboard" && user) {
    return <Dashboard user={user} onLogout={() => { void logout(); }} />;
  }
  return <LoginPage onLogin={(u) => { setUser(u); setView("dashboard"); }} />;
}
