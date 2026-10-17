import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hero Enlistment & Character Creation",
  description:
    "Create your IronPixels hero, select your starter class, distribute attribute points, and set your fitness goals.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
