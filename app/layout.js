'use client';

import './globals.css'
import { WhopProvider } from "@whop/react";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <WhopProvider
          appId={process.env.NEXT_PUBLIC_WHOP_APP_ID}
        >
          {children}
        </WhopProvider>
      </body>
    </html>
  )
}