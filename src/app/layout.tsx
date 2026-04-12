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
    <html lang="en" data-theme="midnight" suppressHydrationWarning>
      <body>
        {/* Inline script runs before React hydration — prevents theme flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('ws-theme');if(t)document.documentElement.setAttribute('data-theme',t);var a=localStorage.getItem('ws-accent');if(a){var p=JSON.parse(a);var h=p.h,s=p.s;if(h!==undefined){var r=document.documentElement;r.style.setProperty('--brand-300','hsl('+h+','+s+'%,78%)');r.style.setProperty('--brand-400','hsl('+h+','+s+'%,65%)');r.style.setProperty('--brand-500','hsl('+h+','+s+'%,54%)');r.style.setProperty('--brand-600','hsl('+h+','+s+'%,43%)');r.style.setProperty('--brand-700','hsl('+h+','+s+'%,34%)');r.style.setProperty('--ring-color','hsla('+h+','+s+'%,54%,0.22%)');}}}catch(e){}`,
          }}
        />
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
