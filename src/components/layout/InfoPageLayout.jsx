import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { PageHero } from '../ui/PageHero';
import { InfoCard } from '../ui/InfoCard';

export const InfoPageLayout = ({
  badgeText,
  headingId,
  headingBefore = '',
  headingHighlight,
  headingAfter = '',
  description,
  sections,
  gridMinMax = '280px',
  renderItem = null
}) => (
  <>
    <Navbar />
    <main id="main-content">
      <PageHero {...{ badgeText, headingId, headingBefore, headingHighlight, headingAfter, description }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${gridMinMax}, 1fr))`, gap: 'var(--spacing-6)' }}>
          {sections.map((item, i) =>
            renderItem ? renderItem(item, i) : (
              <InfoCard key={i} icon={item.icon} title={item.title} description={item.description} />
            )
          )}
        </div>
      </PageHero>
    </main>
    <Footer />
  </>
);
