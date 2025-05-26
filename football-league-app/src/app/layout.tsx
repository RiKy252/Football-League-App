import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Server-side import for monitoring (only runs on the server)
import '@/lib/init-monitoring';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Football League Manager",
  description: "Next.js project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
