"use client";

import Image from "next/image";
import { useState, useSyncExternalStore } from "react";
import { useLocale } from "./locale-provider";

const subscribe = () => () => {};

export function CheckoutButton({ productId, priceCents, testEnabled = false }: { productId: string; priceCents: number; testEnabled?: boolean }) {
  const { locale, dictionary } = useLocale();
  const copy = dictionary.products;
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const [method, setMethod] = useState<"alipay" | "wechat" | "test">("alipay");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [qrCode, setQrCode] = useState("");
  async function checkout() {
    setBusy(true); setError(""); setQrCode("");
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json", "x-gofriends-locale": locale }, body: JSON.stringify({ productId, paymentMethod: method }) });
      const data = await response.json() as { error?: string; paymentUrl?: string; qrCode?: string; redirectUrl?: string };
      if (response.status === 401) { window.location.assign("/login?returnTo=" + encodeURIComponent(window.location.pathname)); return; }
      if (!response.ok) throw new Error(data.error ?? copy.createOrderFailed);
      if (data.paymentUrl) window.location.assign(data.paymentUrl);
      else if (data.redirectUrl) window.location.assign(data.redirectUrl);
      else if (data.qrCode) setQrCode(data.qrCode);
    } catch (error) { setError(error instanceof Error ? error.message : copy.createOrderFailed); }
    finally { setBusy(false); }
  }

  return <div className="checkout-box">
    <div className="pay-methods" role="group" aria-label={copy.paymentMethod}>
      <button className={method === "alipay" ? "active" : ""} type="button" disabled={!hydrated} onClick={() => setMethod("alipay")}>{copy.alipay}</button>
      <button className={method === "wechat" ? "active" : ""} type="button" disabled={!hydrated} onClick={() => setMethod("wechat")}>{copy.wechat}</button>
      {testEnabled && <button className={method === "test" ? "active" : ""} type="button" disabled={!hydrated} onClick={() => setMethod("test")}>{copy.testPay}</button>}
    </div>
    <button className="button checkout-submit" type="button" onClick={checkout} disabled={busy || !hydrated}>{busy ? copy.creatingOrder : `${copy.buyNow} ¥${(priceCents / 100).toFixed(2)}`}<span>→</span></button>
    {qrCode && <div className="wechat-qr"><Image unoptimized src={qrCode} alt={copy.wechat} width={260} height={260} /><p>{copy.scanWechat}</p></div>}
    {error && <p className="form-message error">{error}</p>}
  </div>;
}
