import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import { api, setApiToken } from '@/api';

type Role = 'admin' | 'cashier';
type User = { id: number; name: string; username: string; role: Role };
type Product = { id: number; name: string; unit: string; stock: number; min_stock: number; price: number; updated_at: string };
type Sale = { id: number; quantity: number; total: number; cashier_name: string; created_at: string };

const BLUE = '#1e40af';
const INK = '#10213f';
const API_ERROR = 'The request could not be completed.';

// Responsive helper function
function createResponsiveStyles(screenWidth: number) {
  const isSmallScreen = screenWidth < 375;
  const isMediumScreen = screenWidth < 480;
  const isLargeScreen = screenWidth >= 768;
  
  const padding = isSmallScreen ? 12 : isMediumScreen ? 16 : 20;
  const headerPadding = isSmallScreen ? 10 : 14;
  const largeText = isSmallScreen ? 22 : isMediumScreen ? 24 : 26;
  const mediumText = isSmallScreen ? 14 : 16;
  const smallText = isSmallScreen ? 10 : 12;
  const statsPerRow = isLargeScreen ? 4 : isMediumScreen ? 2 : 2;
  const statWidth = isLargeScreen ? '23%' : '48%';
  
  return { padding, headerPadding, largeText, mediumText, smallText, statsPerRow, statWidth, isSmallScreen, isMediumScreen, isLargeScreen };
}

