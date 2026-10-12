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
  keywords: [
    "Tentang IronPixels",
    "fitness RPG retro",
    "Real Volume Score RVS",
    "gym tracker gamifikasi",
    "dungeon workout",
    "multiplayer gym app",
  ],
};

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      "@id": "https://iron-pixels.vercel.app/about#webpage",
      url: "https://iron-pixels.vercel.app/about",
      name: "Tentang IronPixels - Retro 16-Bit Gamified Fitness RPG",
      description:
        "Pelajari filosofi, sistem Real Volume Score (RVS), mekanika raid dungeon 16-bit, dan arsitektur IronPixels.",
      inLanguage: "id-ID",
      isPartOf: {
        "@type": "WebSite",
        "@id": "https://iron-pixels.vercel.app/#website",
      },
      about: {
        "@type": "WebApplication",
        "@id": "https://iron-pixels.vercel.app/#webapp",
      },
      author: {
        "@type": "Person",
        "@id": "https://portfolio-felix-bariq.vercel.app/#person",
        name: "Almakius Felix Bariq Hekopung",
        url: "https://portfolio-felix-bariq.vercel.app",
      },
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://iron-pixels.vercel.app",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "About",
            item: "https://iron-pixels.vercel.app/about",
          },
        ],
      },
    },
  ],
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
      />
      {children}
    </>
  );
}
