import { Activity, Calculator, BarChart3, Lightbulb, Target } from 'lucide-react';
import './HowItWorksSection.css';

const steps = [
  {
    icon: <Activity aria-hidden="true" />,
    title: 'Activity Tracking',
    description: 'Log your daily activities — from transportation and energy usage to diet and shopping. Our intuitive interface makes it easy to record your environmental impact.'
  },
  {
    icon: <Calculator aria-hidden="true" />,
    title: 'Carbon Calculation',
    description: 'Advanced algorithms convert your activities into accurate carbon footprint measurements. Get precise CO₂ equivalents for every action you track.'
  },
  {
    icon: <BarChart3 aria-hidden="true" />,
    title: 'Dashboard Analytics',
    description: 'Visualize your carbon footprint with interactive charts and reports. Track trends, identify hotspots, and monitor your progress over time.'
  },
  {
    icon: <Lightbulb aria-hidden="true" />,
    title: 'Recommendations',
    description: 'Receive personalized, actionable suggestions to reduce your emissions. Our AI-powered engine tailors recommendations to your unique lifestyle patterns.'
  },
  {
    icon: <Target aria-hidden="true" />,
    title: 'Goal Tracking',
    description: 'Set monthly reduction targets and earn achievements as you progress. Stay motivated with community challenges and measurable milestones.'
  }
];

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="how-it-works-section" aria-labelledby="how-it-works-heading">
      <div className="container">
        <div className="how-it-works-header">
          <h2 id="how-it-works-heading" className="how-it-works-title">How it works</h2>
          <p className="how-it-works-subtitle">
            Get started on your sustainability journey in five simple steps.
          </p>
        </div>

        <div className="how-it-works-steps">
          {steps.map((step, index) => (
            <div key={index} className="how-it-works-step">
              <div className="step-number" aria-hidden="true">{index + 1}</div>
              <div className="step-icon-wrapper">
                {step.icon}
              </div>
              <div className="step-content">
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