// Generate responsive stylesheet
function createResponsiveSheets(screenWidth: number) {
  const responsive = createResponsiveStyles(screenWidth);
  const baseStyles = StyleSheet.create({
    page: { flex: 1, backgroundColor: '#f7f9fc' },
    content: { padding: responsive.padding, paddingBottom: 40 },
    header: { paddingHorizontal: responsive.padding, paddingVertical: responsive.headerPadding, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e3e9f2', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    brand: { color: INK, fontWeight: '800', fontSize: responsive.mediumText },
    brandLight: { color: '#fff', fontWeight: '800', fontSize: responsive.largeText + 4 },
    brandCaption: { color: '#a8caff', fontSize: responsive.smallText - 2, fontWeight: '700', letterSpacing: 2, marginTop: 5 },
    drop: { color: '#b9d8ff', fontSize: 32, marginBottom: 8 },
    loginPage: { flex: 1, backgroundColor: '#081839', justifyContent: 'center' },
    loginHeader: { alignItems: 'center', padding: responsive.padding + 8 },
    loginBody: { backgroundColor: '#fff', padding: responsive.padding + 25, borderTopLeftRadius: 26, borderTopRightRadius: 26, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
    loginTitle: { color: INK, fontSize: responsive.mediumText - 2, fontWeight: '700', marginBottom: 18 },
    copyright: { color: '#94a3b8', textAlign: 'center', marginTop: 22, fontSize: responsive.smallText },
    field: { marginBottom: 35, flex: 1 },
    fieldLabel: { color: '#516079', fontSize: responsive.smallText, fontWeight: '700', marginBottom: 10 },
    input: { backgroundColor: '#f7f9fc', borderWidth: 1, borderColor: '#dce4ef', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11, color: INK, fontSize: responsive.mediumText - 1 },
    error: { color: '#dc2626', minHeight: 20, fontSize: responsive.smallText, marginBottom: 6 },
    primaryButton: { backgroundColor: BLUE, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
    primaryText: { color: '#fff', fontWeight: '700', fontSize: responsive.mediumText - 2 },
    disabled: { opacity: 0.5 },
    signOut: { color: BLUE, fontWeight: '700', fontSize: responsive.smallText + 1 },
    greeting: { color: INK, fontSize: responsive.largeText, fontWeight: '800', marginBottom: 16 },
    stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 },
    stat: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e7f0', borderRadius: 12, padding: responsive.padding - 2, width: responsive.statWidth as any, minHeight: 80 },
    statLabel: { color: '#8693a6', fontSize: responsive.smallText - 1, fontWeight: '700', textTransform: 'uppercase' },
    statValue: { color: INK, fontSize: responsive.largeText - 3, fontWeight: '800', marginTop: 6 },
    tabs: { flexDirection: 'row', gap: 8, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#e3e9f2' },
    tab: { paddingVertical: 12, paddingHorizontal: responsive.padding - 4, borderBottomWidth: 3, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: BLUE },
    tabText: { color: '#8693a6', fontWeight: '600', fontSize: responsive.mediumText - 2 },
    activeTabText: { color: BLUE, fontWeight: '700' },
    toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { color: INK, fontSize: responsive.largeText - 3, fontWeight: '700' },
    smallButton: { backgroundColor: BLUE, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
    smallButtonText: { color: '#fff', fontWeight: '700', fontSize: responsive.smallText },
    search: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dce4ef', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16, color: INK, fontSize: responsive.mediumText - 1 },
    loader: { marginVertical: 40 },
    productCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e0e7f0', padding: responsive.padding - 2, marginBottom: 12 },
    productTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    productName: { color: INK, fontWeight: '700', fontSize: responsive.mediumText - 1 },
    muted: { color: '#8693a6', fontSize: responsive.smallText },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    productMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#edf1f5', marginTop: 12, paddingTop: 12 },
    stockValue: { color: INK, fontSize: responsive.largeText - 3, fontWeight: '800' },
    inlineActions: { marginLeft: 'auto', flexDirection: 'row', gap: 10 },
    link: { color: BLUE, fontWeight: '700', fontSize: responsive.smallText },
    danger: { color: '#dc2626', fontWeight: '700', fontSize: responsive.smallText },
    sellButton: { backgroundColor: BLUE, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginLeft: 8 },
    empty: { color: '#8693a6', textAlign: 'center', padding: 35, fontSize: responsive.mediumText },
    transaction: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#edf1f5', paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
    transactionNumber: { color: '#b0bac8', fontSize: responsive.smallText, width: 34 },
    saleTotal: { color: BLUE, fontWeight: '800', fontSize: responsive.largeText - 3 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: responsive.padding, paddingTop: 16, paddingBottom: 40, maxHeight: '90%' },
    sheetTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { color: INK, fontWeight: '700', fontSize: responsive.largeText - 2 },
    close: { color: '#8693a6', fontSize: 32, fontWeight: '300', marginTop: -8 },
    twoFields: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    half: { flex: 1 },
    actions: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 10 },
    secondaryButton: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
    secondaryText: { color: INK, fontWeight: '700', fontSize: responsive.mediumText - 2 },
    actionButton: { marginLeft: 10 },
    saleInfo: { backgroundColor: '#f7f9fc', borderRadius: 10, padding: responsive.padding - 2, marginBottom: 20 },
    salePrice: { color: BLUE, fontWeight: '700', fontSize: responsive.largeText - 2, marginBottom: 4 },
    stepper: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#f7f9fc', borderRadius: 10, paddingVertical: 12, marginBottom: 20 },
    stepButton: { width: 44, height: 44, backgroundColor: BLUE, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    stepText: { color: '#fff', fontSize: 20, fontWeight: '700' },
    quantity: { color: INK, fontWeight: '700', fontSize: responsive.largeText - 2 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#e0e7f0', marginBottom: 20 },
    total: { color: INK, fontWeight: '700', fontSize: responsive.largeText - 2 },
  });
  return baseStyles;
}

function money(value: number) { return `₱${Number(value).toLocaleString()}`; }
function stockStatus(product: Product) {
  const ratio = product.min_stock ? product.stock / product.min_stock : 1;
  return ratio <= 0.5 ? { label: 'Critical', color: '#dc2626', bg: '#fef2f2' } : ratio <= 1 ? { label: 'Low stock', color: '#b45309', bg: '#fffbeb' } : { label: 'In stock', color: '#15803d', bg: '#f0fdf4' };
}

function Field({ label, value, onChange, secure = false, keyboard = 'default', styles }: { label: string; value: string; onChange: (value: string) => void; secure?: boolean; keyboard?: 'default' | 'numeric'; styles: any }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChange} secureTextEntry={secure} keyboardType={keyboard} autoCapitalize="none" style={styles.input} placeholderTextColor="#9aa8bb" /></View>;
}

function Login({ onLogin, styles }: { onLogin: (user: User, token: string) => void; styles: any }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true); setError('');
    try { const result = await api<{ token: string; user: User }>('/login', { method: 'POST', body: JSON.stringify({ username, password }) }); onLogin(result.user, result.token); }
    catch (e) { setError(e instanceof Error ? e.message : API_ERROR); }
    finally { setBusy(false); }
  }
  return <SafeAreaView style={styles.loginPage}><View style={styles.loginHeader}><Text style={styles.drop}>◆</Text><Text style={styles.brandLight}>RJane Water</Text><Text style={styles.brandCaption}>INVENTORY SYSTEM</Text></View><View style={styles.loginBody}><Text style={styles.loginTitle}>Sign in to your account</Text><Field label="Username" value={username} onChange={setUsername} styles={styles} /><Field label="Password" value={password} onChange={setPassword} secure styles={styles} /><Text style={styles.error}>{error}</Text><Pressable style={[styles.primaryButton, busy && styles.disabled]} disabled={busy} onPress={() => void submit()}><Text style={styles.primaryText}>{busy ? 'Signing in...' : 'Sign in'}</Text></Pressable><Text style={styles.copyright}>RJane Water Refilling Station</Text></View></SafeAreaView>;
}

function ProductModal({ product, onClose, onSave, styles }: { product?: Product; onClose: () => void; onSave: (data: Omit<Product, 'id' | 'updated_at'>) => Promise<void>; styles: any }) {
  const [name, setName] = useState(product?.name ?? ''); const [unit, setUnit] = useState(product?.unit ?? 'gallon'); const [price, setPrice] = useState(String(product?.price ?? 30)); const [stock, setStock] = useState(String(product?.stock ?? 0)); const [minimum, setMinimum] = useState(String(product?.min_stock ?? 20)); const [busy, setBusy] = useState(false);
  async function save() { if (!name.trim()) return; setBusy(true); await onSave({ name: name.trim(), unit, price: Number(price) || 0, stock: Number(stock) || 0, min_stock: Number(minimum) || 0 }); setBusy(false); }
  return <Modal visible animationType="slide" transparent onRequestClose={onClose}><KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View style={styles.sheet}><View style={styles.sheetTitle}><Text style={styles.title}>{product ? 'Edit product' : 'Add new product'}</Text><Pressable onPress={onClose}><Text style={styles.close}>×</Text></Pressable></View><ScrollView><Field label="Product name" value={name} onChange={setName} styles={styles} /><View style={styles.twoFields}><View style={styles.half}><Field label="Unit" value={unit} onChange={setUnit} styles={styles} /></View><View style={styles.half}><Field label="Price per unit" value={price} onChange={setPrice} keyboard="numeric" styles={styles} /></View></View><View style={styles.twoFields}><View style={styles.half}><Field label="Quantity" value={stock} onChange={setStock} keyboard="numeric" styles={styles} /></View><View style={styles.half}><Field label="Min stock" value={minimum} onChange={setMinimum} keyboard="numeric" styles={styles} /></View></View><View style={styles.actions}><Pressable style={styles.secondaryButton} onPress={onClose}><Text style={styles.secondaryText}>Cancel</Text></Pressable><Pressable style={[styles.primaryButton, styles.actionButton]} disabled={busy} onPress={() => void save()}><Text style={styles.primaryText}>{busy ? 'Saving...' : 'Save product'}</Text></Pressable></View></ScrollView></View></KeyboardAvoidingView></Modal>;
}

function SaleModal({ product, onClose, onSell, styles }: { product: Product; onClose: () => void; onSell: (quantity: number) => Promise<void>; styles: any }) {
  const [quantity, setQuantity] = useState(1); const [busy, setBusy] = useState(false);
  async function sell() { setBusy(true); await onSell(quantity); setBusy(false); }
  return <Modal visible animationType="slide" transparent onRequestClose={onClose}><View style={styles.modalBackdrop}><View style={styles.sheet}><View style={styles.sheetTitle}><View><Text style={styles.title}>Process sale</Text><Text style={styles.muted}>{product.name}</Text></View><Pressable onPress={onClose}><Text style={styles.close}>×</Text></Pressable></View><View style={styles.saleInfo}><Text style={styles.salePrice}>{money(product.price)} / {product.unit}</Text><Text style={styles.muted}>{product.stock} available</Text></View><Text style={styles.fieldLabel}>Quantity</Text><View style={styles.stepper}><Pressable style={styles.stepButton} onPress={() => setQuantity(Math.max(1, quantity - 1))}><Text style={styles.stepText}>−</Text></Pressable><Text style={styles.quantity}>{quantity}</Text><Pressable style={styles.stepButton} onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}><Text style={styles.stepText}>+</Text></Pressable></View><View style={styles.totalRow}><Text style={styles.muted}>Total amount</Text><Text style={styles.total}>{money(quantity * product.price)}</Text></View><Pressable style={styles.primaryButton} disabled={busy} onPress={() => void sell()}><Text style={styles.primaryText}>{busy ? 'Processing...' : 'Confirm sale'}</Text></Pressable></View></View></Modal>;
}

export default function HomeScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const dynamicStyles = createResponsiveSheets(screenWidth);
  const styles = dynamicStyles; // Use dynamic responsive styles
  const [user, setUser] = useState<User | null>(null); const [token, setToken] = useState<string | null>(null); const [products, setProducts] = useState<Product[]>([]); const [sales, setSales] = useState<Sale[]>([]); const [tab, setTab] = useState<'inventory' | 'transactions'>('inventory'); const [search, setSearch] = useState(''); const [loading, setLoading] = useState(false); const [editor, setEditor] = useState<Product | null | undefined>(undefined); const [saleProduct, setSaleProduct] = useState<Product | null>(null);
  const filtered = useMemo(() => products.filter(product => product.name.toLowerCase().includes(search.toLowerCase())), [products, search]);
  const load = useCallback(async () => { setLoading(true); try { const [productResult, saleResult] = await Promise.all([api<{ data: Product[] }>('/products', {}, token), api<{ data: Sale[] }>('/sales', {}, token)]); setProducts(productResult.data); setSales(saleResult.data); } catch (e) { Alert.alert('Unable to load dashboard', e instanceof Error ? e.message : API_ERROR); } finally { setLoading(false); } }, [token]);
  useEffect(() => { if (!token) return; const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load, token]);
  async function saveProduct(data: Omit<Product, 'id' | 'updated_at'>) { try { const editing = editor !== null && editor !== undefined; const result = await api<{ data: Product }>(editing ? `/products/${editor.id}` : '/products', { method: editing ? 'PUT' : 'POST', body: JSON.stringify({ ...data, description: null, status: 'available' }) }, token); setProducts(current => editing ? current.map(item => item.id === result.data.id ? result.data : item) : [result.data, ...current]); setEditor(undefined); } catch (e) { Alert.alert('Unable to save product', e instanceof Error ? e.message : API_ERROR); } }
  async function sell(quantity: number) { if (!saleProduct) return; try { const result = await api<{ data: Sale; product: Product }>('/sales', { method: 'POST', body: JSON.stringify({ product_id: saleProduct.id, quantity }) }, token); setProducts(current => current.map(item => item.id === result.product.id ? result.product : item)); setSales(current => [result.data, ...current]); setSaleProduct(null); } catch (e) { Alert.alert('Unable to process sale', e instanceof Error ? e.message : API_ERROR); } }
  async function remove(product: Product) { Alert.alert('Delete product', `Delete ${product.name}?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { try { await api(`/products/${product.id}`, { method: 'DELETE' }, token); setProducts(current => current.filter(item => item.id !== product.id)); } catch (e) { Alert.alert('Unable to delete product', e instanceof Error ? e.message : API_ERROR); } } }]); }
  if (!user) return <Login onLogin={(nextUser, nextToken) => { setUser(nextUser); setToken(nextToken); setApiToken(nextToken); }} styles={styles} />;
  const first = products[0]; const revenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
  return <SafeAreaView style={styles.page}><View style={styles.header}><View><Text style={styles.brand}>RJane Water</Text><Text style={styles.muted}>Inventory</Text></View><Pressable onPress={() => { setUser(null); setToken(null); setApiToken(null); }}><Text style={styles.signOut}>Sign out</Text></Pressable></View><ScrollView contentContainerStyle={styles.content}><Text style={styles.greeting}>Good day, {user.name.split(' ')[0]}</Text><View style={styles.stats}><Stat label="In stock" value={first ? String(first.stock) : '-'} styles={styles} /><Stat label="Price / unit" value={first ? money(first.price) : '-'} styles={styles} /><Stat label="Revenue" value={money(revenue)} styles={styles} /><Stat label="Sales" value={String(sales.length)} styles={styles} /></View><View style={styles.tabs}><Pressable style={[styles.tab, tab === 'inventory' && styles.activeTab]} onPress={() => setTab('inventory')}><Text style={[styles.tabText, tab === 'inventory' && styles.activeTabText]}>Inventory</Text></Pressable><Pressable style={[styles.tab, tab === 'transactions' && styles.activeTab]} onPress={() => setTab('transactions')}><Text style={[styles.tabText, tab === 'transactions' && styles.activeTabText]}>Transactions</Text></Pressable></View>{tab === 'inventory' ? <><View style={styles.toolbar}><Text style={styles.sectionTitle}>Products</Text>{user.role === 'admin' && <Pressable style={styles.smallButton} onPress={() => setEditor(null)}><Text style={styles.smallButtonText}>+ Add</Text></Pressable>}</View><TextInput placeholder="Search products" value={search} onChangeText={setSearch} style={styles.search} placeholderTextColor="#9aa8bb" />{loading ? <ActivityIndicator color={BLUE} style={styles.loader} /> : <FlatList scrollEnabled={false} data={filtered} keyExtractor={item => String(item.id)} renderItem={({ item }) => { const status = stockStatus(item); return <View style={styles.productCard}><View style={styles.productTop}><View style={{ flex: 1 }}><Text style={styles.productName}>{item.name}</Text><Text style={styles.muted}>{money(item.price)} / {item.unit}</Text></View><View style={[styles.badge, { backgroundColor: status.bg }]}><Text style={{ color: status.color, fontSize: 11, fontWeight: '700' }}>{status.label}</Text></View></View><View style={styles.productMeta}><Text style={styles.stockValue}>{item.stock} <Text style={styles.muted}>{item.unit}s</Text></Text><Text style={styles.muted}>Min {item.min_stock}</Text>{user.role === 'admin' ? <View style={styles.inlineActions}><Pressable onPress={() => setEditor(item)}><Text style={styles.link}>Edit</Text></Pressable><Pressable onPress={() => void remove(item)}><Text style={styles.danger}>Delete</Text></Pressable></View> : <Pressable disabled={!item.stock} style={[styles.sellButton, !item.stock && styles.disabled]} onPress={() => setSaleProduct(item)}><Text style={styles.primaryText}>Sell</Text></Pressable>}</View></View>; }} ListEmptyComponent={<Text style={styles.empty}>No products found.</Text>} />}</> : <><Text style={styles.sectionTitle}>Transaction log</Text>{sales.map((sale, index) => <View style={styles.transaction} key={sale.id}><Text style={styles.transactionNumber}>#{String(sales.length - index).padStart(3, '0')}</Text><View style={{ flex: 1 }}><Text style={styles.productName}>{sale.quantity} units sold</Text><Text style={styles.muted}>{sale.cashier_name} · {new Date(sale.created_at).toLocaleTimeString()}</Text></View><Text style={styles.saleTotal}>{money(Number(sale.total))}</Text></View>)}{!sales.length && <Text style={styles.empty}>No transactions yet.</Text>}</>}</ScrollView>{editor !== undefined && <ProductModal product={editor ?? undefined} onClose={() => setEditor(undefined)} onSave={saveProduct} styles={styles} />}{saleProduct && <SaleModal product={saleProduct} onClose={() => setSaleProduct(null)} onSell={sell} styles={styles} />}</SafeAreaView>;
}

function Stat({ label, value, styles }: { label: string; value: string; styles: any }) { return <View style={styles.stat}><Text style={styles.statLabel}>{label}</Text><Text style={styles.statValue}>{value}</Text></View>; }
