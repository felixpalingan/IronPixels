import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tentang IronPixels - Retro 16-Bit Gamified Fitness RPG",
  description:
    "Pelajari filosofi, sistem Real Volume Score (RVS), mekanika raid dungeon 16-bit, dan arsitektur IronPixels. Ubah keringat dan konsistensi gym menjadi kekuatan tempur legendaris.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "Tentang IronPixels | 16-Bit Gamified Fitness RPG & RVS Engine",
    description:
      "Ubah beban angkatan gym menjadi serangan pamungkas menaklukkan bos dungeon 16-bit. Pelajari kalkulasi RVS, sistem party co-op, dan filosofi fair play tanpa pay-to-win.",
    url: "https://iron-pixels.vercel.app/about",
    images: [
      {
        url: "/og-image.png",
        width: 1864,
        height: 928,
        alt: "Tentang IronPixels - 16-Bit Gamified Fitness RPG",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tentang IronPixels - 16-Bit Gamified Fitness RPG",
    description:
      "Ubah beban angkatan gym menjadi serangan pamungkas menaklukkan bos dungeon 16-bit.",
    images: ["/og-image.png"],
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
