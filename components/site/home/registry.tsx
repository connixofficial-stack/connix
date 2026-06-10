'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import { HeroRuntimeSection } from './sections/HeroRuntimeSection';

const AboutSection = dynamic(
  () => import('../AboutSection').then((mod) => ({ default: mod.AboutSection })),
  { ssr: false, loading: () => null }
);
const BlogSection = dynamic(
  () => import('../BlogSection').then((mod) => ({ default: mod.BlogSection })),
  { ssr: false, loading: () => null }
);
const CareerSection = dynamic(
  () => import('../CareerSection').then((mod) => ({ default: mod.CareerSection })),
  { ssr: false, loading: () => null }
);
const CaseStudySection = dynamic(
  () => import('../CaseStudySection').then((mod) => ({ default: mod.CaseStudySection })),
  { ssr: false, loading: () => null }
);
const ContactSection = dynamic(
  () => import('../ContactSection').then((mod) => ({ default: mod.ContactSection })),
  { ssr: false, loading: () => null }
);
const CountdownSectionWrapper = dynamic(
  () => import('../CountdownSectionWrapper').then((mod) => ({ default: mod.CountdownSectionWrapper })),
  { ssr: false, loading: () => null }
);
const HomepageCategoryHeroSection = dynamic(
  () => import('../HomepageCategoryHeroSection').then((mod) => ({ default: mod.HomepageCategoryHeroSection })),
  { ssr: false, loading: () => null }
);
const PricingSection = dynamic(
  () => import('../PricingSection').then((mod) => ({ default: mod.PricingSection })),
  { ssr: false, loading: () => null }
);
const PopupSection = dynamic(
  () => import('../PopupSection').then((mod) => ({ default: mod.PopupSection })),
  { ssr: false, loading: () => null }
);
const ProductListSection = dynamic(
  () => import('../ProductListSection').then((mod) => ({ default: mod.ProductListSection })),
  { ssr: false, loading: () => null }
);
const ServiceListSection = dynamic(
  () => import('../ServiceListSection').then((mod) => ({ default: mod.ServiceListSection })),
  { ssr: false, loading: () => null }
);
const SpeedDialSection = dynamic(
  () => import('../SpeedDialSection').then((mod) => ({ default: mod.SpeedDialSection })),
  { ssr: false, loading: () => null }
);
const TeamSection = dynamic(
  () => import('../TeamSection').then((mod) => ({ default: mod.TeamSection })),
  { ssr: false, loading: () => null }
);
const VoucherPromotionsSection = dynamic(
  () => import('../VoucherPromotionsSection').then((mod) => ({ default: mod.VoucherPromotionsSection })),
  { ssr: false, loading: () => null }
);
const BenefitsRuntimeSection = dynamic(
  () => import('./sections/BenefitsRuntimeSection').then((mod) => ({ default: mod.BenefitsRuntimeSection })),
  { ssr: false, loading: () => null }
);
const StatsRuntimeSection = dynamic(
  () => import('./sections/StatsRuntimeSection').then((mod) => ({ default: mod.StatsRuntimeSection })),
  { ssr: false, loading: () => null }
);
const ProductGridSection = dynamic(
  () => import('../ProductGridSection').then((mod) => ({ default: mod.ProductGridSection })),
  { ssr: false, loading: () => null }
);
const FaqRuntimeSection = dynamic(
  () => import('./sections/FaqRuntimeSection').then((mod) => ({ default: mod.FaqRuntimeSection })),
  { ssr: false, loading: () => null }
);
const CtaRuntimeSection = dynamic(
  () => import('./sections/CtaRuntimeSection').then((mod) => ({ default: mod.CtaRuntimeSection })),
  { ssr: false, loading: () => null }
);
const FeaturesRuntimeSection = dynamic(
  () => import('./sections/FeaturesRuntimeSection').then((mod) => ({ default: mod.FeaturesRuntimeSection })),
  { ssr: false, loading: () => null }
);
const ClientsRuntimeSection = dynamic(
  () => import('./sections/ClientsRuntimeSection').then((mod) => ({ default: mod.ClientsRuntimeSection })),
  { ssr: false, loading: () => null }
);
const VideoRuntimeSection = dynamic(
  () => import('./sections/VideoRuntimeSection').then((mod) => ({ default: mod.VideoRuntimeSection })),
  { ssr: false, loading: () => null }
);
const ProcessRuntimeSection = dynamic(
  () => import('./sections/ProcessRuntimeSection').then((mod) => ({ default: mod.ProcessRuntimeSection })),
  { ssr: false, loading: () => null }
);

export const homeComponentRegistry: Record<string, ComponentType<any>> = {
  About: AboutSection,
  Blog: BlogSection,
  Benefits: BenefitsRuntimeSection,
  Career: CareerSection,
  CaseStudy: CaseStudySection,
  Clients: ClientsRuntimeSection,
  Contact: ContactSection,
  Countdown: CountdownSectionWrapper,
  CTA: CtaRuntimeSection,
  FAQ: FaqRuntimeSection,
  Features: FeaturesRuntimeSection,
  Hero: HeroRuntimeSection,
  HomepageCategoryHero: HomepageCategoryHeroSection,
  Pricing: PricingSection,
  Popup: PopupSection,
  Process: ProcessRuntimeSection,
  Stats: StatsRuntimeSection,
  ProductGrid: ProductGridSection,
  ProductList: ProductListSection,
  ServiceList: ServiceListSection,
  SpeedDial: SpeedDialSection,
  Team: TeamSection,
  Video: VideoRuntimeSection,
  VoucherPromotions: VoucherPromotionsSection,
};
