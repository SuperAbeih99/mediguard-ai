import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./_providers/AuthContext";
import { QueryProvider } from "./_providers/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MediGuard AI",
  description: "AI-powered hospital bill analyzer and negotiator.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen bg-slate-50 text-slate-900`}
      >
        <AuthProvider>
          <QueryProvider>
            <div className="min-h-screen">{children}</div>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
