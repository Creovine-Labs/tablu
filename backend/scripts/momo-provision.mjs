// Provisions an MTN MoMo *sandbox* API User + API Key from your Subscription (Primary) Key.
// Usage: node scripts/momo-provision.mjs <SUBSCRIPTION_KEY>
//   (or set MOMO_SUBSCRIPTION_KEY in backend/.env and run with no arg)
import { randomUUID } from "crypto";
import { readFileSync } from "fs";

const BASE = process.env.MOMO_BASE_URL || "https://sandbox.momodeveloper.mtn.co.rw";

function subKeyFromEnv() {
  try {
    const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
    const m = env.match(/^MOMO_SUBSCRIPTION_KEY="?([^"\n]+)"?/m);
    return m?.[1]?.trim();
  } catch { return undefined; }
}

const SUB_KEY = process.argv[2] || subKeyFromEnv();
if (!SUB_KEY || SUB_KEY.length < 10) {
  console.error("✗ No subscription key. Pass it as an argument or set MOMO_SUBSCRIPTION_KEY in backend/.env");
  process.exit(1);
}

const apiUser = randomUUID();

async function main() {
  // 1) create API user (X-Reference-Id becomes the user id)
  const create = await fetch(`${BASE}/v1_0/apiuser`, {
    method: "POST",
    headers: {
      "X-Reference-Id": apiUser,
      "Ocp-Apim-Subscription-Key": SUB_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ providerCallbackHost: "tablu.app" }),
  });
  if (create.status !== 201) {
    console.error(`✗ Create API user failed: ${create.status} ${await create.text()}`);
    process.exit(1);
  }

  // 2) generate API key for that user
  const keyRes = await fetch(`${BASE}/v1_0/apiuser/${apiUser}/apikey`, {
    method: "POST",
    headers: { "Ocp-Apim-Subscription-Key": SUB_KEY },
  });
  if (keyRes.status !== 201) {
    console.error(`✗ Generate API key failed: ${keyRes.status} ${await keyRes.text()}`);
    process.exit(1);
  }
  const { apiKey } = await keyRes.json();

  console.log("\n✓ Provisioned MoMo sandbox credentials:\n");
  console.log(`MOMO_API_USER="${apiUser}"`);
  console.log(`MOMO_API_KEY="${apiKey}"`);
  console.log("\nAdd these to backend/.env (and Railway Variables).");
}
main();
