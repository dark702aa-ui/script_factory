import type { Metadata } from "next";
import { Rajdhani, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--display-font",
});
const body = Inter({ subsets: ["latin"], variable: "--body-font" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--mono-font" });

export const metadata: Metadata = {
  title: "Script Factory",
  description: "AI FiveM Script Generator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
