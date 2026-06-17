import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { HeroSection } from '../components/sections/HeroSection';
import { HowItWorksSection } from '../components/sections/HowItWorksSection';
import { FeaturesSection } from '../components/sections/FeaturesSection';
import { ImpactSection } from '../components/sections/ImpactSection';
import { AboutSection } from '../components/sections/AboutSection';

export const LandingPage = () => {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <ImpactSection />
        <AboutSection />
      </main>
      <Footer />
    </>
  );
};
