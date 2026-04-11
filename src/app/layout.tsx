import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/components/layout/Providers";

export const metadata: Metadata = {
  title: {
    default: "WriteSpace — Where Great Writing Lives",
    template: "%s | WriteSpace",
  },
  description:
    "WriteSpace is a publishing platform for serious writers. Share your ideas, build your audience, and connect with readers who care about depth.",
  keywords: ["blogging", "writing", "publishing", "articles", "content"],
  authors: [{ name: "WriteSpace" }],
  creator: "WriteSpace",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "WriteSpace",
    title: "WriteSpace — Where Great Writing Lives",
    description:
      "A next-generation blogging platform built for serious writers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "WriteSpace — Where Great Writing Lives",
    description: "A next-generation blogging platform built for serious writers.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#0a0e1a" },
    { media: "(prefers-color-scheme: light)", color: "#fafbff" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <Providers>
          <Sidebar>
            <main id="main-content">{children}</main>
            <Footer />
          </Sidebar>
        </Providers>
      </body>
    </html>
  );
}
