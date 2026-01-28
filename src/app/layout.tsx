import type { Metadata } from "next";
import { Bebas_Neue, Cairo, Poppins } from "next/font/google";
import type { ReactNode } from "react";
import { NavigationLoadingBar } from "@/components/ui/NavigationLoadingBar";
import { Preloader } from "@/components/ui/Preloader";
import "./globals.css";

const headingFont = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
});

const bodyFont = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const arabicLuxuryFont = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic"],
  weight: ["400", "700", "900"],
});

const metadataBaseUrl = (() => {
  const fallback = "http://localhost:3000";
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!raw) return new URL(fallback);

  try {
    return new URL(raw);
  } catch {
    try {
      return new URL(`https://${raw}`);
    } catch {
      return new URL(fallback);
    }
  }
})();

export const metadata: Metadata = {
  title: {
    default: "Coach Nasr",
    template: "%s | FIT COACH",
  },
  description:
    "Elite coaching built for serious transformation: strength, fat loss, discipline, and results that show.",
  icons: {
    icon: "/s.png",
  },
  metadataBase: metadataBaseUrl,
  openGraph: {
    title: "Coach Nasr",
    description:
      "Transform your body. Build discipline. Dominate your limits.",
    type: "website",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${headingFont.variable} ${bodyFont.variable} ${arabicLuxuryFont.variable} antialiased`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var k='fitcoach-theme';var v=localStorage.getItem(k);var t=(v==='light'||v==='dark')?v:null;if(!t){t=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';}var r=document.documentElement;if(t==='light'){r.classList.add('theme-light');}else{r.classList.remove('theme-light');}}catch(e){}})();",
          }}
        />
        <NavigationLoadingBar />
        <Preloader />
        {children}
      </body>
    </html>
  );
}
