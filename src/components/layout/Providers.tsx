"use client";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AccentProvider } from "@/components/layout/AccentProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <AccentProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-default)",
                borderRadius: "12px",
                fontFamily: "Inter, sans-serif",
                fontSize: "0.875rem",
              },
              success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
              error:   { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
            }}
          />
        </AccentProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
