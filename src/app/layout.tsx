import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { AIAssistant } from "@/components/layout/ai-assistant";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#07090f", // Midnight Obsidian background
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Kings EC Platform | Campus Learning & Management System",
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
        className={`${plusJakarta.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col bg-background text-foreground">
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <AIAssistant />
          </ThemeProvider>
        </body>
      </html>
  );
}
