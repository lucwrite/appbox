import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AppBox — turn pasted code into a launchable app",
  description:
    "Paste code from your AI assistant, add an icon, and download a single index.html you can double-click to run.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
