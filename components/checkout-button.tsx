"use client";

import Image from "next/image";
import { useState } from "react";

export function CheckoutButton({ productId, priceCents, testEnabled = false }: { productId: string; priceCents: number; testEnabled?: boolean }) {
  const [method, setMethod] = useState<"alipay" | "wechat" | "test">("alipay");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [qrCode, setQrCode] = useState("");
  async function checkout() {
    setBusy(true); setError(""); setQrCode("");
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId, paymentMethod: method }) });
      const data = await response.json() as { error?: string; paymentUrl?: string; qrCode?: string; redirectUrl?: string };
      if (response.status === 401) { window.location.assign("/login?returnTo=" + encodeURIComponent(window.location.pathname)); return; }
      if (!response.ok) throw new Error(data.error ?? "无法创建订单");
      if (data.paymentUrl) window.location.assign(data.paymentUrl);
      else if (data.redirectUrl) window.location.assign(data.redirectUrl);
      else if (data.qrCode) setQrCode(data.qrCode);
    } catch (error) { setError(error instanceof Error ? error.message : "无法创建订单"); }
    finally { setBusy(false); }
  }

  return <div className="checkout-box">
    <div className="pay-methods" role="group" aria-label="支付方式">
      <button className={method === "alipay" ? "active" : ""} type="button" onClick={() => setMethod("alipay")}>支付宝</button>
      <button className={method === "wechat" ? "active" : ""} type="button" onClick={() => setMethod("wechat")}>微信支付</button>
      {testEnabled && <button className={method === "test" ? "active" : ""} type="button" onClick={() => setMethod("test")}>测试支付</button>}
    </div>
    <button className="button checkout-submit" type="button" onClick={checkout} disabled={busy}>{busy ? "正在创建订单…" : `立即购买 ¥${(priceCents / 100).toFixed(2)}`}<span>→</span></button>
    {qrCode && <div className="wechat-qr"><Image unoptimized src={qrCode} alt="微信支付二维码" width={260} height={260} /><p>请使用微信扫码完成支付，支付后在用户中心查看授权。</p></div>}
    {error && <p className="form-message error">{error}</p>}
  </div>;
}
