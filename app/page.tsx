import LandingHeader from '@/components/landing/LandingHeader';
import Hero from '@/components/landing/Hero';
import ProductPreview from '@/components/landing/ProductPreview';
import FeatureSection from '@/components/landing/FeatureSection';
import Footer from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <LandingHeader />
      <Hero />
      <ProductPreview />
      <FeatureSection />
      <Footer />
    </main>
  );
}
