import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About IronPixels - 16-Bit Gamified Fitness RPG",
  description:
    "Discover the philosophy, Real Volume Score (RVS) mechanics, 16-bit co-op dungeon raids, and tech architecture of IronPixels. Transform your gym workouts into legendary hero power.",
  alternates: {
    canonical: "/about",
    languages: {
      "en-US": "/about",
      "id-ID": "/about",
    },
  },
  openGraph: {
    title: "About IronPixels | 16-Bit Gamified Fitness RPG & RVS Engine",
    description:
      "Convert real-world gym volume into dungeon-slaying strike power. Learn the RVS formula, co-op guild raids, and 100% fair play mechanics.",
    url: "https://iron-pixels.vercel.app/about",
    locale: "en_US",
    alternateLocale: ["id_ID"],
    images: [
      {
        url: "/og-image.png",
        width: 1864,
        height: 928,
        alt: "About IronPixels - 16-Bit Gamified Fitness RPG",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About IronPixels - 16-Bit Gamified Fitness RPG",
    description:
      "Transform your gym workouts into devastating attacks to conquer 16-bit dungeon bosses.",
    images: ["/og-image.png"],
  },
  keywords: [
    "About IronPixels",
    "16-bit fitness RPG",
    "Real Volume Score RVS",
    "gamified workout tracker",
    "retro gym RPG",
    "co-op dungeon workout",
    "multiplayer fitness quest",
    "Tentang IronPixels",
    "fitness RPG retro",
    "gym tracker gamifikasi",
  ],
};

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      "@id": "https://iron-pixels.vercel.app/about#webpage",
      url: "https://iron-pixels.vercel.app/about",
      name: "About IronPixels - 16-Bit Gamified Fitness RPG",
      description:
        "Learn the philosophy, Real Volume Score (RVS) system, 16-bit dungeon raid mechanics, and full-stack architecture of IronPixels.",
      inLanguage: ["en-US", "id-ID"],
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
    {
      "@type": "FAQPage",
      "@id": "https://iron-pixels.vercel.app/about#faq",
      isPartOf: {
        "@type": "AboutPage",
        "@id": "https://iron-pixels.vercel.app/about#webpage",
      },
      mainEntity: [
        {
          "@type": "Question",
          name: "What is IronPixels?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "IronPixels is a gamified 16-bit retro RPG fitness tracker. Every rep and kilo you lift in the gym transforms into attack power to defeat dungeon bosses, forge rare gear, and complete co-op raids with friends.",
          },
        },
        {
          "@type": "Question",
          name: "How does the Real Volume Score (RVS) damage calculation work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "RVS is calculated with a precise mathematical formula: Lifted Weight (kg) × Reps × Bodyweight Ratio (% BW) × Exercise Multiplier. Heavy compound movements like Squats and Deadlifts grant higher multipliers than isolation work, creating a balanced and fair playing field across all bodyweight classes.",
          },
        },
        {
          "@type": "Question",
          name: "Does logging workouts restore my hero's health (HP)?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes! Completing any logged gym session instantly restores 100% of your hero's HP and wipes out daily boss absence damage penalties. As long as you stay active, your hero stays battle-ready.",
          },
        },
        {
          "@type": "Question",
          name: "Is there any pay-to-win mechanism using real money?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Zero pay-to-win. IronPixels is 100% free to play and upholds strict athletic fair play. All gold, loot chests, weapons, and blacksmith upgrades are earned purely from your sweat and iron in the real world.",
          },
        },
        {
          "@type": "Question",
          name: "How do Co-Op Dungeon Raids with friends work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "You can create or join a Party (guild) in the Social tab. When you or any guildmate completes a gym workout, the resulting training volume cuts into the shared floor boss's HP in real time via WebSockets.",
          },
        },
        {
          "@type": "Question",
          name: "What happens if I take a Rest Day?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Rest days are vital for muscular hypertrophy and recovery. Daily boss penalties in the dungeon do not wipe out your hero over 1–2 rest days. Take your rest days with peace of mind—your hero will fully recover upon your next logged session.",
          },
        },
      ],
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
