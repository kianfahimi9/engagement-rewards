import './globals.css'
import { WhopThemeScript } from "@whop/react";
import { Theme } from "@whop/react/components";
import { WhopProviders } from "@/components/WhopProviders";
import { Toaster } from 'sonner';

export const metadata = {
  title: "Community Engagement Leaderboard",
  description: "Compete, engage, and earn rewards in your Whop community",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <WhopThemeScript />
      </head>
      <body className="antialiased">
        <Theme accentColor="orange">
          <WhopProviders>
            {children}
            <Toaster 
              position="top-right" 
              richColors 
              closeButton
              duration={4000}
            />
          </WhopProviders>
        </Theme>
      </body>
    </html>
  )
}
