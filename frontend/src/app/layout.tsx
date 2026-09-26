import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SISTEMA ASSESSMENT - Universidad del Magdalena",
  description: "Plataforma de gestión de Assessment Académico y Acreditación",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-neutral-950 text-neutral-100 min-h-screen antialiased selection:bg-neutral-800 selection:text-white">
        {children}
      </body>
    </html>
  );
}
