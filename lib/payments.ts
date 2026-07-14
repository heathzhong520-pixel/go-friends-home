import { createDecipheriv, createSign, createVerify, randomBytes } from "node:crypto";
import { AlipaySdk } from "alipay-sdk";

type PayOrder = { orderNo: string; subject: string; amountCents: number };

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value.replaceAll("\\n", "\n");
}

function alipay() {
  return new AlipaySdk({
    appId: required("ALIPAY_APP_ID"),
    privateKey: required("ALIPAY_PRIVATE_KEY"),
    alipayPublicKey: required("ALIPAY_PUBLIC_KEY"),
    gateway: process.env.ALIPAY_GATEWAY ?? "https://openapi.alipay.com/gateway.do",
    signType: "RSA2",
  });
}

export function createAlipayUrl(order: PayOrder) {
  const base = process.env.APP_URL ?? "http://gofren.cn:8081";
  return alipay().pageExecute("alipay.trade.page.pay", "GET", {
    notifyUrl: new URL("/api/payments/alipay/notify", base).toString(),
    returnUrl: new URL(`/account?order=${encodeURIComponent(order.orderNo)}`, base).toString(),
    bizContent: {
      out_trade_no: order.orderNo,
      product_code: "FAST_INSTANT_TRADE_PAY",
      subject: order.subject,
      total_amount: (order.amountCents / 100).toFixed(2),
      timeout_express: "30m",
    },
  });
}

export function verifyAlipayNotification(payload: Record<string, string>) {
  return alipay().checkNotifySignV2(payload);
}

function wechatAuthorization(method: string, pathname: string, body: string) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(16).toString("hex");
  const message = `${method}\n${pathname}\n${timestamp}\n${nonce}\n${body}\n`;
  const signer = createSign("RSA-SHA256");
  signer.update(message);
  const signature = signer.sign(required("WECHAT_PRIVATE_KEY"), "base64");
  return `WECHATPAY2-SHA256-RSA2048 mchid="${required("WECHAT_MCH_ID")}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="${required("WECHAT_CERT_SERIAL")}",signature="${signature}"`;
}

export async function createWechatNativeOrder(order: PayOrder) {
  const pathname = "/v3/pay/transactions/native";
  const base = process.env.APP_URL ?? "http://gofren.cn:8081";
  const body = JSON.stringify({
    appid: required("WECHAT_APP_ID"), mchid: required("WECHAT_MCH_ID"), description: order.subject,
    out_trade_no: order.orderNo, notify_url: new URL("/api/payments/wechat/notify", base).toString(),
    amount: { total: order.amountCents, currency: "CNY" },
  });
  const response = await fetch(`https://api.mch.weixin.qq.com${pathname}`, { method: "POST", headers: { Authorization: wechatAuthorization("POST", pathname, body), Accept: "application/json", "Content-Type": "application/json", "User-Agent": "GoFriends/1.0" }, body });
  const result = await response.json() as { code_url?: string; message?: string };
  if (!response.ok || !result.code_url) throw new Error(result.message ?? "WeChat Pay request failed");
  return result.code_url;
}

export function verifyWechatNotification(headers: Headers, body: string) {
  const timestamp = headers.get("wechatpay-timestamp") ?? "";
  const nonce = headers.get("wechatpay-nonce") ?? "";
  const signature = headers.get("wechatpay-signature") ?? "";
  const verifier = createVerify("RSA-SHA256");
  verifier.update(`${timestamp}\n${nonce}\n${body}\n`);
  return verifier.verify(required("WECHAT_PLATFORM_PUBLIC_KEY"), signature, "base64");
}

export function decryptWechatResource(resource: { associated_data: string; nonce: string; ciphertext: string }) {
  const encrypted = Buffer.from(resource.ciphertext, "base64");
  const authTag = encrypted.subarray(encrypted.length - 16);
  const ciphertext = encrypted.subarray(0, encrypted.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(required("WECHAT_API_V3_KEY")), Buffer.from(resource.nonce));
  decipher.setAuthTag(authTag);
  decipher.setAAD(Buffer.from(resource.associated_data));
  return JSON.parse(Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8")) as { out_trade_no: string; transaction_id: string; trade_state: string; amount: { total: number } };
}
