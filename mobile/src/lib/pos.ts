export type User = {
  id: number;
  name: string;
  username: string;
  role: "admin" | "cashier";
};
export type Product = {
  id: number;
  name: string;
  unit: string;
  stock: number;
  price: number;
  min_stock: number;
  status: string;
};
export type Sale = {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  cashier_name: string;
  created_at: string;
  cash_received: number | null;
  change_due: number | null;
  payment_method: string;
};
export type Stock = {
  id: number;
  product_name: string;
  quantity: number;
  stock_after: number;
  added_by: string;
  note: string | null;
  created_at: string;
};
export const money = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    Number(value),
  );
export const date = (value: string) =>
  new Date(
    value.includes("T") ? value : value.replace(" ", "T") + "+08:00",
  ).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
export const isBottle = (product: Product) =>
  product.unit.toLowerCase().includes("500");
export const label = (product: Product) =>
  isBottle(product) ? "500 mL bottle" : "Blue gallon";
export const receiptNumber = (sale: Sale) =>
  `#${String(sale.id).padStart(6, "0")}`;
export const message = (error: unknown) =>
  error instanceof Error ? error.message : "Please try again.";
