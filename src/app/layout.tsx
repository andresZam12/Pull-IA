import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Deplhoy — Noticias Tech e Inteligencia para Desarrolladores",
  description:
    "El pulso diario sobre IA, ingeniería de software, modelos y empleabilidad. Resúmenes bilingües con IA impulsados por la arquitectura PULL-IA.",
  icons: {
    icon: [
      { url: "/deplhoy-logo.png?v=2", sizes: "32x32", type: "image/png" },
      { url: "/deplhoy-logo.png?v=2", sizes: "64x64", type: "image/png" },
      { url: "/deplhoy-logo.png?v=2", sizes: "192x192", type: "image/png" },
      { url: "/deplhoy-logo.png?v=2", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/deplhoy-logo.png?v=2", type: "image/png" }],
    apple: [
      { url: "/deplhoy-logo.png?v=2", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        {children}
      </body>
    </html>
  );
}
