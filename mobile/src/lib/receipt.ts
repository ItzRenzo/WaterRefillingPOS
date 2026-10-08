import * as Print from "expo-print";
import { Platform } from "react-native";
import { date, money, receiptNumber, type Sale } from "./pos";

const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );
export function receiptHtml(sale: Sale): string {
  const row = (name: string, value: string) =>
    `<div class="row"><span>${escape(name)}</span><strong>${escape(value)}</strong></div>`;
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>@page{margin:8mm}body{font-family:monospace;font-size:12px;color:#000;margin:0}.receipt{max-width:72mm;margin:auto}h1{font-size:16px;text-align:center}p{text-align:center;line-height:1.5}hr{border:0;border-top:1px dashed #888;margin:16px 0}.row{display:flex;justify-content:space-between;gap:12px;margin:8px 0}.total{font-size:16px}</style></head><body><div class="receipt"><h1>RJANE WATER STATION</h1><p>Purified drinking water<br>Cash sale receipt</p><hr>${row("Receipt", receiptNumber(sale))}${row("Date", date(sale.created_at))}${row("Cashier", sale.cashier_name)}<hr><strong>${escape(sale.product_name)}</strong>${row(`${sale.quantity} × ${money(sale.unit_price)}`, money(sale.total))}<hr><div class="total">${row("TOTAL", money(sale.total))}</div>${row("Cash received", sale.cash_received == null ? "Not recorded" : money(sale.cash_received))}${row("Change", sale.change_due == null ? "Not recorded" : money(sale.change_due))}<hr><p>Thank you for choosing RJane!<br>Please come again.</p></div></body></html>`;
}
export async function printReceipt(sale: Sale): Promise<void> {
  const html = receiptHtml(sale);
  if (Platform.OS !== "web") {
    await Print.printAsync({ html });
    return;
  }
  // Expo's web printing prints the current page; isolate the receipt instead.
  const frame = document.createElement("iframe");
  frame.style.cssText =
    "position:fixed;left:-10000px;width:320px;height:600px;border:0";
  await new Promise<void>((resolve, reject) => {
    frame.onload = () => {
      try {
        if (!frame.contentWindow)
          throw new Error("Could not open the receipt.");
        frame.contentWindow.addEventListener(
          "afterprint",
          () => frame.remove(),
          { once: true },
        );
        frame.contentWindow.focus();
        frame.contentWindow.print();
        resolve();
      } catch (error) {
        frame.remove();
        reject(error);
      }
    };
    frame.srcdoc = html;
    document.body.appendChild(frame);
  });
}
