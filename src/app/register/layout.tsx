import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register",
  description: "Create your IronPixels warrior account. Turn real-life gym volume into 16-bit RPG power.",
  alternates: {
    canonical: "/register",
  },
  openGraph: {
    title: "Register | IronPixels",
    description: "Create your IronPixels warrior account. Turn real-life gym volume into 16-bit RPG power.",
    url: "https://iron-pixels.vercel.app/register",
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
