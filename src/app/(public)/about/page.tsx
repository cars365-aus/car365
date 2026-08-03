import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AboutClient } from "./about-client";

export const metadata = {
  title: "About Us",
  description: "Learn about Cars365 — an Australian used-car dealership built on honest inspections, transparent pricing, and a team that helps you buy with confidence.",
};

export default function AboutPage() {
  return <AboutClient header={<SiteHeader />} footer={<SiteFooter />} />;
}
