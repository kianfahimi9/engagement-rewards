'use client';

import { WhopIframeSdkProvider } from "@whop/react";

export function WhopProviders({ children }) {
  return <WhopIframeSdkProvider>{children}</WhopIframeSdkProvider>;
}
