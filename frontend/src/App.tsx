import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { CSSProperties, ReactNode } from "react";
import { api, getApiToken, setApiToken } from "./api";
import ChatAssistant from "./components/ChatAssistant";
import "./pos.css";
import "./pos-viewport.css";

type User = {
  id: number;
  name: string;
  username: string;
  role: "admin" | "cashier";
};
type Product = {
  id: number;
  name: string;
  unit: string;
  stock: number;
  price: number;
  min_stock: number;
  status: string;
};
type Sale = {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  cashier_name: string;
  created_at: string;
  cash_received: number;
  change_due: number;
  payment_method: string;
};
type Stock = {
  id: number;
  product_name: string;
  quantity: number;
  stock_after: number;
  added_by: string;
  note: string;
  created_at: string;
};
const money = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    Number(value),
  );
const date = (value: string) =>
  new Date(
    value.includes("T") ? value : value.replace(" ", "T") + "+08:00",
  ).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
const isBottle = (product: Product) =>
  product.unit.toLowerCase().includes("500");
const label = (product: Product) =>
  isBottle(product) ? "500 mL bottle" : "Blue gallon";
const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Please try again.";

function Container({ bottle = false }: { bottle?: boolean }) {
  return (
    <svg
      className="container-art"
      viewBox="0 0 140 150"
      role="img"
      aria-label={
        bottle ? "500 mL plastic bottle" : "Standard blue gallon container"
      }
    >
      <ellipse cx="70" cy="139" rx={bottle ? 24 : 43} ry="6" fill="#dce7f4" />
      {bottle ? (
        <>
          <rect x="57" y="9" width="26" height="12" rx="3" fill="#2575d6" />
          <path
            d="M60 21h20v14c0 8 14 14 14 27v62q0 11-11 11H57q-11 0-11-11V62c0-13 14-19 14-27Z"
            fill="#ddf3ff"
            stroke="#88bedf"
            strokeWidth="2"
          />
          <path d="M48 75h44v46q0 11-10 11H58q-10 0-10-11Z" fill="#a9dcf7" />
          <path
            d="M52 66h36M51 111h38M51 117h38"
            stroke="#80bcdf"
            strokeWidth="2"
          />
          <rect x="47" y="79" width="46" height="26" rx="2" fill="#fff" />
          <text
            x="70"
            y="90"
            textAnchor="middle"
            fontSize="6"
            fill="#2364aa"
            fontWeight="bold"
          >
            PURIFIED
          </text>
          <text x="70" y="100" textAnchor="middle" fontSize="7" fill="#2364aa">
            500 mL
          </text>
          <path
            d="M57 43q-5 8-5 15"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <rect x="54" y="8" width="32" height="12" rx="3" fill="#153c9d" />
          <path
            d="M57 20h26v18q0 5 9 10l18 13q7 6 7 16v45q0 14-14 14H37q-14 0-14-14V77q0-10 7-16l18-13q9-5 9-10Z"
            fill="#347fd6"
            stroke="#1e5da9"
            strokeWidth="2"
          />
          <path
            d="M30 80h80M29 91h82M29 118h82"
            stroke="#205ba4"
            strokeWidth="4"
          />
          <rect x="34" y="95" width="72" height="20" rx="4" fill="#d9efff" />
          <text
            x="70"
            y="108"
            textAnchor="middle"
            fontSize="9"
            fill="#2059a2"
            fontWeight="bold"
          >
            PURIFIED WATER
          </text>
          <path
            d="M46 55q-13 7-15 18v42"
            stroke="#82bafa"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M86 48q17 1 17 17v13H91V64q0-5-8-5"
            fill="#eaf3fd"
            stroke="#205ba4"
            strokeWidth="2"
          />
        </>
      )}
    </svg>
  );
}

