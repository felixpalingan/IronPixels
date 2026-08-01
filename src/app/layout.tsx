import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IronPixels - Gamified Fitness RPG",
  description: "Level up your gains in retro 16-bit pixel art style.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#0A0A0A] text-[#e5e2e1]">
        {children}
      </body>
    </html>
  );
}
