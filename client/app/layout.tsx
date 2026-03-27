import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clever Online",
  description: "A digital implementation of Ganz schön clever",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
