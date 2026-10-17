import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Enlist Hero Account",
  description: "Create your IronPixels warrior account. Turn real-life gym volume into 16-bit RPG power.",
  alternates: {
    canonical: "/register",
  },
  openGraph: {
    title: "Enlist Hero Account | IronPixels",
    description: "Create your IronPixels warrior account. Turn real-life gym volume into 16-bit RPG power.",
    url: "https://iron-pixels.vercel.app/register",
    images: [
      {
        url: "/og-image.png",
        width: 1864,
        height: 928,
        alt: "IronPixels - Retro 16-Bit Gamified Fitness RPG Hero Enlistment",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Enlist Hero Account | IronPixels",
    description: "Create your IronPixels warrior account. Turn real-life gym volume into 16-bit RPG power.",
    images: ["/og-image.png"],
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
