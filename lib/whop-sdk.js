/**
 * Whop SDK Client Configuration
 * 
 * This initializes the Whop SDK for server-side API calls
 */

import { WhopServerSdk } from "@whop/api";

if (!process.env.WHOP_API_KEY) {
  throw new Error("WHOP_API_KEY is not set in environment variables");
}

if (!process.env.NEXT_PUBLIC_WHOP_APP_ID) {
  throw new Error("NEXT_PUBLIC_WHOP_APP_ID is not set in environment variables");
}

export const whopSdk = WhopServerSdk({
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID,
  appApiKey: process.env.WHOP_API_KEY,
  onBehalfOfUserId: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID,
  companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
});

console.log("✅ Whop SDK initialized with:", {
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID,
  companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
  agentUserId: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID,
});
