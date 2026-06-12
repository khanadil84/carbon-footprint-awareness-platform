import React from 'react';
import './HeroSection.css';

export const AboutSection = () => {
  return (
    <section id="about" className="dfp-section" aria-labelledby="about-heading">
      <div className="dfp-section__header">
        <h2 id="about-heading">About Us</h2>
      </div>
      <div className="dfp-section__content">
        <p>
          We are a small team committed to making climate action approachable. This app is designed
          to help individuals track and reduce their personal carbon footprint with simple, actionable
          insights.
        </p>
      </div>
    </section>
  );
};

export default AboutSection;
