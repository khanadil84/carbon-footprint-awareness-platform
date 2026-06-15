import { Target, TrendingDown, Users, Globe, Award, Shield } from 'lucide-react';
import './FeaturesSection.css';

const features = [
  {
    icon: <Target aria-hidden="true" />,
    title: 'Precision Tracking',
    description: 'Connect your daily activities to calculate your exact carbon footprint with our advanced algorithms.'
  },
  {
    icon: <TrendingDown aria-hidden="true" />,
    title: 'Actionable Insights',
    description: 'Get personalized recommendations on how to reduce your emissions in achievable, practical ways.'
  },
  {
    icon: <Globe aria-hidden="true" />,
    title: 'Verified Offsets',
    description: 'Fund certified global projects that actively remove carbon from the atmosphere to reach net-zero.'
  },
  {
    icon: <Users aria-hidden="true" />,
    title: 'Community Goals',
    description: 'Join challenges, compare with peers, and make a collective impact with the EcoTrack community.'
  },
  {
    icon: <Award aria-hidden="true" />,
    title: 'Earn Rewards',
    description: 'Unlock achievements and partner discounts as you consistently lower your environmental impact.'
  },
  {
    icon: <Shield aria-hidden="true" />,
    title: 'Data Privacy',
    description: 'Your data is encrypted and securely stored. We prioritize your privacy alongside the planet.'
  }
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="features-section" aria-labelledby="features-heading">
      <div className="container">
        <div className="features-header">
          <h2 id="features-heading" className="features-title">Everything you need to make a difference</h2>
          <p className="features-subtitle">
            A comprehensive suite of tools designed to make sustainable living simple, measurable, and rewarding.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon-wrapper">
                {feature.icon}
              </div>
              <h3 className="feature-card-title">{feature.title}</h3>
              <p className="feature-card-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
