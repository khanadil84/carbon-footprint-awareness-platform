import { InfoPageLayout } from '../components/layout/InfoPageLayout';
import { BookOpen, Globe, BarChart3, GraduationCap } from 'lucide-react';

const resourceCategories = [
  {
    icon: <BookOpen size={24} aria-hidden="true" />,
    title: 'Documentation',
    description: 'Comprehensive guides and API documentation for developers and advanced users looking to integrate carbon tracking into their workflows.'
  },
  {
    icon: <Globe size={24} aria-hidden="true" />,
    title: 'Sustainability Resources',
    description: 'Curated articles, research papers, and tools to help you understand climate change and the importance of carbon footprint reduction.'
  },
  {
    icon: <BarChart3 size={24} aria-hidden="true" />,
    title: 'Carbon Tracking Resources',
    description: 'Learn about carbon accounting methodologies, emission factors, and best practices for accurate environmental impact measurement.'
  },
  {
    icon: <GraduationCap size={24} aria-hidden="true" />,
    title: 'Learning Materials',
    description: 'Interactive tutorials, webinars, and courses designed to deepen your knowledge of sustainable living and carbon management.'
  }
];

export const ResourcesPage = () => (
  <InfoPageLayout
    badgeText="Resources"
    headingId="resources-heading"
    headingBefore="Explore our "
    headingHighlight="resources"
    description="Everything you need to understand, track, and reduce your carbon footprint."
    sections={resourceCategories}
  />
);
