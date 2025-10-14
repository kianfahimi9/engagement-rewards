'use client';

import './globals.css'
import { WhopIframeSdkProvider } from "@whop/react";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <WhopIframeSdkProvider>
          {children}
        </WhopIframeSdkProvider>
      </body>
    </html>
  )
}