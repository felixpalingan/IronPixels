import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#00ff41",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://iron-pixels.vercel.app"),
  title: {
    default: "IronPixels - Retro 16-Bit Gamified Fitness RPG",
    template: "%s | IronPixels",
  },
  description: "Transform gym volume and workout logs into 16-bit RPG power. Slay dungeon bosses, forge mythical equipment, and team up for real-time co-op raids.",
  keywords: [
    "IronPixels",
    "fitness RPG",
    "gym tracker gamification",
    "retro workout tracker",
    "pixel art gym app",
    "16-bit workout",
    "gym level up",
    "solo leveling gym",
  ],
  authors: [{ name: "Almakius Felix Bariq Hekopung", url: "https://portfolio-felix-bariq.vercel.app" }],
  creator: "Almakius Felix Bariq Hekopung",
  publisher: "Almakius Felix Bariq Hekopung",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "IronPixels",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    alternateLocale: ["en_US"],
    url: "https://iron-pixels.vercel.app",
    siteName: "IronPixels",
    title: "IronPixels - Retro 16-Bit Gamified Fitness RPG",
    description: "Transform gym volume into RPG combat power, raid dungeon bosses, and conquer fitness quests.",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "IronPixels Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IronPixels - Gamified Fitness RPG",
    description: "Level up your gym workouts with retro 16-bit RPG mechanics.",
    images: ["/icon.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "u4LJw861Sd1D-bEjorhvvNzYhsOaDRd8unleA61RqHg",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": "https://iron-pixels.vercel.app/#webapp",
      name: "IronPixels",
      url: "https://iron-pixels.vercel.app",
      applicationCategory: "HealthApplication",
      genre: "Fitness RPG",
      operatingSystem: "All",
      browserRequirements: "Requires JavaScript. Requires HTML5.",
      description:
        "Transform gym volume and workout logs into 16-bit RPG power. Slay dungeon bosses, forge mythical equipment, and team up for real-time co-op raids.",
      author: {
        "@type": "Person",
        "@id": "https://portfolio-felix-bariq.vercel.app/#person",
        name: "Almakius Felix Bariq Hekopung",
        url: "https://portfolio-felix-bariq.vercel.app",
      },
      creator: {
        "@type": "Person",
        "@id": "https://portfolio-felix-bariq.vercel.app/#person",
      },
      publisher: {
        "@type": "Person",
        "@id": "https://portfolio-felix-bariq.vercel.app/#person",
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      image: "https://iron-pixels.vercel.app/icon.png",
    },
    {
      "@type": "WebSite",
      "@id": "https://iron-pixels.vercel.app/#website",
      url: "https://iron-pixels.vercel.app",
      name: "IronPixels",
      description: "Retro 16-Bit Gamified Fitness RPG",
      inLanguage: ["id", "en"],
      publisher: {
        "@type": "Person",
        "@id": "https://portfolio-felix-bariq.vercel.app/#person",
        name: "Almakius Felix Bariq Hekopung",
        url: "https://portfolio-felix-bariq.vercel.app",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased bg-[#0A0A0A] text-[#e5e2e1]">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
