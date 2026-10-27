import type { Metadata } from "next";
import { Suspense, type CSSProperties } from "react";
import { DEFAULT_THEME, themeVariables } from "@/lib/themes/themes";
import { ThemeRoot } from "./components/theme-root";
import "./globals.css";
import "./retro.css";

export const metadata: Metadata = {
  title: "Life Planner",
  description: "A little space for your everyday.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col" style={themeVariables(DEFAULT_THEME) as CSSProperties}>
        <Suspense fallback={<div className="theme-root"><main className="planner-shell"><p role="status">Opening your planner...</p></main></div>}>
          <ThemeRoot>{children}</ThemeRoot>
        </Suspense>
      </body>
    </html>
  );
}

