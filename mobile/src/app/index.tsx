import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { api, isUnauthorized, restoreApiToken, setApiToken } from "@/api";
import ChatAssistant from "@/components/chat-assistant";

type Role = "admin" | "cashier";
type User = { id: number; name: string; username: string; role: Role };
type Product = {
  id: number;
  name: string;
  unit: string;
  stock: number;
  min_stock: number;
  price: number;
  status: "available" | "unavailable";
  updated_at: string;
};
type Sale = {
  id: number;
  product_name: string;
  quantity: number;
  total: number;
  cashier_name: string;
  created_at: string;
};
type ProductInput = Omit<Product, "id" | "status" | "updated_at">;

const COLORS = {
  navy: "#071A35",
  navySoft: "#102B50",
  blue: "#1769E0",
  cyan: "#27B7E6",
  sky: "#EAF6FC",
  canvas: "#F3F7FA",
  card: "#FFFFFF",
  ink: "#10213F",
  muted: "#6F7F93",
  line: "#DDE7EF",
  success: "#16845B",
  successSoft: "#E7F7F0",
  warning: "#B76705",
  warningSoft: "#FFF4DD",
  danger: "#C93C4A",
  dangerSoft: "#FDECEF",
};
const API_ERROR = "The request could not be completed.";

function money(value: number): string {
  return `₱${Number(value).toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function stockStatus(product: Product) {
  if (product.status === "unavailable") {
    return { label: "Unavailable", color: COLORS.muted, background: "#EDF1F5" };
  }
  if (product.stock === 0 || product.stock <= product.min_stock / 2) {
    return {
      label: "Critical",
      color: COLORS.danger,
      background: COLORS.dangerSoft,
    };
  }
  if (product.stock <= product.min_stock) {
    return {
      label: "Low stock",
      color: COLORS.warning,
      background: COLORS.warningSoft,
    };
  }
  return {
    label: "In stock",
    color: COLORS.success,
    background: COLORS.successSoft,
  };
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  secure = false,
  keyboard = "default",
  onSubmit,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboard?: "default" | "decimal-pad" | "number-pad";
  onSubmit?: () => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9AA8B8"
        secureTextEntry={secure}
        keyboardType={keyboard}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType={onSubmit ? "done" : "next"}
        onSubmitEditing={onSubmit}
        style={styles.input}
      />
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  busy = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={busy || disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        (busy || disabled) && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {busy ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.primaryButtonText}>{label}</Text>
      )}
    </Pressable>
  );
}

function Login({
  onLogin,
}: {
  onLogin: (user: User, token: string) => Promise<void>;
}) {
  const { width } = useWindowDimensions();
  const loginWidth = Math.min(Math.max(width - 32, 280), 470);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!username.trim() || !password) {
      setError("Enter your username and password.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const result = await api<{ token: string; user: User }>("/login", {
        method: "POST",
        body: JSON.stringify({
          username: username.trim(),
          password,
          device_name: `mobile-${Platform.OS}`,
        }),
      });
      await onLogin(result.user, result.token);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : API_ERROR,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.loginScreen} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <View style={styles.loginOrbLarge} />
      <View style={styles.loginOrbSmall} />
      <ScrollView
        contentContainerStyle={styles.loginScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.loginContainer, { width: loginWidth }]}>
          <View style={styles.loginBrand}>
            <View style={styles.logoLarge}>
              <Text style={styles.logoLetter}>R</Text>
            </View>
            <Text style={styles.loginBrandName}>RJane Water</Text>
            <Text style={styles.loginBrandCaption}>
              REFILLING STATION · POS
            </Text>
          </View>

          <View style={styles.loginCard}>
            <Text style={styles.loginEyebrow}>WELCOME BACK</Text>
            <Text style={styles.loginTitle}>Sign in to continue</Text>
            <Text style={styles.loginSubtitle}>
              Manage inventory and sales from anywhere.
            </Text>

            <View style={styles.loginFields}>
              <Field
                label="Username"
                value={username}
                onChange={setUsername}
                placeholder="Enter username"
              />
              <Field
                label="Password"
                value={password}
                onChange={setPassword}
                placeholder="Enter password"
                secure
                onSubmit={() => void submit()}
              />
            </View>

            {error ? (
              <View style={styles.inlineError}>
                <Text style={styles.inlineErrorIcon}>!</Text>
                <Text style={styles.inlineErrorText}>{error}</Text>
              </View>
            ) : null}

            <PrimaryButton
              label="Sign in"
              onPress={() => void submit()}
              busy={busy}
            />
          </View>
          <Text style={styles.loginFooter}>
            Secure access for authorized staff
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProductModal({
  product,
  onClose,
  onSave,
}: {
  product?: Product;
  onClose: () => void;
  onSave: (data: ProductInput) => Promise<boolean>;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [unit, setUnit] = useState(product?.unit ?? "5 Gallon");
  const [price, setPrice] = useState(String(product?.price ?? 30));
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [minimum, setMinimum] = useState(String(product?.min_stock ?? 10));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    const numericPrice = Number(price);
    const numericStock = Number(stock);
    const numericMinimum = Number(minimum);

    if (!name.trim() || !unit.trim()) {
      setError("Product name and unit are required.");
      return;
    }
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setError("Enter a valid price.");
      return;
    }
    if (
      !Number.isInteger(numericStock) ||
      numericStock < 0 ||
      !Number.isInteger(numericMinimum) ||
      numericMinimum < 0
    ) {
      setError("Stock values must be whole numbers of zero or more.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await onSave({
        name: name.trim(),
        unit: unit.trim(),
        price: numericPrice,
        stock: numericStock,
        min_stock: numericMinimum,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      visible
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.modalDismissArea} onPress={onClose} />
        <SafeAreaView style={styles.sheet} edges={["bottom"]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetEyebrow}>INVENTORY</Text>
              <Text style={styles.sheetTitle}>
                {product ? "Edit product" : "New product"}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Close"
              hitSlop={12}
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Field
              label="Product name"
              value={name}
              onChange={setName}
              placeholder="e.g. Purified Water"
            />
            <Field
              label="Unit"
              value={unit}
              onChange={setUnit}
              placeholder="e.g. 5 Gallon"
            />
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Field
                  label="Price"
                  value={price}
                  onChange={setPrice}
                  keyboard="decimal-pad"
                />
              </View>
              <View style={styles.fieldHalf}>
                <Field
                  label="Stock"
                  value={stock}
                  onChange={setStock}
                  keyboard="number-pad"
                />
              </View>
            </View>
            <Field
              label="Low-stock alert at"
              value={minimum}
              onChange={setMinimum}
              keyboard="number-pad"
            />
            {error ? <Text style={styles.formError}>{error}</Text> : null}
            <View style={styles.sheetActions}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <View style={styles.sheetPrimaryAction}>
                <PrimaryButton
                  label={product ? "Save changes" : "Add product"}
                  onPress={() => void save()}
                  busy={busy}
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SaleModal({
  product,
  onClose,
  onSell,
}: {
  product: Product;
  onClose: () => void;
  onSell: (quantity: number) => Promise<boolean>;
}) {
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);

  async function sell() {
    setBusy(true);
    try {
      await onSell(quantity);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      visible
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.modalDismissArea} onPress={onClose} />
        <SafeAreaView style={styles.sheet} edges={["bottom"]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetEyebrow}>NEW TRANSACTION</Text>
              <Text style={styles.sheetTitle}>Process sale</Text>
            </View>
            <Pressable
              accessibilityLabel="Close"
              hitSlop={12}
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </Pressable>
          </View>

          <View style={styles.saleProductSummary}>
            <View style={styles.saleProductIcon}>
              <Text style={styles.saleProductIconText}>W</Text>
            </View>
            <View style={styles.flexOne}>
              <Text style={styles.saleProductName}>{product.name}</Text>
              <Text style={styles.mutedText}>
                {money(product.price)} per {product.unit}
              </Text>
            </View>
            <Text style={styles.availableText}>{product.stock} left</Text>
          </View>

          <Text style={styles.quantityLabel}>QUANTITY</Text>
          <View style={styles.stepper}>
            <Pressable
              accessibilityLabel="Decrease quantity"
              disabled={quantity <= 1}
              onPress={() => setQuantity((current) => Math.max(1, current - 1))}
              style={({ pressed }) => [
                styles.stepButton,
                quantity <= 1 && styles.stepDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.stepButtonText}>−</Text>
            </Pressable>
            <View style={styles.quantityValueWrap}>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <Text style={styles.quantityUnit}>{product.unit}</Text>
            </View>
            <Pressable
              accessibilityLabel="Increase quantity"
              disabled={quantity >= product.stock}
              onPress={() =>
                setQuantity((current) => Math.min(product.stock, current + 1))
              }
              style={({ pressed }) => [
                styles.stepButton,
                quantity >= product.stock && styles.stepDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.stepButtonText}>+</Text>
            </Pressable>
          </View>

          <View style={styles.saleTotalRow}>
            <View>
              <Text style={styles.saleTotalLabel}>TOTAL DUE</Text>
              <Text style={styles.mutedText}>
                {quantity} × {money(product.price)}
              </Text>
            </View>
            <Text style={styles.saleTotalValue}>
              {money(quantity * product.price)}
            </Text>
          </View>

          <PrimaryButton
            label="Confirm sale"
            onPress={() => void sell()}
            busy={busy}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function Metric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricHelper}>{helper}</Text>
    </View>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyIconText}>W</Text>
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 375;
  const contentWidth = Math.min(Math.max(width - 28, 292), 720);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [tab, setTab] = useState<"inventory" | "transactions">("inventory");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editor, setEditor] = useState<Product | null | undefined>(undefined);
  const [saleProduct, setSaleProduct] = useState<Product | null>(null);
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? products.filter((product) => product.name.toLowerCase().includes(query))
      : products;
  }, [products, search]);

  const revenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const stockCount = products.reduce((sum, product) => sum + product.stock, 0);
  const attentionCount = products.filter(
    (product) =>
      product.stock <= product.min_stock || product.status === "unavailable",
  ).length;

  const showNotice = useCallback((message: string) => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice(message);
    noticeTimer.current = setTimeout(() => setNotice(""), 3200);
  }, []);

  useEffect(
    () => () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    },
    [],
  );

  const clearSession = useCallback(async () => {
    setUser(null);
    setToken(null);
    setProducts([]);
    setSales([]);
    await setApiToken(null);
  }, []);

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      try {
        const storedToken = await restoreApiToken();
        if (!storedToken) return;
        const result = await api<{ user: User }>("/me", {}, storedToken);
        if (active) {
          setToken(storedToken);
          setUser(result.user);
        }
      } catch (error) {
        if (isUnauthorized(error)) await setApiToken(null);
        else if (active)
          Alert.alert(
            "Unable to restore session",
            error instanceof Error ? error.message : API_ERROR,
          );
      } finally {
        if (active) setCheckingAuth(false);
      }
    }
    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [productResult, saleResult] = await Promise.all([
        api<{ data: Product[] }>("/products", {}, token),
        api<{ data: Sale[] }>("/sales", {}, token),
      ]);
      setProducts(productResult.data);
      setSales(saleResult.data);
    } catch (error) {
      if (isUnauthorized(error)) await clearSession();
      else
        Alert.alert(
          "Unable to refresh",
          error instanceof Error ? error.message : API_ERROR,
        );
    } finally {
      setLoading(false);
    }
  }, [clearSession, token]);

  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load, token]);

  async function saveProduct(data: ProductInput): Promise<boolean> {
    try {
      const editing = editor !== null && editor !== undefined;
      const result = await api<{ data: Product }>(
        editing ? `/products/${editor.id}` : "/products",
        {
          method: editing ? "PUT" : "POST",
          body: JSON.stringify({
            ...data,
            description: null,
            status: "available",
          }),
        },
        token,
      );
      setProducts((current) =>
        editing
          ? current.map((item) =>
              item.id === result.data.id ? result.data : item,
            )
          : [result.data, ...current],
      );
      setEditor(undefined);
      showNotice(
        `${result.data.name} ${editing ? "updated" : "added"} successfully.`,
      );
      return true;
    } catch (error) {
      if (isUnauthorized(error)) await clearSession();
      else
        Alert.alert(
          "Unable to save product",
          error instanceof Error ? error.message : API_ERROR,
        );
      return false;
    }
  }

  async function sell(quantity: number): Promise<boolean> {
    if (!saleProduct) return false;
    try {
      const soldProduct = saleProduct;
      const result = await api<{ data: Sale; product: Product }>(
        "/sales",
        {
          method: "POST",
          body: JSON.stringify({ product_id: soldProduct.id, quantity }),
        },
        token,
      );
      setProducts((current) =>
        current.map((item) =>
          item.id === result.product.id ? result.product : item,
        ),
      );
      setSales((current) => [result.data, ...current]);
      setSaleProduct(null);
      showNotice(
        `${quantity} ${soldProduct.unit} sold for ${money(result.data.total)}.`,
      );
      return true;
    } catch (error) {
      if (isUnauthorized(error)) await clearSession();
      else
        Alert.alert(
          "Unable to process sale",
          error instanceof Error ? error.message : API_ERROR,
        );
      return false;
    }
  }

  function remove(product: Product) {
    Alert.alert(
      "Delete product?",
      `${product.name} will be removed from inventory.`,
      [
        { text: "Keep product", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api(`/products/${product.id}`, { method: "DELETE" }, token);
              setProducts((current) =>
                current.filter((item) => item.id !== product.id),
              );
              showNotice(`${product.name} deleted.`);
            } catch (error) {
              if (isUnauthorized(error)) await clearSession();
              else
                Alert.alert(
                  "Unable to delete product",
                  error instanceof Error ? error.message : API_ERROR,
                );
            }
          },
        },
      ],
    );
  }

  async function logout() {
    try {
      await api("/logout", { method: "POST" }, token);
    } catch (error) {
      if (!isUnauthorized(error)) {
        Alert.alert(
          "Signed out locally",
          "The server could not be reached, but this device is now signed out.",
        );
      }
    } finally {
      await clearSession();
    }
  }

  if (checkingAuth) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar style="dark" />
        <View style={styles.loadingLogo}>
          <Text style={styles.loadingLogoText}>R</Text>
        </View>
        <ActivityIndicator color={COLORS.blue} />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <Login
        onLogin={async (nextUser, nextToken) => {
          await setApiToken(nextToken);
          setToken(nextToken);
          setUser(nextUser);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View style={styles.brandRow}>
            <View style={styles.logoSmall}>
              <Text style={styles.logoSmallText}>R</Text>
            </View>
            <View>
              <Text style={styles.brandName}>RJane Water</Text>
              <Text style={styles.brandSection}>MOBILE POS</Text>
            </View>
          </View>
          <View style={styles.accountRow}>
            {!compact && (
              <View style={styles.accountCopy}>
                <Text numberOfLines={1} style={styles.accountName}>
                  {user.name}
                </Text>
                <Text style={styles.accountRole}>{user.role}</Text>
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => void logout()}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.logoutText}>Sign out</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { width: contentWidth }]}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => void load()}
            tintColor={COLORS.blue}
            colors={[COLORS.blue]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <Text style={styles.heroEyebrow}>TODAY’S OVERVIEW</Text>
          <Text style={styles.heroGreeting}>
            {greeting()}, {user.name.split(" ")[0]}.
          </Text>
          <View style={styles.heroMetrics}>
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricLabel}>Revenue</Text>
              <Text style={styles.heroMetricValue}>{money(revenue)}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricLabel}>Transactions</Text>
              <Text style={styles.heroMetricValue}>{sales.length}</Text>
            </View>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <Metric
            label="ON HAND"
            value={String(stockCount)}
            helper="total units"
          />
          <Metric
            label="NEEDS ATTENTION"
            value={String(attentionCount)}
            helper={attentionCount === 1 ? "product" : "products"}
          />
        </View>

        {notice ? (
          <View style={styles.notice}>
            <View style={styles.noticeDot} />
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        <View style={styles.segmentedControl}>
          <Pressable
            onPress={() => setTab("inventory")}
            style={[
              styles.segment,
              tab === "inventory" && styles.segmentActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                tab === "inventory" && styles.segmentTextActive,
              ]}
            >
              Inventory
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab("transactions")}
            style={[
              styles.segment,
              tab === "transactions" && styles.segmentActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                tab === "transactions" && styles.segmentTextActive,
              ]}
            >
              Transactions
            </Text>
          </Pressable>
        </View>

        {tab === "inventory" ? (
          <View>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Products</Text>
                <Text style={styles.sectionSubtitle}>
                  {products.length} in inventory
                </Text>
              </View>
              {user.role === "admin" ? (
                <Pressable
                  onPress={() => setEditor(null)}
                  style={({ pressed }) => [
                    styles.addButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.addButtonPlus}>+</Text>
                  <Text style={styles.addButtonText}>New product</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.searchWrap}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search inventory"
                placeholderTextColor="#8D9BAD"
                returnKeyType="search"
                style={styles.searchInput}
              />
              {search ? (
                <Pressable
                  accessibilityLabel="Clear search"
                  hitSlop={8}
                  onPress={() => setSearch("")}
                >
                  <Text style={styles.searchClear}>×</Text>
                </Pressable>
              ) : null}
            </View>

            {loading && products.length === 0 ? (
              <View style={styles.listLoader}>
                <ActivityIndicator color={COLORS.blue} />
              </View>
            ) : filteredProducts.length === 0 ? (
              <EmptyState
                title={search ? "No matching products" : "No products yet"}
                message={
                  search
                    ? "Try another product name."
                    : "Add your first product to begin tracking inventory."
                }
              />
            ) : (
              filteredProducts.map((product) => {
                const status = stockStatus(product);
                return (
                  <View key={product.id} style={styles.productCard}>
                    <View
                      style={[
                        styles.productAccent,
                        { backgroundColor: status.color },
                      ]}
                    />
                    <View style={styles.productHeader}>
                      <View style={styles.flexOne}>
                        <Text style={styles.productName}>{product.name}</Text>
                        <Text style={styles.productPrice}>
                          {money(product.price)}{" "}
                          <Text style={styles.mutedText}>/ {product.unit}</Text>
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: status.background },
                        ]}
                      >
                        <Text
                          style={[styles.statusText, { color: status.color }]}
                        >
                          {status.label}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.productFooter}>
                      <View>
                        <Text style={styles.stockLabel}>AVAILABLE STOCK</Text>
                        <Text style={styles.stockValue}>
                          {product.stock}{" "}
                          <Text style={styles.stockUnit}>{product.unit}</Text>
                        </Text>
                        <Text style={styles.reorderText}>
                          Reorder at {product.min_stock}
                        </Text>
                      </View>
                      {user.role === "admin" ? (
                        <View style={styles.cardActions}>
                          <Pressable
                            onPress={() => setEditor(product)}
                            style={({ pressed }) => [
                              styles.editButton,
                              pressed && styles.pressed,
                            ]}
                          >
                            <Text style={styles.editButtonText}>Edit</Text>
                          </Pressable>
                          <Pressable
                            accessibilityLabel={`Delete ${product.name}`}
                            onPress={() => remove(product)}
                            style={({ pressed }) => [
                              styles.deleteButton,
                              pressed && styles.pressed,
                            ]}
                          >
                            <Text style={styles.deleteButtonText}>×</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable
                          disabled={
                            product.stock === 0 ||
                            product.status === "unavailable"
                          }
                          onPress={() => setSaleProduct(product)}
                          style={({ pressed }) => [
                            styles.sellButton,
                            (product.stock === 0 ||
                              product.status === "unavailable") &&
                              styles.disabled,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Text style={styles.sellButtonText}>Sell now</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : (
          <View>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Today’s sales</Text>
                <Text style={styles.sectionSubtitle}>
                  {sales.length} recorded{" "}
                  {sales.length === 1 ? "transaction" : "transactions"}
                </Text>
              </View>
            </View>
            {loading && sales.length === 0 ? (
              <View style={styles.listLoader}>
                <ActivityIndicator color={COLORS.blue} />
              </View>
            ) : sales.length === 0 ? (
              <EmptyState
                title="No sales yet"
                message="Completed cashier sales will appear here."
              />
            ) : (
              <View style={styles.transactionList}>
                {sales.map((sale, index) => (
                  <View
                    key={sale.id}
                    style={[
                      styles.transactionRow,
                      index < sales.length - 1 && styles.transactionBorder,
                    ]}
                  >
                    <View style={styles.transactionIcon}>
                      <Text style={styles.transactionIconText}>✓</Text>
                    </View>
                    <View style={styles.flexOne}>
                      <Text style={styles.transactionProduct}>
                        {sale.product_name}
                      </Text>
                      <Text style={styles.transactionMeta}>
                        {sale.quantity} {sale.quantity === 1 ? "unit" : "units"}{" "}
                        · {sale.cashier_name}
                      </Text>
                      <Text style={styles.transactionTime}>
                        {new Date(sale.created_at).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                    <Text style={styles.transactionTotal}>
                      {money(sale.total)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {editor !== undefined ? (
        <ProductModal
          product={editor ?? undefined}
          onClose={() => setEditor(undefined)}
          onSave={saveProduct}
        />
      ) : null}
      {saleProduct ? (
        <SaleModal
          product={saleProduct}
          onClose={() => setSaleProduct(null)}
          onSell={sell}
        />
      ) : null}
      <ChatAssistant key={user.id} onUnauthorized={clearSession} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flexOne: { flex: 1 },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.42 },
  screen: { flex: 1, backgroundColor: COLORS.canvas },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    backgroundColor: COLORS.canvas,
  },
  loadingLogo: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: COLORS.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingLogoText: { color: "#FFFFFF", fontSize: 25, fontWeight: "900" },
  header: {
    backgroundColor: COLORS.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.line,
  },
  headerInner: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    minHeight: 68,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoSmall: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  logoSmallText: { color: "#FFFFFF", fontSize: 17, fontWeight: "900" },
  brandName: {
    color: COLORS.ink,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "800",
  },
  brandSection: {
    color: COLORS.muted,
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  accountRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  accountCopy: { maxWidth: 130, alignItems: "flex-end" },
  accountName: { color: COLORS.ink, fontSize: 12, fontWeight: "700" },
  accountRole: {
    color: COLORS.muted,
    fontSize: 10,
    textTransform: "capitalize",
  },
  logoutButton: {
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: COLORS.sky,
    justifyContent: "center",
  },
  logoutText: { color: COLORS.blue, fontSize: 12, fontWeight: "800" },
  content: {
    alignSelf: "center",
    paddingTop: 20,
    paddingBottom: 54,
  },
  heroCard: {
    overflow: "hidden",
    position: "relative",
    backgroundColor: COLORS.navy,
    borderRadius: 24,
    padding: 22,
    marginBottom: 14,
    elevation: 4,
    boxShadow: "0 8px 16px rgba(7, 26, 53, 0.18)",
  },
  heroGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.cyan,
    opacity: 0.12,
    right: -55,
    top: -85,
  },
  heroEyebrow: {
    color: "#79D6F1",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  heroGreeting: {
    color: "#FFFFFF",
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "800",
    marginBottom: 24,
  },
  heroMetrics: { flexDirection: "row", alignItems: "stretch" },
  heroMetric: { flex: 1 },
  heroDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginHorizontal: 18,
  },
  heroMetricLabel: {
    color: "#A7BED8",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 5,
  },
  heroMetricValue: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  metricsRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  metricCard: {
    flex: 1,
    minHeight: 100,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 16,
  },
  metricLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  metricValue: {
    color: COLORS.ink,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "900",
    marginTop: 6,
  },
  metricHelper: { color: COLORS.muted, fontSize: 11 },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: COLORS.successSoft,
    marginBottom: 16,
  },
  noticeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  noticeText: {
    flex: 1,
    color: COLORS.success,
    fontSize: 12,
    fontWeight: "700",
  },
  segmentedControl: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 15,
    backgroundColor: "#E6EDF3",
    marginBottom: 24,
  },
  segment: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentActive: {
    backgroundColor: COLORS.card,
    elevation: 2,
    boxShadow: "0 2px 8px rgba(27, 49, 77, 0.08)",
  },
  segmentText: { color: COLORS.muted, fontSize: 13, fontWeight: "700" },
  segmentTextActive: { color: COLORS.ink, fontWeight: "900" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    color: COLORS.ink,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  sectionSubtitle: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  addButton: {
    minHeight: 40,
    paddingHorizontal: 13,
    borderRadius: 13,
    backgroundColor: COLORS.blue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  addButtonPlus: {
    color: "#FFFFFF",
    fontSize: 19,
    lineHeight: 20,
    fontWeight: "500",
  },
  addButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  searchWrap: {
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.card,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  searchIcon: {
    color: COLORS.muted,
    fontSize: 23,
    marginRight: 9,
    marginTop: -3,
  },
  searchInput: { flex: 1, height: "100%", color: COLORS.ink, fontSize: 14 },
  searchClear: { color: COLORS.muted, fontSize: 22, paddingLeft: 10 },
  listLoader: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  productCard: {
    overflow: "hidden",
    position: "relative",
    backgroundColor: COLORS.card,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 17,
    marginBottom: 12,
  },
  productAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },
  productHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 18,
  },
  productName: {
    color: COLORS.ink,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
    marginBottom: 4,
  },
  productPrice: { color: COLORS.blue, fontSize: 13, fontWeight: "800" },
  mutedText: { color: COLORS.muted, fontWeight: "500" },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { fontSize: 10, fontWeight: "900" },
  productFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.line,
    paddingTop: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  stockLabel: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  stockValue: {
    color: COLORS.ink,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 2,
  },
  stockUnit: { color: COLORS.muted, fontSize: 11, fontWeight: "600" },
  reorderText: { color: COLORS.muted, fontSize: 10, marginTop: 1 },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  editButton: {
    height: 40,
    minWidth: 65,
    borderRadius: 12,
    backgroundColor: COLORS.sky,
    alignItems: "center",
    justifyContent: "center",
  },
  editButtonText: { color: COLORS.blue, fontSize: 12, fontWeight: "900" },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.dangerSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: { color: COLORS.danger, fontSize: 21, lineHeight: 23 },
  sellButton: {
    minHeight: 42,
    paddingHorizontal: 18,
    borderRadius: 13,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  sellButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  emptyCard: {
    minHeight: 210,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  emptyIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: COLORS.sky,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyIconText: { color: COLORS.blue, fontSize: 20, fontWeight: "900" },
  emptyTitle: {
    color: COLORS.ink,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 5,
  },
  emptyMessage: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 270,
  },
  transactionList: {
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.card,
  },
  transactionRow: {
    minHeight: 87,
    paddingHorizontal: 15,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  transactionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.line,
  },
  transactionIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: COLORS.successSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  transactionIconText: {
    color: COLORS.success,
    fontSize: 16,
    fontWeight: "900",
  },
  transactionProduct: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 3,
  },
  transactionMeta: { color: COLORS.muted, fontSize: 11 },
  transactionTime: { color: "#98A5B4", fontSize: 10, marginTop: 3 },
  transactionTotal: { color: COLORS.blue, fontSize: 15, fontWeight: "900" },
  loginScreen: { flex: 1, backgroundColor: COLORS.navy },
  loginScroll: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingTop: 46,
    paddingBottom: 32,
  },
  loginContainer: { alignSelf: "center" },
  loginOrbLarge: {
    pointerEvents: "none",
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: COLORS.cyan,
    opacity: 0.08,
    top: -95,
    right: -100,
  },
  loginOrbSmall: {
    pointerEvents: "none",
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.blue,
    opacity: 0.16,
    bottom: 10,
    left: -75,
  },
  loginBrand: { alignItems: "center", marginBottom: 28 },
  logoLarge: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  logoLetter: { color: COLORS.blue, fontSize: 29, fontWeight: "900" },
  loginBrandName: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  loginBrandCaption: {
    color: "#8FCBE4",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.8,
    marginTop: 5,
  },
  loginCard: {
    boxSizing: "border-box",
    width: "100%",
    backgroundColor: COLORS.card,
    borderRadius: 26,
    padding: 24,
    elevation: 8,
    boxShadow: "0 12px 24px rgba(0, 0, 0, 0.20)",
  },
  loginEyebrow: {
    color: COLORS.blue,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 7,
  },
  loginTitle: {
    color: COLORS.ink,
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  loginSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 23,
  },
  loginFields: { gap: 2 },
  loginFooter: {
    color: "#8AA3BD",
    textAlign: "center",
    fontSize: 10,
    marginTop: 18,
  },
  field: { marginBottom: 15 },
  fieldLabel: {
    color: COLORS.ink,
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 7,
  },
  input: {
    height: 51,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    color: COLORS.ink,
    fontSize: 14,
  },
  inlineError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: 12,
    backgroundColor: COLORS.dangerSoft,
    padding: 11,
    marginBottom: 14,
  },
  inlineErrorIcon: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: COLORS.danger,
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 12,
    lineHeight: 19,
    fontWeight: "900",
  },
  inlineErrorText: {
    flex: 1,
    color: COLORS.danger,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },
  primaryButton: {
    minHeight: 51,
    borderRadius: 15,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(3, 14, 30, 0.58)",
  },
  modalDismissArea: { flex: 1 },
  sheet: {
    width: "100%",
    maxWidth: 620,
    maxHeight: "92%",
    alignSelf: "center",
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 21,
    paddingTop: 10,
    paddingBottom: 12,
  },
  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D8E0E8",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sheetEyebrow: {
    color: COLORS.blue,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginBottom: 4,
  },
  sheetTitle: { color: COLORS.ink, fontSize: 22, fontWeight: "900" },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F0F4F7",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: { color: COLORS.muted, fontSize: 25, lineHeight: 27 },
  fieldRow: { flexDirection: "row", gap: 11 },
  fieldHalf: { flex: 1 },
  formError: {
    color: COLORS.danger,
    fontSize: 11,
    lineHeight: 16,
    marginTop: -3,
    marginBottom: 12,
  },
  sheetActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 5,
    paddingBottom: 8,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 51,
    borderRadius: 15,
    backgroundColor: "#EDF2F6",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { color: COLORS.ink, fontSize: 13, fontWeight: "800" },
  sheetPrimaryAction: { flex: 1.4 },
  saleProductSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 17,
    backgroundColor: COLORS.sky,
    padding: 14,
    marginBottom: 24,
  },
  saleProductIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  saleProductIconText: { color: "#FFFFFF", fontSize: 17, fontWeight: "900" },
  saleProductName: {
    color: COLORS.ink,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 3,
  },
  availableText: { color: COLORS.success, fontSize: 11, fontWeight: "900" },
  quantityLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    textAlign: "center",
    marginBottom: 10,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  stepButton: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: COLORS.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDisabled: { backgroundColor: "#D8E0E8" },
  stepButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 27,
    fontWeight: "600",
  },
  quantityValueWrap: { flex: 1, alignItems: "center" },
  quantityValue: {
    color: COLORS.ink,
    fontSize: 37,
    lineHeight: 42,
    fontWeight: "900",
  },
  quantityUnit: { color: COLORS.muted, fontSize: 10 },
  saleTotalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingTop: 18,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  saleTotalLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  saleTotalValue: { color: COLORS.blue, fontSize: 25, fontWeight: "900" },
});
