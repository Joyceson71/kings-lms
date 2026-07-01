import type { Metadata } from "next";
import { Inter, Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

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
      className={`${inter.variable} ${outfit.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
