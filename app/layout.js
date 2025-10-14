'use client';

import './globals.css'
import { WhopIframeSdkProvider, WhopThemeScript } from "@whop/react";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <WhopThemeScript />
      </head>
      <body>
        <WhopIframeSdkProvider>
          {children}
        </WhopIframeSdkProvider>
      </body>
    </html>
  )
}