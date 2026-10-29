import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeplHoy — La información que mueve el futuro",
  description:
    "Noticias claras sobre tecnología, inteligencia artificial e ideas que están cambiando el mundo.",
  generator: "DeplHoy",
  icons: {
    icon: [
      { url: "/deplhoy-logo.png?v=3", sizes: "32x32", type: "image/png" },
      { url: "/deplhoy-logo.png?v=3", sizes: "64x64", type: "image/png" },
      { url: "/deplhoy-logo.png?v=3", sizes: "192x192", type: "image/png" },
      { url: "/deplhoy-logo.png?v=3", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/deplhoy-logo.png?v=3", type: "image/png" }],
    apple: [
      { url: "/deplhoy-logo.png?v=3", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f4f1eb",
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
