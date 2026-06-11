import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { HeroSection } from '../components/sections/HeroSection';
import { FeaturesSection } from '../components/sections/FeaturesSection';

export const LandingPage = () => {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <FeaturesSection />
      </main>
      <Footer />
    </>
  );
};
