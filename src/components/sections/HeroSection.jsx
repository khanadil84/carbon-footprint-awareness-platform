import { ArrowRight, Leaf } from 'lucide-react';
import { Button } from '../ui/Button';
import './HeroSection.css';

export const HeroSection = () => {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="container hero-container">
        <div className="hero-content">
          <div className="hero-badge">
            <Leaf className="hero-badge-icon" aria-hidden="true" />
            <span>Join the sustainable movement</span>
          </div>
          <h1 id="hero-heading" className="hero-title">
            Track, Reduce, and Offset Your <span className="hero-title-highlight">Carbon Footprint</span>
          </h1>
          <p className="hero-subtitle">
            Take control of your environmental impact. EcoTrack provides actionable insights and tools to help you live a more sustainable, earth-friendly life.
          </p>
          <div className="hero-actions">
            <Button variant="primary" size="lg" className="hero-btn">
              Start Tracking Free <ArrowRight aria-hidden="true" className="btn-icon" />
            </Button>
            <Button variant="outline" size="lg" className="hero-btn">
              How it works
            </Button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-image-placeholder" aria-hidden="true">
            <div className="hero-decorative-circle"></div>
            <div className="hero-decorative-card card-1">
              <span className="card-title">Monthly Goal</span>
              <span className="card-value">-15% CO2</span>
            </div>
            <div className="hero-decorative-card card-2">
              <span className="card-title">Trees Planted</span>
              <span className="card-value">24</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
