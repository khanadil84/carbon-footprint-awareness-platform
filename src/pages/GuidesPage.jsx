import { InfoPageLayout } from '../components/layout/InfoPageLayout';
import { Compass, Map, BookOpen, Target } from 'lucide-react';

const guides = [
  {
    icon: <Compass size={24} aria-hidden="true" />,
    title: 'Getting Started Guide',
    description: 'New to EcoTrack? This guide walks you through account setup, first activity log, and understanding your carbon score.'
  },
  {
    icon: <Map size={24} aria-hidden="true" />,
    title: 'Tracking Guide',
    description: 'Learn best practices for accurately tracking various activities — from daily commute to weekly grocery shopping.'
  },
  {
    icon: <BookOpen size={24} aria-hidden="true" />,
    title: 'Sustainability Guide',
    description: 'A comprehensive overview of sustainable living practices, offset programs, and how to make a lasting impact.'
  },
  {
    icon: <Target size={24} aria-hidden="true" />,
    title: 'Goal Guide',
    description: 'Set meaningful carbon reduction targets, track your progress, and earn achievements along the way.'
  }
];

export const GuidesPage = () => (
  <InfoPageLayout
    badgeText="Guides"
    headingId="guides-heading"
    headingBefore="Step-by-step "
    headingHighlight="guides"
    description="Follow our detailed guides to make the most of EcoTrack and reduce your environmental impact."
    sections={guides}
  />
);
