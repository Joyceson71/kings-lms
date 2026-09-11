import type { Metadata, Viewport } from "next";
import { Inter, Outfit, IBM_Plex_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { SWRegistrar } from "@/components/layout/sw-registrar";
import { CapacitorInit } from "@/components/layout/capacitor-init";
import { LeafletStylesLoader } from "@/components/layout/leaflet-styles-loader";
import { BobChat } from "@/components/layout/bob-chat";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap", preload: false });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap", preload: false });
const ibmPlexMono = IBM_Plex_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-ibm-plex-mono", display: "swap", preload: false });

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    template: "%s | Kings EC Platform",
    default: "Kings EC Platform | Campus Learning & Management System",
  },
  description:
    "Kings Engineering College Campus — the all-in-one learning management platform for students, faculty, and administration. Track attendance, manage courses, and stay on top of academics.",
  keywords: ["Kings EC", "LMS", "Campus", "Attendance", "Courses", "College"],
  authors: [{ name: "Kings Engineering College" }],
  creator: "Kings EC Platform",
  openGraph: {
    type: "website",
    locale: "en_IN",
    title: "Kings EC Platform",
    description: "Campus Learning & Management System",
    siteName: "Kings EC Platform",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} ${ibmPlexMono.variable} font-sans h-full antialiased overflow-x-hidden`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground overflow-x-hidden w-full">
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          {/* Ambient Background Layers */}
          <div className="fixed inset-0 z-[-1] bg-anime-orbs animate-spin-slow opacity-20 pointer-events-none" />
          <div className="fixed inset-0 z-[-1] bg-scanlines opacity-[0.15] pointer-events-none" />
          <div className="fixed inset-0 z-[-1] bg-mesh opacity-30 pointer-events-none" />
          
          <main className="flex-1 flex flex-col relative z-0 w-full h-full min-h-screen">
            {children}
          </main>
          
          <Toaster position="top-right" richColors closeButton />
          <SWRegistrar />
          <CapacitorInit />
          <LeafletStylesLoader />
          <BobChat />
        </ThemeProvider>
      </body>
    </html>
  );
}
