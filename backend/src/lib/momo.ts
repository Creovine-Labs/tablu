import { randomUUID } from "crypto";

const SUB_KEY = process.env.MOMO_SUBSCRIPTION_KEY || "";
const API_USER = process.env.MOMO_API_USER || "";
const API_KEY = process.env.MOMO_API_KEY || "";
const TARGET = process.env.MOMO_TARGET_ENVIRONMENT || "sandbox";
const BASE = TARGET === "sandbox"
  ? "https://sandbox.momodeveloper.mtn.com"
  : "https://proxy.momoapi.mtn.com";
// Sandbox only settles in EUR; production uses local currency.
const CURRENCY = TARGET === "sandbox" ? "EUR" : "RWF";

export const momoConfigured = Boolean(SUB_KEY && API_USER && API_KEY);

async function getToken(): Promise<string> {
  const basic = Buffer.from(`${API_USER}:${API_KEY}`).toString("base64");
  const res = await fetch(`${BASE}/collection/token/`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Ocp-Apim-Subscription-Key": SUB_KEY },
  });
  if (!res.ok) throw new Error(`MoMo token failed: ${res.status}`);
  return (await res.json()).access_token as string;
}

export type MomoStatus = "PENDING" | "SUCCESSFUL" | "FAILED";

/** Initiate a request-to-pay. Returns the reference id used to poll status. */
export async function requestToPay(amountRwf: number, phone: string, orderId: string): Promise<string> {
  const token = await getToken();
  const referenceId = randomUUID();
  const res = await fetch(`${BASE}/collection/v1_0/requesttopay`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Reference-Id": referenceId,
      "X-Target-Environment": TARGET,
      "Ocp-Apim-Subscription-Key": SUB_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: String(amountRwf),
      currency: CURRENCY,
      externalId: orderId,
      payer: { partyIdType: "MSISDN", partyId: phone.replace(/\D/g, "") },
      payerMessage: "Tablu order payment",
      payeeNote: "Tablu",
    }),
  });
  if (res.status !== 202) throw new Error(`MoMo requesttopay failed: ${res.status} ${await res.text()}`);
  return referenceId;
}

export async function getPaymentStatus(referenceId: string): Promise<MomoStatus> {
  const token = await getToken();
  const res = await fetch(`${BASE}/collection/v1_0/requesttopay/${referenceId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Target-Environment": TARGET,
      "Ocp-Apim-Subscription-Key": SUB_KEY,
    },
  });
  if (!res.ok) throw new Error(`MoMo status failed: ${res.status}`);
  return (await res.json()).status as MomoStatus;
}
