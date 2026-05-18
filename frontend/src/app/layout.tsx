import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Product Dashboard",
  description: "Dashboard produktow z backendem Node.js/Express",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full text-slate-900">
        <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col">
          <header className="sticky top-0 z-10 border-b border-sky-200/80 bg-white/85 backdrop-blur">
            <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
              <Link href="/" className="text-lg font-extrabold tracking-tight text-sky-900">
                Product Dashboard
              </Link>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Link href="/" className="rounded-md px-3 py-2 text-slate-700 transition hover:bg-sky-50 hover:text-sky-900">
                  Start
                </Link>
                <Link href="/products" className="rounded-md px-3 py-2 text-slate-700 transition hover:bg-sky-50 hover:text-sky-900">
                  Produkty
                </Link>
                <Link href="/stats" className="rounded-md px-3 py-2 text-slate-700 transition hover:bg-sky-50 hover:text-sky-900">
                  Statystyki
                </Link>
              </div>
            </nav>
          </header>
          <main className="flex flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
