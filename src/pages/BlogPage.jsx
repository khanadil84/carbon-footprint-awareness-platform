import { InfoPageLayout } from '../components/layout/InfoPageLayout';
import { InfoCard } from '../components/ui/InfoCard';
import { Newspaper, Lightbulb, Megaphone } from 'lucide-react';

const articles = [
  {
    icon: <Newspaper size={24} aria-hidden="true" />,
    category: 'Sustainability',
    title: 'Sustainability Articles',
    description: 'In-depth articles covering the latest trends, research, and news in sustainability and climate action.'
  },
  {
    icon: <Lightbulb size={24} aria-hidden="true" />,
    category: 'Tips',
    title: 'Carbon Reduction Tips',
    description: 'Practical, actionable tips you can implement today to reduce your carbon footprint and live more sustainably.'
  },
  {
    icon: <Megaphone size={24} aria-hidden="true" />,
    category: 'Updates',
    title: 'Product Updates',
    description: 'Stay informed about new features, improvements, and releases from the EcoTrack team.'
  }
];

export const BlogPage = () => (
  <InfoPageLayout
    badgeText="Blog"
    headingId="blog-heading"
    headingBefore="EcoTrack "
    headingHighlight="Blog"
    description="Insights, tips, and updates on sustainability and carbon footprint awareness."
    sections={articles}
    gridMinMax="300px"
    renderItem={(article, i) => (
      <article key={i}>
        <InfoCard icon={article.icon} title={article.title} description={article.description} subtitle={article.category} />
      </article>
    )}
  />
);
