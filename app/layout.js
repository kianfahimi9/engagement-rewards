'use client';

import './globals.css'
import { WhopIframeSdkProvider, WhopThemeScript } from "@whop/react";
import { Theme } from "@whop/react/components";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <WhopThemeScript />
      </head>
      <body>
        <Theme accentColor="orange">
          <WhopIframeSdkProvider>
            {children}
          </WhopIframeSdkProvider>
        </Theme>
      </body>
    </html>
  )
}