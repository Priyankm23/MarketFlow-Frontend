import type { Metadata, Viewport } from "next";
import { Inter, DM_Sans, DM_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AuthGuard } from "@/components/auth-guard";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600"],
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Markivo \u2014 Where Local Shops Become Global",
  description:
    "Discover products you'll love from verified offline vendors. Shop with fast delivery, secure payments, and thousands of curated products on Markivo.",
  generator: "Next.js",
  applicationName: "Markivo",
  keywords: [
    "marketplace",
    "e-commerce",
    "vendors",
    "shopping",
    "delivery",
    "local shops",
    "online marketplace",
  ],
  icons: {
    icon: [{ url: "/logo/favicon.png", type: "image/png" }],
    shortcut: "/logo/favicon.png",
    apple: "/logo/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://markivo.com",
    siteName: "Markivo",
    title: "Markivo \u2014 Where Local Shops Become Global",
    description:
      "Discover products you'll love from verified offline vendors. Shop with fast delivery, secure payments, and thousands of curated products.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F5FF" },
    { media: "(prefers-color-scheme: dark)", color: "#18181B" },
  ],
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${dmSans.variable} ${dmMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-body antialiased">
        <AuthGuard>
          {children}
          <Analytics />
        </AuthGuard>
      </body>
    </html>
  );
}
