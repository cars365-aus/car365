import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AboutClient } from "./about-client";

export const metadata = {
  title: "About Us | Cars365",
  description: "Learn about Cars365's mission to solve the rental monopoly and connect customers directly with verified, independent car rental operators across Australia.",
};

export default function AboutPage() {
  return <AboutClient header={<SiteHeader />} footer={<SiteFooter />} />;
}
