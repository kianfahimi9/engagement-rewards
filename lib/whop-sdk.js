/**
 * Whop SDK Client Configuration
 * 
 * Uses @whop/api (WhopServerSdk) for payment methods (chargeUser, payUser)
 * Uses @whop/sdk for newer API methods
 */

import Whop from "@whop/sdk";
import { WhopServerSdk } from "@whop/api";

if (!process.env.WHOP_API_KEY) {
  throw new Error("WHOP_API_KEY is not set in environment variables");
}

if (!process.env.NEXT_PUBLIC_WHOP_APP_ID) {
  throw new Error("NEXT_PUBLIC_WHOP_APP_ID is not set in environment variables");
}

// Initialize @whop/sdk for newer API methods
export const whopSdk = new Whop({
  appID: process.env.NEXT_PUBLIC_WHOP_APP_ID,
  apiKey: process.env.WHOP_API_KEY,
});

// Initialize @whop/api for payment methods (chargeUser, payUser)
export const whopApiClient = WhopServerSdk({
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID,
  appApiKey: process.env.WHOP_API_KEY,
});

console.log("✅ Whop clients initialized:", {
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID,
});
