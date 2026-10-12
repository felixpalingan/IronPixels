import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tentang IronPixels - Fitness RPG 16-Bit",
  description:
    "Pelajari filosofi, sistem Real Volume Score (RVS), mekanika raid dungeon 16-bit, dan arsitektur IronPixels. Ubah konsistensi gym jadi kekuatan tempur heromu.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "Tentang IronPixels | 16-Bit Gamified Fitness RPG & RVS Engine",
    description:
      "Ubah beban angkatan gym menjadi serangan penakluk bos dungeon 16-bit. Pelajari formula RVS, co-op raid party, dan sistem fair play tanpa pay-to-win.",
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
      name: "Tentang IronPixels - Fitness RPG 16-Bit",
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
          name: "Apa itu IronPixels?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "IronPixels adalah aplikasi gamified fitness tracker bergaya retro 16-bit RPG. Setiap repetisi dan beban yang kamu angkat di gym otomatis diubah menjadi kekuatan serangan untuk mengalahkan bos dungeon, membuka senjata langka, dan menyelesaikan misi bersama teman.",
          },
        },
        {
          "@type": "Question",
          name: "Bagaimana cara kerja penghitungan damage RVS (Real Volume Score)?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "RVS dihitung berdasarkan formula matematis: Beban Angkatan (kg) × Repetisi × Rasio Berat Badan (% BW) × Multiplier Gerakan. Gerakan compound berat seperti Squat dan Deadlift memiliki kontribusi multiplier lebih besar daripada gerakan isolasi, sehingga sistem adil bagi semua rentang berat badan.",
          },
        },
        {
          "@type": "Question",
          name: "Apakah mencatat workout memulihkan darah (HP) hero?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Ya! Setiap kali kamu menyelesaikan satu sesi workout di gym, hero kamu langsung pulih 100% HP dan penalti serangan bos harian otomatis terhapus. Selama kamu konsisten berlatih, heromu akan selalu bugar dan siap menjelajah dungeon.",
          },
        },
        {
          "@type": "Question",
          name: "Apakah ada sistem pay-to-win menggunakan uang asli?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Tidak ada sama sekali. IronPixels 100% gratis dimainkan dan menjunjung tinggi fair play. Semua gold, peti hadiah, senjata, dan upgrade blacksmith diperoleh murni dari kerja keras fisikmu saat berlatih di gym.",
          },
        },
        {
          "@type": "Question",
          name: "Bagaimana cara bermain Co-Op Dungeon Raid bersama teman?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Kamu bisa membuat atau bergabung ke dalam Party (guild) di tab Social. Saat kamu atau teman satu party menyelesaikan workout di gym, damage dari volume latihan tersebut langsung memotong HP bos lantai yang sama secara real-time via WebSockets.",
          },
        },
        {
          "@type": "Question",
          name: "Bagaimana jika saya perlu mengambil Rest Day (Hari Istirahat)?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Istirahat adalah bagian penting dari pertumbuhan otot. Serangan bos harian di lantai dungeon tidak langsung menghabiskan darah hero dalam 1-2 hari. Kamu bisa beristirahat dengan tenang selama 1–2 hari, lalu darah heromu akan kembali penuh begitu sesi latihan berikutnya selesai dicatat.",
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
