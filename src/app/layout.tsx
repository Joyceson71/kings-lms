import type { Metadata, Viewport } from "next";
import { AIAssistant } from "@/components/layout/ai-assistant";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
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
      className={`font-sans h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
          <AIAssistant />
        </ThemeProvider>
      </body>
    </html>
  );
}
