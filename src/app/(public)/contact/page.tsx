import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ContactForm } from "@/components/contact-form";
import { MotionScroll } from "@/components/motion-scroll";
import { Mail, MapPin, Phone, Clock, Headphones } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | HireCar Marketplace",
  description: "Get in touch with the HireCar Marketplace team for support or inquiries.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <SiteHeader />
      
      <main className="flex-1 pt-24 pb-20">
        {/* Elegant Hero Section */}
        <section className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-200/50 py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <MotionScroll variant="fade-up">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 text-[#ea580c] font-bold text-sm mb-6 border border-orange-100">
                <Headphones className="w-4 h-4" />
                We&apos;re here to help
              </span>
              <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-6">
                Get in <span className="text-[#ea580c]">Touch</span>
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">
                Whether you&apos;re looking to onboard your fleet, need enterprise solutions, or just have a question, our team is ready to assist.
              </p>
            </MotionScroll>
          </div>
        </section>

        {/* Contact Content Grid */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
            
            {/* Left Column: Contact Info */}
            <MotionScroll variant="fade-up" delay={0.2} className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-xl border border-slate-100/50 h-full">
                <h3 className="text-2xl font-bold text-slate-900 mb-8">Contact Information</h3>
                
                <div className="space-y-8">
                  <div className="flex gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-[#ea580c]">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">Email Us</h4>
                      <p className="mt-1 text-sm text-slate-500 mb-2">Our friendly team is here to help.</p>
                      <a href="mailto:support@hirecarmarketplace.com.au" className="text-[#ea580c] font-semibold hover:text-[#c2410c] transition-colors">support@hirecarmarketplace.com.au</a>
                    </div>
                  </div>

                  <div className="flex gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">Office</h4>
                      <p className="mt-1 text-sm text-slate-500 mb-2">Come say hello at our HQ.</p>
                      <p className="font-semibold text-slate-700">100 George Street<br/>Sydney NSW 2000<br/>Australia</p>
                    </div>
                  </div>

                  <div className="flex gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">Phone</h4>
                      <p className="mt-1 text-sm text-slate-500 mb-2">Mon-Fri from 8am to 5pm.</p>
                      <a href="tel:0434930437" className="font-semibold text-slate-700 hover:text-emerald-600 transition-colors">0434 930 437</a>
                    </div>
                  </div>
                  
                  <div className="flex gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">Support Hours</h4>
                      <p className="mt-1 text-sm text-slate-500">24/7 support available for active rentals. General inquiries handled during business hours.</p>
                    </div>
                  </div>
                </div>
              </div>
            </MotionScroll>

            {/* Right Column: Contact Form */}
            <MotionScroll variant="fade-up" delay={0.4} className="lg:col-span-7">
              <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl border border-slate-100/50">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Send us a message</h3>
                <p className="text-slate-500 text-sm mb-8">We usually respond within 24 hours.</p>
                <ContactForm />
              </div>
            </MotionScroll>

          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
