"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Fingerprint, LayoutDashboard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Smart Attendance",
    description: "Location-aware QR-based attendance with Face Verification and geofencing to prevent proxy attendance.",
    icon: Fingerprint,
    color: "text-blue-400",
  },
  {
    title: "Digital LMS",
    description: "Complete learning management system for notes, assignments, online exams, and a digital library.",
    icon: BookOpen,
    color: "text-purple-400",
  },
  {
    title: "Real-time Analytics",
    description: "Comprehensive dashboards for faculty and admins to track student progress and engagement.",
    icon: LayoutDashboard,
    color: "text-indigo-400",
  },
  {
    title: "Secure Platform",
    description: "Role-based access control, secure authentication, and replay-protection for QR codes.",
    icon: ShieldCheck,
    color: "text-green-400",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden text-foreground">
      {/* Abstract Glowing Backgrounds */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navbar Overlay */}
      <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary),0.5)]">
            <span className="text-primary-foreground font-bold text-xl">K</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-gradient">Kings LMS</span>
        </div>
        <div className="flex gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="hover:bg-white/10 rounded-xl">Sign In</Button>
          </Link>
          <Link href="/dashboard">
            <Button className="rounded-xl shadow-[0_0_15px_rgba(var(--primary),0.5)]">Go to Dashboard</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-7xl px-6 flex flex-col items-center justify-center text-center mt-20 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 mb-8"
        >
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium">Kings Engineering College v2.0 is live</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight"
        >
          The Future of <br className="hidden md:block" />
          <span className="text-gradient">Digital Learning</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl"
        >
          Experience the next generation of campus management. Smart attendance, interactive LMS, online exams, and AI-driven insights — all in one unified platform.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row gap-4"
        >
          <Link href="/dashboard">
            <Button size="lg" className="h-14 px-8 rounded-2xl text-lg shadow-[0_0_20px_rgba(var(--primary),0.6)] hover:scale-105 transition-transform duration-300">
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className="h-14 px-8 rounded-2xl text-lg glass hover:bg-white/10 transition-colors">
              Explore Features
            </Button>
          </Link>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          id="features"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-32 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-20"
        >
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div key={i} className="glass-card p-6 rounded-3xl text-left flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-primary/10 transition-colors duration-500" />
                <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 shadow-inner ${feature.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </motion.div>
      </main>
    </div>
  );
}
