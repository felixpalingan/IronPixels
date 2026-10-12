import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your IronPixels operative account. Track your workouts, dungeon progress, and gear.",
  alternates: {
    canonical: "/login",
  },
  openGraph: {
    title: "Login | IronPixels",
    description: "Sign in to your IronPixels operative account. Track your workouts, dungeon progress, and gear.",
    url: "https://iron-pixels.vercel.app/login",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
