import CanvasCursor from "@/components/landing/CanvasCursor";
import CTA from "@/components/landing/CTA";
import Features from "@/components/landing/Features";
import Footer from "@/components/landing/Footer";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import "@/components/landing/landing.css";
import Navbar from "@/components/landing/Navbar";
import PageFrame from "@/components/landing/PageFrame";
import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    document.title = "Assignment Integrity Analyzer";
    const meta = document.querySelector('meta[name="description"]');
    const desc = "AI-powered plagiarism, paraphrasing, and semantic similarity detection for modern academia.";
    if (meta) meta.setAttribute("content", desc);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = desc;
      document.head.appendChild(m);
    }
  }, []);

  return (
    <main className="landing-page min-h-screen bg-background text-foreground overflow-x-hidden">
      <CanvasCursor />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-20 landing-ruler opacity-20" aria-hidden />
      <PageFrame />
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
      <Footer />
    </main>
  );
};

export default Index;
