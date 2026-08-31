import type { Metadata, Viewport } from "next";
import { Inter, Outfit, IBM_Plex_Mono } from "next/font/google";
import { AIAssistant } from "@/components/layout/ai-assistant";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { SWRegistrar } from "@/components/layout/sw-registrar";
import { CapacitorInit } from "@/components/layout/capacitor-init";
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
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" disableTransitionOnChange>
          {children}
          <AIAssistant />
          <Toaster position="top-right" richColors closeButton />
          <SWRegistrar />
          <CapacitorInit />
        </ThemeProvider>
      </body>
    </html>
  );
}
