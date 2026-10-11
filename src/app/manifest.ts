import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IronPixels - Gamified Fitness RPG",
    short_name: "IronPixels",
    description: "Level up your gains in retro 16-bit pixel art style.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0A",
    theme_color: "#00ff41",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
