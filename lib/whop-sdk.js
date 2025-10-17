/**
 * Whop SDK Client Configuration
 * 
 * This initializes the Whop SDK for server-side API calls
 */

import Whop from "@whop/sdk";

if (!process.env.WHOP_API_KEY) {
  throw new Error("WHOP_API_KEY is not set in environment variables");
}

if (!process.env.NEXT_PUBLIC_WHOP_APP_ID) {
  throw new Error("NEXT_PUBLIC_WHOP_APP_ID is not set in environment variables");
}

// Initialize the NEW Whop SDK
export const whopSdk = new Whop({
  appID: process.env.NEXT_PUBLIC_WHOP_APP_ID,
  apiKey: process.env.WHOP_API_KEY,
});

console.log("✅ Whop SDK (NEW) initialized with:", {
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID,
});
