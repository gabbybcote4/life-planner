import type { Metadata } from "next";
import { Suspense } from "react";
import { ThemeRoot } from "./components/theme-root";
import "./globals.css";

export const metadata: Metadata = {
  title: "Life Planner",
  description: "A little space for your everyday.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Suspense fallback={<div className="theme-root"><main className="planner-shell"><p role="status">Opening your planner...</p></main></div>}>
          <ThemeRoot>{children}</ThemeRoot>
        </Suspense>
      </body>
    </html>
  );
}
