import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login Operative Terminal",
  description: "Sign in to your IronPixels operative account. Track your workouts, dungeon progress, and gear.",
  alternates: {
    canonical: "/login",
  },
  openGraph: {
    title: "Login Operative Terminal | IronPixels",
    description: "Sign in to your IronPixels operative account. Track your workouts, dungeon progress, and gear.",
    url: "https://iron-pixels.vercel.app/login",
    images: [
      {
        url: "/og-image.png",
        width: 1864,
        height: 928,
        alt: "IronPixels - Retro 16-Bit Gamified Fitness RPG Login Terminal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Login Operative Terminal | IronPixels",
    description: "Sign in to your IronPixels operative account. Track your workouts, dungeon progress, and gear.",
    images: ["/og-image.png"],
  },
};

const loginBreadcrumbJsonLd = {
  "@context": "https://schema.org",
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
      name: "Login Operative Terminal",
      item: "https://iron-pixels.vercel.app/login",
    },
  ],
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(loginBreadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
