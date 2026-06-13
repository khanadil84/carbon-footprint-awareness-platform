// React import not required with the new JSX transform
import './HeroSection.css';

export const ImpactSection = () => {
  return (
    <section id="impact" className="dfp-section" aria-labelledby="impact-heading">
      <div className="dfp-section__header">
        <h2 id="impact-heading">Impact</h2>
      </div>
      <div className="dfp-section__content">
        <p>
          EcoTrack helps you understand and reduce your carbon footprint by tracking activities and
          suggesting practical improvements. See your aggregated impact and progress over time.
        </p>
      </div>
    </section>
  );
};

export default ImpactSection;
