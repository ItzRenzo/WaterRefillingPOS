import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Crypto from "expo-crypto";
import { api, isUnauthorized, restoreApiToken, setApiToken } from "@/api";
import ChatAssistant from "@/components/chat-assistant";
import WaterContainer from "@/components/water-container";
import {
  date,
  isBottle,
  label,
  message,
  money,
  receiptNumber,
  type Product,
  type Sale,
  type Stock,
  type User,
} from "@/lib/pos";
import { printReceipt } from "@/lib/receipt";
import { s, C } from "@/styles/pos";

type Summary = { count: number; revenue: number };
function Button({
  title,
  onPress,
  disabled = false,
  busy = false,
  secondary = false,
  small = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  secondary?: boolean;
  small?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondaryButton,
        small && s.smallButton,
        (disabled || busy) && s.disabled,
        pressed && s.pressed,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={secondary ? C.blue : "white"} />
      ) : (
        <Text style={[s.buttonText, secondary && s.secondaryText]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
function Field({
  title,
  value,
  onChange,
  secure = false,
  numeric = false,
  disabled = false,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  secure?: boolean;
  numeric?: boolean;
  disabled?: boolean;
}) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{title}</Text>
      <View style={s.passwordField}>
      <TextInput
        accessibilityLabel={title}
        value={value}
        onChangeText={onChange}
        editable={!disabled}
        secureTextEntry={secure && !passwordVisible}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={numeric ? "decimal-pad" : "default"}
        style={[s.input, s.passwordInput, secure && s.passwordSpacing]}
      />
      {secure && <Pressable
        accessibilityRole="button"
        accessibilityLabel={passwordVisible ? "Hide password" : "Show password"}
        accessibilityState={{ selected: passwordVisible, disabled }}
        disabled={disabled}
        onPress={() => setPasswordVisible(visible => !visible)}
        style={[s.passwordToggle, disabled && s.disabled]}
      ><Text style={s.passwordToggleText}>{passwordVisible ? "Hide" : "Show"}</Text></Pressable>}
      </View>
    </View>
  );
}
function Login({
  onLogin,
}: {
  onLogin: (user: User, token: string) => Promise<void>;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function signIn() {
    if (!username.trim() || !password || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await api<{ user: User; token: string }>("/login", {
        method: "POST",
        body: JSON.stringify({
          username: username.trim(),
          password,
          device_name: `mobile-${Platform.OS}`,
        }),
      });
      await onLogin(result.user, result.token);
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <SafeAreaView style={s.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.loginScroll}
        >
          <View style={s.loginCard}>
            <View style={s.brandMark}>
              <Text style={s.brandLetters}>RJ</Text>
            </View>
            <Text style={s.loginBrand}>RJane Water Station</Text>
            <Text style={s.eyebrow}>WATER REFILLING POS</Text>
            <Text style={s.loginTitle}>Welcome back</Text>
            <Text style={s.subtitle}>Sign in to start your shift.</Text>
            <Field
              title="Username"
              value={username}
              onChange={setUsername}
              disabled={busy}
            />
            <Field
              title="Password"
              value={password}
              onChange={setPassword}
              secure
              disabled={busy}
            />
            {error ? (
              <Text style={s.errorText} accessibilityRole="alert">
                {error}
              </Text>
            ) : null}
            <Button
              title="Sign in"
              onPress={() => void signIn()}
              busy={busy}
              disabled={!username.trim() || !password}
            />
            <Text style={s.loginFooter}>Fresh water. Smooth service.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
function Receipt({ sale }: { sale: Sale }) {
  const row = (name: string, value: string, total = false) => (
    <View style={s.receiptRow}>
      <Text style={[s.receiptText, total && s.receiptTotal]}>{name}</Text>
      <Text style={[s.receiptText, total && s.receiptTotal]}>{value}</Text>
    </View>
  );
  return (
    <View style={s.receiptPaper}>
      <Text style={s.receiptBrand}>RJANE WATER STATION</Text>
      <Text style={s.receiptCenter}>
        Purified drinking water · Cash receipt
      </Text>
      <View style={s.receiptRule} />
      {row("Receipt", receiptNumber(sale))}
      {row("Date", date(sale.created_at))}
      {row("Cashier", sale.cashier_name)}
      <View style={s.receiptRule} />
      <Text style={[s.receiptText, s.bold]}>{sale.product_name}</Text>
      {row(`${sale.quantity} × ${money(sale.unit_price)}`, money(sale.total))}
      <View style={s.receiptRule} />
      {row("TOTAL", money(sale.total), true)}
      {row(
        "Cash received",
        sale.cash_received == null ? "Not recorded" : money(sale.cash_received),
      )}
      {row(
        "Change",
        sale.change_due == null ? "Not recorded" : money(sale.change_due),
      )}
      <View style={s.receiptRule} />
      <Text style={s.receiptCenter}>Thank you for choosing RJane!</Text>
    </View>
  );
}
function ReceiptPreview({ sale }: { sale: Sale }) {
  const [frame, setFrame] = useState({ width: 300, height: 350 });
  const [paperHeight, setPaperHeight] = useState(350);
  const scale = Math.min(1, frame.width / 300, frame.height / paperHeight);
  return (
    <View
      style={s.receiptPreview}
      onLayout={(event) => setFrame(event.nativeEvent.layout)}
    >
      <View
        onLayout={(event) => setPaperHeight(event.nativeEvent.layout.height)}
        style={[
          s.receiptPosition,
          { transform: [{ scale }], transformOrigin: "top center" },
        ]}
      >
        <Receipt sale={sale} />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const wide = width >= 650 && width > height;
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [summary, setSummary] = useState<Summary>({ count: 0, revenue: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [newStock, setNewStock] = useState(false);
  const [offline, setOffline] = useState(false);
  const stockVersion = useRef<number | null>(null);
  const refreshLock = useRef(false);
  const operationLock = useRef(false);
  const pollLock = useRef(false);
  const [step, setStep] = useState<"select" | "payment" | "receipt">("select");
  const [selected, setSelected] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [cash, setCash] = useState("");
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [busy, setBusy] = useState(false);
  const checkout = useRef({ payload: "", key: "" });
  const [contentHeight, setContentHeight] = useState(height - 170);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const shown = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true),
    );
    const hidden = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false),
    );
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);
  const [restock, setRestock] = useState<Product | null>(null);
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockNote, setStockNote] = useState("");
  const [salePage, setSalePage] = useState(1);
  const [stockPage, setStockPage] = useState(1);
  const [printing, setPrinting] = useState(false);
  const compact = contentHeight < 390;
  const tiny = contentHeight < 260;
  const clearSession = useCallback(async () => {
    await setApiToken(null);
    setUser(null);
    setToken(null);
    setProducts([]);
    setSales([]);
    setStocks([]);
    stockVersion.current = null;
    setReceipt(null);
    setStep("select");
    setSelected(null);
    setError("");
    setNewStock(false);
  }, []);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const saved = await restoreApiToken();
        if (!saved) return;
        const result = await api<{ user: User }>("/me", {}, saved);
        if (active) {
          setUser(result.user);
          setToken(saved);
        }
      } catch (error) {
        if (isUnauthorized(error)) await setApiToken(null);
      } finally {
        if (active) setChecking(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  const refresh = useCallback(
    async (silent = false) => {
      if (!token || refreshLock.current) return;
      refreshLock.current = true;
      if (!silent) setLoading(true);
      try {
        const log = await api<{ data: Stock[]; version: number }>(
          "/stocks",
          {},
          token,
        );
        const [inventory, transactions] = await Promise.all([
          api<{ data: Product[] }>("/products", {}, token),
          api<{ data: Sale[]; summary: Summary }>("/sales", {}, token),
        ]);
        setProducts(
          inventory.data
            .filter((item) => item.status === "available")
            .sort((a, b) => Number(isBottle(a)) - Number(isBottle(b))),
        );
        setSales(transactions.data);
        setSummary(transactions.summary);
        setStocks(log.data);
        stockVersion.current = log.version;
        setNewStock(false);
        setOffline(false);
        if (!silent) {
          setError("");
          setNotice("");
        }
      } catch (error) {
        if (isUnauthorized(error)) await clearSession();
        else {
          setOffline(true);
          if (!silent) setError(message(error));
        }
      } finally {
        refreshLock.current = false;
        if (!silent) setLoading(false);
      }
    },
    [token, clearSession],
  );
  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timer);
  }, [refresh]);
  useEffect(() => {
    if (!token || !user) return;
    let active = true;
    const poll = async () => {
      if (
        pollLock.current ||
        refreshLock.current ||
        operationLock.current ||
        AppState.currentState === "background"
      )
        return;
      pollLock.current = true;
      try {
        if (user.role === "admin") await refresh(true);
        else {
          const log = await api<{ version: number }>("/stocks", {}, token);
          if (
            active &&
            stockVersion.current !== null &&
            log.version > stockVersion.current
          )
            setNewStock(true);
          if (active) setOffline(false);
        }
      } catch (error) {
        if (isUnauthorized(error)) await clearSession();
        else if (active) setOffline(true);
      } finally {
        pollLock.current = false;
      }
    };
    const timer = setInterval(() => void poll(), 5000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void poll();
    });
    return () => {
      active = false;
      clearInterval(timer);
      subscription.remove();
    };
  }, [token, user, refresh, clearSession]);
  async function login(account: User, authToken: string) {
    await setApiToken(authToken);
    setUser(account);
    setToken(authToken);
  }
  async function logout() {
    if (operationLock.current) return;
    try {
      await api("/logout", { method: "POST" }, token);
    } catch {
      /* Local logout is always available. */
    }
    await clearSession();
  }
  const product = products.find((item) => item.id === selected);
  const total = product
    ? (Math.round(Number(product.price) * 100) * quantity) / 100
    : 0;
  const validQuantity =
    !!product &&
    Number.isInteger(quantity) &&
    quantity > 0 &&
    quantity <= product.stock;
  const change =
    (Math.round(Number(cash) * 100) - Math.round(total * 100)) / 100;
  const validCash =
    /^\d+(\.\d{1,2})?$/.test(cash) && Number(cash) <= 1000000 && change >= 0;
  function reset() {
    Keyboard.dismiss();
    setStep("select");
    setSelected(null);
    setQuantity(1);
    setCash("");
    setReceipt(null);
    checkout.current = { payload: "", key: "" };
    setError("");
  }
  async function pay() {
    if (!product || !validQuantity || !validCash || operationLock.current)
      return;
    operationLock.current = true;
    setBusy(true);
    setError("");
    Keyboard.dismiss();
    try {
      const payload = `${product.id}:${quantity}:${Number(cash)}`;
      if (checkout.current.payload !== payload)
        checkout.current = { payload, key: Crypto.randomUUID() };
      const result = await api<{ data: Sale; product: Product }>(
        "/sales",
        {
          method: "POST",
          body: JSON.stringify({
            product_id: product.id,
            quantity,
            cash_received: Number(cash),
            payment_method: "cash",
            checkout_key: checkout.current.key,
          }),
        },
        token,
      );
      setReceipt(result.data);
      setProducts((items) =>
        items.map((item) =>
          item.id === result.product.id ? result.product : item,
        ),
      );
      setStep("receipt");
      void refresh(true);
    } catch (error) {
      if (isUnauthorized(error)) await clearSession();
      else setError(message(error));
    } finally {
      operationLock.current = false;
      setBusy(false);
    }
  }
  async function addStock() {
    if (
      !restock ||
      operationLock.current ||
      !Number.isInteger(Number(stockQuantity)) ||
      Number(stockQuantity) < 1
    )
      return;
    operationLock.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await api<{ product: Product; data: Stock }>(
        "/stocks",
        {
          method: "POST",
          body: JSON.stringify({
            product_id: restock.id,
            quantity: Number(stockQuantity),
            note: stockNote,
          }),
        },
        token,
      );
      setProducts((items) =>
        items.map((item) =>
          item.id === result.product.id ? result.product : item,
        ),
      );
      setStocks((items) => [result.data, ...items].slice(0, 100));
      setStockPage(1);
      setNotice(`${stockQuantity} units added. Inventory updated.`);
      setRestock(null);
      Keyboard.dismiss();
    } catch (error) {
      if (isUnauthorized(error)) await clearSession();
      else setError(message(error));
    } finally {
      operationLock.current = false;
      setBusy(false);
    }
  }
  async function print(sale: Sale) {
    if (printing) return;
    setPrinting(true);
    try {
      await printReceipt(sale);
    } catch (error) {
      setError(message(error));
    } finally {
      setPrinting(false);
    }
  }
  function pagination(
    page: number,
    count: number,
    setPage: (page: number) => void,
  ) {
    return (
      <View style={s.pagination}>
        <Text style={s.muted}>
          Page {page} / {Math.max(1, Math.ceil(count / 10))}
        </Text>
        <View style={s.row}>
          <Button
            title="Previous"
            secondary
            small
            disabled={page === 1}
            onPress={() => setPage(page - 1)}
          />
          <Button
            title="Next"
            secondary
            small
            disabled={page * 10 >= count}
            onPress={() => setPage(page + 1)}
          />
        </View>
      </View>
    );
  }
  if (checking)
    return (
      <SafeAreaView style={s.loading}>
        <ActivityIndicator color={C.blue} />
      </SafeAreaView>
    );
  if (!user) return <Login onLogin={login} />;
  const cashier = user.role === "cashier";
  return (
    <SafeAreaView style={s.screen} edges={["top", "bottom", "left", "right"]}>
      <StatusBar style="dark" />
      <View style={s.topbar}>
        <View style={s.smallBrand}>
          <Text style={s.smallBrandLetters}>RJ</Text>
        </View>
        <View style={s.flex}>
          <Text style={s.brandName}>RJane Water Station</Text>
          <Text style={s.headerCaption}>
            {cashier ? "Cashier terminal" : "Inventory & sales"} · {user.name}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh stocks"
          disabled={loading || busy}
          onPress={() => void refresh()}
          style={s.headerButton}
        >
          {loading ? (
            <ActivityIndicator size="small" color={C.blue} />
          ) : (
            <Text style={s.headerIcon}>↻</Text>
          )}
        </Pressable>
        <ChatAssistant key={user.id} compact onUnauthorized={clearSession} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          disabled={busy}
          onPress={() => void logout()}
          style={s.headerButton}
        >
          <Text style={s.headerIcon}>↪</Text>
        </Pressable>
      </View>
      {cashier ? (
        <KeyboardAvoidingView
          style={s.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={[s.cashierMain, wide && s.landscapeMain]}>
            <View style={[s.cashierHeading, keyboardVisible && s.hidden]}>
              <Text style={s.pageTitle}>Point of sale</Text>
              <Text style={s.cashBadge}>● Cash only</Text>
            </View>
            <View style={[s.steps, keyboardVisible && s.hidden]}>
              {["Container", "Cash payment", "Receipt"].map((title, index) => (
                <View key={title} style={s.step}>
                  <View
                    style={[
                      s.stepNumber,
                      (step === "select" ? 0 : step === "payment" ? 1 : 2) >=
                        index && s.activeStep,
                    ]}
                  >
                    <Text
                      style={[
                        s.stepDigit,
                        (step === "select" ? 0 : step === "payment" ? 1 : 2) >=
                          index && s.activeStepDigit,
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={s.stepTitle}>{title}</Text>
                </View>
              ))}
            </View>
            <View
              style={s.checkoutContent}
              onLayout={(event) =>
                setContentHeight(event.nativeEvent.layout.height)
              }
            >
              {loading && !products.length ? (
                <View style={s.center}>
                  <ActivityIndicator color={C.blue} />
                  <Text style={s.subtitle}>Loading your station…</Text>
                </View>
              ) : step === "select" ? (
                <View style={[s.checkout, wide && s.checkoutWide]}>
                  <View style={[s.panel, s.selection]}>
                    {!tiny && (
                      <Text style={s.panelTitle}>Choose your container</Text>
                    )}
                    <View style={s.productGrid}>
                      {products.map((item) => (
                        <Pressable
                          key={item.id}
                          accessibilityRole="button"
                          accessibilityLabel={`${label(item)}, ${money(item.price)}, ${item.stock} available`}
                          accessibilityState={{
                            selected: selected === item.id,
                            disabled: item.stock === 0,
                          }}
                          disabled={item.stock === 0}
                          onPress={() => {
                            setSelected(item.id);
                            setQuantity(1);
                            setError("");
                          }}
                          style={({ pressed }) => [
                            s.productTile,
                            selected === item.id && s.selectedTile,
                            item.stock === 0 && s.disabled,
                            pressed && s.pressed,
                          ]}
                        >
                          <View
                            style={[
                              s.selectionDot,
                              selected === item.id && s.selectedDot,
                            ]}
                          >
                            <Text style={s.selectedCheck}>
                              {selected === item.id ? "✓" : ""}
                            </Text>
                          </View>
                          {!tiny && (
                            <WaterContainer
                              bottle={isBottle(item)}
                              size={Math.min(
                                wide ? 90 : 125,
                                Math.max(
                                  36,
                                  (contentHeight - (wide ? 130 : 260)) * 0.4,
                                ),
                              )}
                            />
                          )}
                          <Text style={s.productTitle}>{label(item)}</Text>
                          {!compact && (
                            <Text style={s.productUnit}>{item.unit}</Text>
                          )}
                          <Text style={s.productPrice}>
                            {money(item.price)}
                          </Text>
                          <Text
                            style={[
                              s.stockBadge,
                              item.stock <= item.min_stock && s.lowStock,
                            ]}
                          >
                            {item.stock} available
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                  <View style={[s.panel, s.order, wide && s.orderWide]}>
                    {product ? (
                      <>
                        <Text style={s.orderProduct}>
                          {label(product)} · purified water
                        </Text>
                        <View style={s.orderDetails}>
                          <View style={s.quantityBox}>
                            <Text style={s.muted}>Quantity</Text>
                            <View style={s.stepper}>
                              <Button
                                title="−"
                                secondary
                                small
                                disabled={quantity <= 1 || busy}
                                onPress={() =>
                                  setQuantity((value) => value - 1)
                                }
                              />
                              <View style={s.quantityInput}>
                                <Text
                                  accessibilityLabel={`Quantity: ${quantity}`}
                                  style={s.quantityValue}
                                >
                                  {quantity}
                                </Text>
                              </View>
                              <Button
                                title="+"
                                secondary
                                small
                                disabled={quantity >= product.stock || busy}
                                onPress={() =>
                                  setQuantity((value) => value + 1)
                                }
                              />
                            </View>
                          </View>
                          <View style={s.totalBox}>
                            <Text style={s.muted}>Total amount</Text>
                            <Text style={s.orderAmount}>{money(total)}</Text>
                          </View>
                        </View>
                      </>
                    ) : (
                      <View style={s.emptyOrder}>
                        <Text style={s.subtitle}>
                          Select a container to start an order.
                        </Text>
                        <Text style={s.orderAmount}>{money(0)}</Text>
                      </View>
                    )}
                    <Button
                      title="Continue to payment →"
                      disabled={!validQuantity}
                      onPress={() => {
                        Keyboard.dismiss();
                        setStep("payment");
                        setCash("");
                        setError("");
                      }}
                    />
                  </View>
                </View>
              ) : step === "payment" ? (
                <View
                  style={[
                    s.panel,
                    s.payment,
                    wide && s.paymentWide,
                    tiny && s.tinyPayment,
                  ]}
                >
                  {!tiny && (
                    <>
                      <Text style={s.panelTitle}>Collect payment</Text>
                      <Text style={s.subtitle}>
                        {quantity} × {product ? label(product) : "Container"} ·
                        purified water
                      </Text>
                    </>
                  )}
                  <View style={[s.paymentAmount, compact && s.compactAmount]}>
                    <Text style={s.amountLabel}>Amount due</Text>
                    <Text style={[s.amountDue, compact && s.compactDue]}>
                      {money(total)}
                    </Text>
                  </View>
                  <View style={[s.field, tiny && s.tinyField]}>
                    <Text style={s.fieldLabel}>Cash received</Text>
                    <TextInput
                      accessibilityLabel="Cash received"
                      keyboardType="decimal-pad"
                      value={cash}
                      onChangeText={setCash}
                      editable={!busy}
                      style={[s.input, s.cashInput, tiny && s.tinyInput]}
                      placeholder="0.00"
                      placeholderTextColor={C.muted}
                    />
                  </View>
                  {!compact && (
                    <View style={s.cashShortcuts}>
                      {[
                        ...new Set(
                          [total, 50, 100, 200, 500, 1000].filter(
                            (amount) => amount >= total,
                          ),
                        ),
                      ].map((amount) => (
                        <View style={s.shortcut} key={amount}>
                          <Button
                            title={amount === total ? "Exact" : money(amount)}
                            secondary
                            small
                            disabled={busy}
                            onPress={() => {
                              Keyboard.dismiss();
                              setCash(String(amount));
                            }}
                          />
                        </View>
                      ))}
                    </View>
                  )}
                  <View style={s.changeRow}>
                    <Text style={s.subtitle}>Change to return</Text>
                    <Text style={[s.changeAmount, tiny && s.tinyChange]}>
                      {validCash ? money(change) : "—"}
                    </Text>
                  </View>
                  {cash && !validCash && !tiny ? (
                    <Text style={s.paymentHint}>
                      Enter enough cash to cover the total (up to 2 decimal
                      places).
                    </Text>
                  ) : null}
                  <Button
                    title="Complete cash sale"
                    busy={busy}
                    disabled={!validQuantity || !validCash}
                    onPress={() => void pay()}
                  />
                  <Pressable
                    accessibilityRole="button"
                    disabled={busy}
                    onPress={() => {
                      Keyboard.dismiss();
                      setStep("select");
                      setError("");
                    }}
                    style={[s.backButton, tiny && s.tinyBack]}
                  >
                    <Text style={s.link}>← Back to container selection</Text>
                  </Pressable>
                </View>
              ) : receipt ? (
                <View style={s.receiptScreen}>
                  <Text style={s.saleComplete}>✓ Sale complete</Text>
                  {!compact && (
                    <Text style={s.subtitle}>
                      Return the change and print the customer’s receipt.
                    </Text>
                  )}
                  <ReceiptPreview sale={receipt} />
                  <View style={s.receiptActions}>
                    <View style={s.flex}>
                      <Button
                        title="Print receipt"
                        busy={printing}
                        onPress={() => void print(receipt)}
                      />
                    </View>
                    <View style={s.flex}>
                      <Button
                        title="New sale"
                        secondary
                        disabled={printing}
                        onPress={reset}
                      />
                    </View>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <ScrollView
          style={s.flex}
          contentContainerStyle={s.adminMain}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => void refresh()}
              tintColor={C.blue}
            />
          }
        >
          <Text style={s.eyebrow}>STATION OVERVIEW</Text>
          <Text style={s.pageTitle}>Inventory dashboard</Text>
          <Text style={s.subtitle}>
            Keep your containers stocked and your station moving.
          </Text>
          <View style={s.metrics}>
            <View style={[s.panel, s.metric]}>
              <Text style={s.muted}>Today’s revenue</Text>
              <Text style={s.metricValue}>{money(summary.revenue)}</Text>
              <Text style={s.metricCaption}>Cash payments received</Text>
            </View>
            <View style={[s.panel, s.metric]}>
              <Text style={s.muted}>Transactions today</Text>
              <Text style={s.metricValue}>{summary.count}</Text>
              <Text style={s.metricCaption}>Completed sales</Text>
            </View>
          </View>
          <Text style={s.sectionTitle}>Purified water inventory</Text>
          <View style={[s.inventoryCards, width >= 700 && s.inventoryWide]}>
            {products.map((item) => (
              <View key={item.id} style={[s.panel, s.inventoryCard]}>
                <WaterContainer bottle={isBottle(item)} size={90} />
                <View style={s.inventoryDetail}>
                  <Text
                    style={[
                      s.stockBadge,
                      item.stock <= item.min_stock && s.lowStock,
                    ]}
                  >
                    {item.stock === 0
                      ? "Out of stock"
                      : item.stock <= item.min_stock
                        ? "Low stock"
                        : "In stock"}
                  </Text>
                  <Text style={s.inventoryTitle}>{label(item)}</Text>
                  <Text style={s.productUnit}>
                    {item.unit} · purified water
                  </Text>
                  <View style={s.stockValueRow}>
                    <Text style={s.stockValue}>{item.stock}</Text>
                    <Text style={s.muted}>units available</Text>
                  </View>
                  <View style={s.inventoryFooter}>
                    <Text style={s.priceLabel}>{money(item.price)} / unit</Text>
                    <Button
                      title="+ Add stock"
                      small
                      onPress={() => {
                        setRestock(item);
                        setStockQuantity("");
                        setStockNote("");
                        setError("");
                      }}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
          <View style={s.panel}>
            <View style={s.tableHeading}>
              <Text style={s.panelTitle}>Recent transactions</Text>
              <Text style={s.subtitle}>Cash sales · latest 100 records</Text>
            </View>
            <View style={s.tableLabels}>
              <Text style={[s.tableLabel, s.flex]}>RECEIPT / CONTAINER</Text>
              <Text style={s.tableLabel}>TOTAL</Text>
            </View>
            {sales.slice((salePage - 1) * 10, salePage * 10).map((sale) => (
              <Pressable
                key={sale.id}
                accessibilityRole="button"
                accessibilityLabel={`View receipt ${receiptNumber(sale)}`}
                onPress={() => setReceipt(sale)}
                style={({ pressed }) => [s.tableRow, pressed && s.pressed]}
              >
                <View style={s.flex}>
                  <Text style={s.transactionTitle}>
                    {receiptNumber(sale)} ·{" "}
                    {sale.product_name.replace("Purified Water - ", "")}
                  </Text>
                  <Text style={s.transactionMeta}>
                    {sale.quantity} units · {sale.cashier_name} ·{" "}
                    {date(sale.created_at)}
                  </Text>
                </View>
                <View>
                  <Text style={s.transactionTotal}>{money(sale.total)}</Text>
                  <Text style={s.receiptLink}>Receipt →</Text>
                </View>
              </Pressable>
            ))}
            {!sales.length && (
              <Text style={s.tableEmpty}>No transactions yet.</Text>
            )}
            {pagination(salePage, sales.length, setSalePage)}
          </View>
          <View style={s.panel}>
            <View style={s.tableHeading}>
              <Text style={s.panelTitle}>Recent stock additions</Text>
              <Text style={s.subtitle}>
                Inventory cards update immediately.
              </Text>
            </View>
            <View style={s.tableLabels}>
              <Text style={[s.tableLabel, s.flex]}>CONTAINER / ADDED BY</Text>
              <Text style={s.tableLabel}>ADDED / STOCK AFTER</Text>
            </View>
            {stocks.slice((stockPage - 1) * 10, stockPage * 10).map((stock) => (
              <View key={stock.id} style={s.tableRow}>
                <View style={s.flex}>
                  <Text style={s.transactionTitle}>
                    {stock.product_name.replace("Purified Water - ", "")}
                  </Text>
                  <Text style={s.transactionMeta}>
                    {stock.added_by} · {date(stock.created_at)}
                  </Text>
                  {stock.note ? (
                    <Text style={s.transactionMeta}>{stock.note}</Text>
                  ) : null}
                </View>
                <View style={s.stockTotal}>
                  <Text style={s.positive}>+{stock.quantity}</Text>
                  <Text style={s.transactionMeta}>
                    {stock.stock_after} after
                  </Text>
                </View>
              </View>
            ))}
            {!stocks.length && (
              <Text style={s.tableEmpty}>No stock additions yet.</Text>
            )}
            {pagination(stockPage, stocks.length, setStockPage)}
          </View>
        </ScrollView>
      )}
      {newStock && cashier ? (
        <View style={s.stockNotice} accessibilityLiveRegion="polite">
          <View style={s.flex}>
            <Text style={s.noticeTitle}>New stocks have arrived</Text>
            <Text style={s.noticeCopy}>
              Press Refresh to update available quantities.
            </Text>
          </View>
          <Button
            title="Refresh"
            small
            busy={loading}
            disabled={busy}
            onPress={() => void refresh()}
          />
        </View>
      ) : null}
      {offline && !error ? (
        <View style={s.toast}>
          <Text style={s.errorText}>
            Stock updates are offline. Press Refresh to reconnect.
          </Text>
        </View>
      ) : null}
      {error || notice ? (
        <View
          style={[s.toast, notice && !error ? s.successToast : null]}
          accessibilityLiveRegion="polite"
        >
          <Text style={[s.toastText, notice && !error ? s.successText : null]}>
            {error || notice}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss notification"
            onPress={() => {
              setError("");
              setNotice("");
            }}
            style={s.dismissButton}
          >
            <Text style={s.toastText}>×</Text>
          </Pressable>
        </View>
      ) : null}
      <Modal
        visible={!!restock}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!busy) setRestock(null);
        }}
      >
        <KeyboardAvoidingView
          style={s.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={s.modalCard}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={s.modalContent}
            >
              <View style={s.modalHeader}>
                <Text style={s.panelTitle}>Add stock</Text>
                <Button
                  title="×"
                  secondary
                  small
                  disabled={busy}
                  onPress={() => {
                    setRestock(null);
                    setError("");
                  }}
                />
              </View>
              <Text style={s.subtitle}>
                {restock ? label(restock) : ""} · {restock?.stock ?? 0}{" "}
                currently available
              </Text>
              <Field
                title="Units to add"
                value={stockQuantity}
                onChange={setStockQuantity}
                numeric
                disabled={busy}
              />
              <Field
                title="Note (optional)"
                value={stockNote}
                onChange={(value) => setStockNote(value.slice(0, 255))}
                disabled={busy}
              />
              <Text style={s.restockPreview}>
                New stock:{" "}
                {(restock?.stock ?? 0) + (Number(stockQuantity) || 0)} units
              </Text>
              {error ? <Text style={s.errorText}>{error}</Text> : null}
              <Button
                title="Confirm stock addition"
                busy={busy}
                disabled={
                  !Number.isInteger(Number(stockQuantity)) ||
                  Number(stockQuantity) < 1 ||
                  Number(stockQuantity) > 100000
                }
                onPress={() => void addStock()}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <Modal
        visible={!cashier && !!receipt}
        animationType="slide"
        onRequestClose={() => setReceipt(null)}
      >
        <SafeAreaView style={s.screen}>
          <View style={s.modalHeader}>
            <Text style={s.panelTitle}>Receipt</Text>
            <Button
              title="Close"
              secondary
              small
              onPress={() => {
                setReceipt(null);
                setError("");
              }}
            />
          </View>
          {receipt ? (
            <>
              <ReceiptPreview sale={receipt} />
              <View style={s.modalContent}>
                <Button
                  title="Print receipt"
                  busy={printing}
                  onPress={() => void print(receipt)}
                />
              </View>
            </>
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