function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="login-shell">
      <div className="login-brand">
        <div className="brand-mark">RJ</div>
        <span>RJane Water Station</span>
        <h1>
          Fresh water.
          <br />
          Smooth service.
        </h1>
        <p>Your daily sales and inventory, in one place.</p>
        <Container />
      </div>
      <form
        className="login-form"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            const result = await api<{ token: string; user: User }>("/login", {
              method: "POST",
              body: JSON.stringify({ username, password }),
            });
            setApiToken(result.token);
            onLogin(result.user);
          } catch (error) {
            setError(errorMessage(error));
          } finally {
            setBusy(false);
          }
        }}
      >
        <span className="eyebrow">WATER REFILLING POS</span>
        <h2>Welcome back</h2>
        <p>Sign in to start your shift.</p>
        <label>
          Username
          <input
            autoFocus
            autoComplete="username"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <div className="login-password">
          <label htmlFor="login-password">Password</label>
          <div className="password-input-wrap">
            <input
              id="login-password"
              type={passwordVisible ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              className="password-toggle"
              type="button"
              aria-label={passwordVisible ? "Hide password" : "Show password"}
              aria-pressed={passwordVisible}
              aria-controls="login-password"
              disabled={busy}
              onClick={() => setPasswordVisible(visible => !visible)}
            >{passwordVisible ? "Hide" : "Show"}</button>
          </div>
        </div>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <button className="primary" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function ReceiptPreview({ children }: { children: ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);
  const paper = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const fit = () => {
      if (!frame.current || !paper.current) return;
      const width = paper.current.offsetWidth;
      const height = paper.current.offsetHeight;
      if (width && height)
        setScale(
          Math.min(
            1,
            frame.current.clientWidth / width,
            frame.current.clientHeight / height,
          ),
        );
    };
    const observer = new ResizeObserver(fit);
    if (frame.current) observer.observe(frame.current);
    if (paper.current) observer.observe(paper.current);
    fit();
    return () => observer.disconnect();
  }, []);
  return (
    <div className="receipt-preview" ref={frame}>
      <div
        className="receipt-preview-paper"
        ref={paper}
        style={{ transform: `translateX(-50%) scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [viewportHeight, setViewportHeight] = useState(
    () => window.visualViewport?.height ?? window.innerHeight,
  );
  useEffect(() => {
    const resize = () =>
      setViewportHeight(window.visualViewport?.height ?? window.innerHeight);
    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
    };
  }, []);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [summary, setSummary] = useState({ count: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [stockNotice, setStockNotice] = useState(false);
  const [offline, setOffline] = useState(false);
  const version = useRef<number | null>(null);
  const pollBusy = useRef(false);
  const refreshBusy = useRef(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [step, setStep] = useState<"select" | "payment" | "receipt">("select");
  const [cash, setCash] = useState("");
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [busy, setBusy] = useState(false);
  const checkoutKey = useRef("");
  const [restock, setRestock] = useState<Product | null>(null);
  const [stockQty, setStockQty] = useState("");
  const [stockNote, setStockNote] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [stockPage, setStockPage] = useState(1);
  const refresh = useCallback(async () => {
    if (refreshBusy.current) return;
    refreshBusy.current = true;
    setRefreshing(true);
    try {
      // Read the notification cursor first so a restock during refresh cannot be missed.
      const stockLog = await api<{ data: Stock[]; version: number }>("/stocks");
      const [inventory, transactions] = await Promise.all([
        api<{ data: Product[] }>("/products"),
        api<{ data: Sale[]; summary: { count: number; revenue: number } }>(
          "/sales",
        ),
      ]);
      setProducts(
        inventory.data.filter((product) => product.status === "available"),
      );
      setSales(transactions.data);
      setSummary(transactions.summary);
      setStocks(stockLog.data);
      version.current = stockLog.version;
      setStockNotice(false);
      setOffline(false);
      setError("");
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
      refreshBusy.current = false;
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    let active = true;
    const poll = async () => {
      if (pollBusy.current || refreshBusy.current) return;
      pollBusy.current = true;
      try {
        if (user.role === "admin") {
          await refresh();
        } else {
          const log = await api<{ version: number }>("/stocks");
          if (
            active &&
            version.current !== null &&
            log.version > version.current
          )
            setStockNotice(true);
          if (active) setOffline(false);
        }
      } catch {
        if (active) setOffline(true);
      } finally {
        pollBusy.current = false;
      }
    };
    const timer = window.setInterval(() => void poll(), 5000);
    const focus = () => void poll();
    window.addEventListener("focus", focus);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [refresh, user.role]);
  const product = products.find((item) => item.id === selected);
  const total = product
    ? (Math.round(Number(product.price) * 100) * quantity) / 100
    : 0;
  const cashCents = Math.round(Number(cash) * 100);
  const change = (cashCents - Math.round(total * 100)) / 100;
  const validQuantity =
    !!product &&
    Number.isInteger(quantity) &&
    quantity > 0 &&
    quantity <= product.stock;
  const validCash =
    cash.trim() !== "" &&
    /^\d+(\.\d{1,2})?$/.test(cash) &&
    Number(cash) <= 1000000 &&
    change >= 0;
  function reset() {
    setStep("select");
    setSelected(null);
    setQuantity(1);
    setCash("");
    setReceipt(null);
    checkoutKey.current = "";
    setError("");
  }
  async function pay() {
    if (!validQuantity || !validCash || busy || !product) return;
    setBusy(true);
    setError("");
    try {
      const result = await api<{ data: Sale; product: Product }>("/sales", {
        method: "POST",
        body: JSON.stringify({
          product_id: product.id,
          quantity,
          cash_received: Number(cash),
          payment_method: "cash",
          checkout_key: checkoutKey.current,
        }),
      });
      setReceipt(result.data);
      setProducts((items) =>
        items.map((item) =>
          item.id === result.product.id ? result.product : item,
        ),
      );
      setStep("receipt");
      void refresh();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function addStock(event: React.FormEvent) {
    event.preventDefault();
    if (!restock || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await api<{ product: Product; data: Stock }>("/stocks", {
        method: "POST",
        body: JSON.stringify({
          product_id: restock.id,
          quantity: Number(stockQty),
          note: stockNote,
        }),
      });
      setProducts((items) =>
        items.map((item) =>
          item.id === result.product.id ? result.product : item,
        ),
      );
      setStocks((items) => [result.data, ...items].slice(0, 100));
      setStockPage(1);
      setNotice(
        `${stockQty} ${label(restock).toLowerCase()} units added. Inventory updated.`,
      );
      setRestock(null);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  function transactionsTable() {
    return (
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Recent transactions</h3>
            <p>Cash sales · latest 100 records</p>
          </div>
          <span className="count-chip">{sales.length} records</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Container</th>
                <th>Qty</th>
                <th>Total</th>
                <th>Cashier</th>
                <th>Date / time</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sales
                .slice((historyPage - 1) * 10, historyPage * 10)
                .map((sale) => (
                  <tr key={sale.id}>
                    <td className="mono">
                      #{String(sale.id).padStart(6, "0")}
                    </td>
                    <td>
                      {sale.product_name.replace("Purified Water - ", "")}
                    </td>
                    <td>{sale.quantity}</td>
                    <td className="strong">{money(sale.total)}</td>
                    <td>{sale.cashier_name}</td>
                    <td>{date(sale.created_at)}</td>
                    <td>
                      <button
                        className="text-button"
                        onClick={() => {
                          setReceipt(sale);
                          setStep("receipt");
                        }}
                      >
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              {!sales.length && (
                <tr>
                  <td colSpan={7} className="empty">
                    No transactions yet. Completed sales will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>
            Page {historyPage} of {Math.max(1, Math.ceil(sales.length / 10))}
          </span>
          <button
            disabled={historyPage === 1}
            onClick={() => setHistoryPage((page) => page - 1)}
          >
            Previous
          </button>
          <button
            disabled={historyPage * 10 >= sales.length}
            onClick={() => setHistoryPage((page) => page + 1)}
          >
            Next
          </button>
        </div>
      </section>
    );
  }
  const receiptContent = receipt && (
    <div className="receipt-paper">
      <div className="receipt-brand">RJANE WATER STATION</div>
      <p>
        Purified drinking water
        <br />
        Cash sale receipt
      </p>
      <div className="receipt-rule" />
      <div className="receipt-row">
        <span>Receipt</span>
        <strong>#{String(receipt.id).padStart(6, "0")}</strong>
      </div>
      <div className="receipt-row">
        <span>Date</span>
        <span>{date(receipt.created_at)}</span>
      </div>
      <div className="receipt-row">
        <span>Cashier</span>
        <span>{receipt.cashier_name}</span>
      </div>
      <div className="receipt-rule" />
      <strong>{receipt.product_name}</strong>
      <div className="receipt-row">
        <span>
          {receipt.quantity} × {money(receipt.unit_price)}
        </span>
        <span>{money(receipt.total)}</span>
      </div>
      <div className="receipt-rule" />
      <div className="receipt-row receipt-total">
        <strong>TOTAL</strong>
        <strong>{money(receipt.total)}</strong>
      </div>
      <div className="receipt-row">
        <span>Cash received</span>
        <span>
          {receipt.cash_received == null
            ? "Not recorded"
            : money(receipt.cash_received)}
        </span>
      </div>
      <div className="receipt-row">
        <span>Change</span>
        <span>
          {receipt.change_due == null
            ? "Not recorded"
            : money(receipt.change_due)}
        </span>
      </div>
      <div className="receipt-rule" />
      <p>
        Thank you for choosing RJane!
        <br />
        Please come again.
      </p>
    </div>
  );
  return (
    <>
      <div
        className={`pos-app ${user.role === "cashier" ? "cashier-fullscreen" : ""}`}
        style={{ "--pos-height": `${viewportHeight}px` } as CSSProperties}
      >
        {user.role === "admin" && (
          <aside className="sidebar">
            <div className="side-brand">
              <div className="brand-mark">RJ</div>
              <div>
                RJane<span>Water Station</span>
              </div>
            </div>
            <div className="side-caption">WORKSPACE</div>
            <div className="nav-active">
              {user.role === "admin" ? "▦  Overview" : "▦  Point of sale"}
            </div>
            <div className="side-bottom">
              <div className="avatar">{user.name.charAt(0)}</div>
              <div>
                <strong>{user.name}</strong>
                <span>
                  {user.role === "admin" ? "Administrator" : "Cashier"}
                </span>
              </div>
              <button title="Sign out" onClick={onLogout}>
                ↪
              </button>
            </div>
          </aside>
        )}
        <div className="workspace">
          <header className="topbar">
            <span>
              RJane /{" "}
              <strong>
                {user.role === "admin"
                  ? "Inventory & sales"
                  : "Cashier terminal"}
              </strong>
            </span>
            <div className="terminal-controls">
              <span className="cash-badge">● Cash only</span>
              {user.role === "cashier" && (
                <>
                  <span>{user.name}</span>
                  <button disabled={busy} onClick={onLogout}>
                    Sign out
                  </button>
                </>
              )}
            </div>
          </header>
          <main className="main">
            <div className="page-heading">
              <div>
                <span className="eyebrow">
                  {user.role === "admin"
                    ? "STATION OVERVIEW"
                    : "LET’S SERVE FRESH WATER"}
                </span>
                <h1>
                  {user.role === "admin"
                    ? "Inventory dashboard"
                    : "Point of sale"}
                </h1>
                <p>
                  {user.role === "admin"
                    ? "Keep your containers stocked and your station moving."
                    : "Choose a container, collect cash, and print the receipt."}
                </p>
              </div>
              <button
                onClick={() => void refresh()}
                disabled={refreshing || busy}
              >
                {refreshing ? "Refreshing…" : "↻ Refresh"}
              </button>
            </div>
            {stockNotice && (
              <div className="stock-alert" role="status">
                <div>
                  <strong>New stocks have arrived</strong>
                  <p>
                    The admin added stock. Press Refresh to see the latest
                    available quantities before your next sale.
                  </p>
                </div>
                <button
                  className="primary"
                  disabled={refreshing || busy}
                  onClick={() => void refresh()}
                >
                  Refresh stocks
                </button>
              </div>
            )}
            {offline && (
              <div className="error" role="status">
                Stock notifications are offline. Use Refresh to reconnect before
                selling.
              </div>
            )}
            {error && (
              <div className="error" role="alert">
                {error}
              </div>
            )}
            {notice && (
              <div className="success" role="status">
                {notice}
                <button onClick={() => setNotice("")} aria-label="Dismiss">
                  ×
                </button>
              </div>
            )}
            {loading ? (
              <div className="panel empty">Loading your station…</div>
            ) : user.role === "admin" ? (
              <>
                <div className="dashboard-stats">
                  <div className="metric">
                    <span>Today’s revenue</span>
                    <strong>{money(summary.revenue)}</strong>
                    <small>Cash payments received</small>
                  </div>
                  <div className="metric">
                    <span>Transactions today</span>
                    <strong>{summary.count}</strong>
                    <small>Completed sales</small>
                  </div>
                  <div className="metric">
                    <span>Available containers</span>
                    <strong>
                      {products.reduce((sum, item) => sum + item.stock, 0)}
                    </strong>
                    <small>Across both container types</small>
                  </div>
                </div>
                <div className="section-title">
                  <h2>Purified water inventory</h2>
                  <span>2 container types</span>
                </div>
                <div className="inventory-cards">
                  {products.map((item) => (
                    <article className="inventory-card" key={item.id}>
                      <Container bottle={isBottle(item)} />
                      <div className="inventory-detail">
                        <span
                          className={`stock-tag ${item.stock <= item.min_stock ? "low" : ""}`}
                        >
                          {item.stock === 0
                            ? "Out of stock"
                            : item.stock <= item.min_stock
                              ? "Low stock"
                              : "In stock"}
                        </span>
                        <h3>{label(item)}</h3>
                        <p>{item.unit} · purified water</p>
                        <div className="stock-number">
                          {item.stock}
                          <span>units available</span>
                        </div>
                        <div className="inventory-footer">
                          <span>{money(item.price)} / unit</span>
                          <button
                            className="primary"
                            onClick={() => {
                              setRestock(item);
                              setStockQty("");
                              setStockNote("");
                              setError("");
                            }}
                          >
                            + Add stock
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                {transactionsTable()}
                <section className="panel stock-history">
                  <div className="panel-heading">
                    <div>
                      <h3>Recent stock additions</h3>
                      <p>
                        Every restock updates the inventory cards immediately.
                      </p>
                    </div>
                  </div>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Container</th>
                          <th>Added</th>
                          <th>Stock after</th>
                          <th>Added by</th>
                          <th>Note</th>
                          <th>Date / time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stocks
                          .slice((stockPage - 1) * 10, stockPage * 10)
                          .map((stock) => (
                            <tr key={stock.id}>
                              <td>
                                {stock.product_name.replace(
                                  "Purified Water - ",
                                  "",
                                )}
                              </td>
                              <td>
                                <span className="positive">
                                  +{stock.quantity}
                                </span>
                              </td>
                              <td>{stock.stock_after}</td>
                              <td>{stock.added_by}</td>
                              <td>{stock.note || "—"}</td>
                              <td>{date(stock.created_at)}</td>
                            </tr>
                          ))}
                        {!stocks.length && (
                          <tr>
                            <td colSpan={6} className="empty">
                              No stock additions yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="pagination">
                    <span>
                      Page {stockPage} of{" "}
                      {Math.max(1, Math.ceil(stocks.length / 10))}
                    </span>
                    <button
                      disabled={stockPage === 1}
                      onClick={() => setStockPage((page) => page - 1)}
                    >
                      Previous
                    </button>
                    <button
                      disabled={stockPage * 10 >= stocks.length}
                      onClick={() => setStockPage((page) => page + 1)}
                    >
                      Next
                    </button>
                  </div>
                </section>
              </>
            ) : (
              <>
                <div className="steps">
                  {["Choose container", "Cash payment", "Print receipt"].map(
                    (text, index) => (
                      <div
                        className={
                          (step === "select"
                            ? 0
                            : step === "payment"
                              ? 1
                              : 2) >= index
                            ? "current"
                            : ""
                        }
                        key={text}
                      >
                        <span>{index + 1}</span>
                        {text}
                      </div>
                    ),
                  )}
                </div>
                {step === "select" ? (
                  <div className="checkout-layout">
                    <section className="panel selection">
                      <div className="panel-heading">
                        <div>
                          <h2>Choose your container</h2>
                          <p>Fresh purified water, ready to go.</p>
                        </div>
                        <span className="count-chip">Purified only</span>
                      </div>
                      <div className="product-grid">
                        {products.map((item) => (
                          <button
                            className={`product-tile ${selected === item.id ? "selected" : ""}`}
                            key={item.id}
                            disabled={item.stock === 0}
                            onClick={() => {
                              setSelected(item.id);
                              setQuantity(1);
                              setError("");
                            }}
                          >
                            <span className="selection-dot">
                              {selected === item.id ? "✓" : ""}
                            </span>
                            <Container bottle={isBottle(item)} />
                            <h3>{label(item)}</h3>
                            <p>{item.unit}</p>
                            <strong>{money(item.price)}</strong>
                            <span
                              className={`stock-tag ${item.stock <= item.min_stock ? "low" : ""}`}
                            >
                              {item.stock} available
                            </span>
                          </button>
                        ))}
                      </div>
                    </section>
                    <section className="panel order">
                      <span className="eyebrow">CURRENT ORDER</span>
                      <h2>Order summary</h2>
                      {product ? (
                        <>
                          <div className="order-item">
                            <div>
                              <strong>{label(product)}</strong>
                              <p>
                                Purified water · {money(product.price)} each
                              </p>
                            </div>
                          </div>
                          <label>
                            Quantity
                            <div className="quantity-control">
                              <button
                                disabled={quantity <= 1}
                                onClick={() =>
                                  setQuantity((value) => value - 1)
                                }
                              >
                                −
                              </button>
                              <input
                                aria-label="Quantity"
                                type="number"
                                min="1"
                                max={product.stock}
                                step="1"
                                value={quantity}
                                onChange={(event) =>
                                  setQuantity(Number(event.target.value))
                                }
                              />
                              <button
                                disabled={quantity >= product.stock}
                                onClick={() =>
                                  setQuantity((value) => value + 1)
                                }
                              >
                                +
                              </button>
                            </div>
                          </label>
                          <p className="muted">
                            {product.stock} units available
                          </p>
                        </>
                      ) : (
                        <div className="order-empty">
                          Select a container to start an order.
                        </div>
                      )}
                      <div className="order-total">
                        <span>Total amount</span>
                        <strong>{money(total)}</strong>
                      </div>
                      <button
                        className="primary large"
                        disabled={!validQuantity}
                        onClick={() => {
                          checkoutKey.current = crypto.randomUUID();
                          setStep("payment");
                          setCash("");
                          setError("");
                        }}
                      >
                        Continue to payment →
                      </button>
                      <p className="cash-note">Cash payments only</p>
                    </section>
                  </div>
                ) : step === "payment" ? (
                  <div className="payment-layout">
                    <section className="panel payment">
                      <span className="eyebrow">STEP 2 / CASH PAYMENT</span>
                      <h2>Collect payment</h2>
                      <p>
                        {quantity} × {product ? label(product) : "Container"} ·
                        purified water
                      </p>
                      <div className="payment-total">
                        <span>Amount due</span>
                        <strong>{money(total)}</strong>
                      </div>
                      <label>
                        Cash received
                        <input
                          autoFocus
                          type="number"
                          min={total}
                          max="1000000"
                          step="0.01"
                          value={cash}
                          disabled={busy}
                          onChange={(event) => {
                            setCash(event.target.value);
                            checkoutKey.current = crypto.randomUUID();
                          }}
                          placeholder="0.00"
                        />
                      </label>
                      <div className="cash-shortcuts">
                        {[
                          ...new Set(
                            [total, 50, 100, 200, 500, 1000].filter(
                              (amount) => amount >= total,
                            ),
                          ),
                        ].map((amount) => (
                          <button
                            key={amount}
                            disabled={busy}
                            onClick={() => {
                              setCash(String(amount));
                              checkoutKey.current = crypto.randomUUID();
                            }}
                          >
                            {amount === total ? "Exact" : money(amount)}
                          </button>
                        ))}
                      </div>
                      <div className="change-row">
                        <span>Change to return</span>
                        <strong>{validCash ? money(change) : "—"}</strong>
                      </div>
                      {cash && !validCash && (
                        <p className="payment-hint">
                          Enter enough cash to cover the total, with up to two
                          decimal places.
                        </p>
                      )}
                      <button
                        className="primary large"
                        disabled={!validQuantity || !validCash || busy}
                        onClick={() => void pay()}
                      >
                        {busy ? "Completing sale…" : "Complete cash sale"}
                      </button>
                      <button
                        className="text-button"
                        disabled={busy}
                        onClick={() => {
                          setStep("select");
                          setError("");
                        }}
                      >
                        ← Back to container selection
                      </button>
                    </section>
                    <div className="payment-aside">
                      <div className="cash-symbol">₱</div>
                      <h2>Simple. Cash. Done.</h2>
                      <p>
                        Count the cash received, return the change, then hand
                        the customer their receipt.
                      </p>
                      <div className="payment-tip">
                        Stock is deducted only after the payment is confirmed.
                      </div>
                    </div>
                  </div>
                ) : (
                  <section className="receipt-view">
                    <div className="receipt-status">✓</div>
                    <h2>Sale complete</h2>
                    <p>Return the change and print your customer’s receipt.</p>
                    <ReceiptPreview>{receiptContent}</ReceiptPreview>
                    <div className="receipt-actions">
                      <button
                        className="primary"
                        onClick={() => window.print()}
                      >
                        Print receipt
                      </button>
                      <button onClick={reset}>New sale</button>
                    </div>
                  </section>
                )}
              </>
            )}
          </main>
          <footer className="app-footer">
            RJane Water Station <span>Purified water · cash payments</span>
          </footer>
        </div>
        {restock && (
          <div className="modal-backdrop">
            <form
              className="stock-modal panel"
              onSubmit={(event) => void addStock(event)}
            >
              <div className="panel-heading">
                <h2>Add stock</h2>
                <button
                  type="button"
                  disabled={busy}
                  aria-label="Close"
                  onClick={() => {
                    setRestock(null);
                    setError("");
                  }}
                >
                  ×
                </button>
              </div>
              <p>
                {label(restock)} · {restock.stock} currently available
              </p>
              <label>
                Units to add
                <input
                  autoFocus
                  required
                  type="number"
                  min="1"
                  max="100000"
                  step="1"
                  value={stockQty}
                  onChange={(event) => setStockQty(event.target.value)}
                />
              </label>
              <label>
                Note (optional)
                <input
                  maxLength={255}
                  value={stockNote}
                  onChange={(event) => setStockNote(event.target.value)}
                  placeholder="e.g. Morning refill batch"
                />
              </label>
              <div className="restock-preview">
                New stock:{" "}
                <strong>{restock.stock + (Number(stockQty) || 0)} units</strong>
              </div>
              {error && (
                <div className="error" role="alert">
                  {error}
                </div>
              )}
              <button
                className="primary large"
                disabled={
                  busy ||
                  !Number.isInteger(Number(stockQty)) ||
                  Number(stockQty) < 1
                }
              >
                {busy ? "Adding stock…" : "Confirm stock addition"}
              </button>
            </form>
          </div>
        )}
        <ChatAssistant key={user.id} />
      </div>
      <div className="print-only">{receiptContent}</div>
      {user.role === "admin" && step === "receipt" && receipt && (
        <div className="modal-backdrop receipt-modal">
          <div className="panel">
            <button className="text-button" onClick={reset}>
              ← Close receipt
            </button>
            {receiptContent}
            <button className="primary large" onClick={() => window.print()}>
              Print receipt
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(Boolean(getApiToken()));
  useEffect(() => {
    if (!getApiToken()) return;
    api<{ user: User }>("/me")
      .then((result) => setUser(result.user))
      .catch(() => setApiToken(null))
      .finally(() => setChecking(false));
  }, []);
  async function logout() {
    try {
      await api("/logout", { method: "POST" });
    } catch {
      /* Clear local session even if the server is offline. */
    }
    setApiToken(null);
    setUser(null);
  }
  if (checking) return <div className="empty">Loading your station…</div>;
  return user ? (
    <Dashboard user={user} onLogout={() => void logout()} />
  ) : (
    <Login onLogin={setUser} />
  );
}
