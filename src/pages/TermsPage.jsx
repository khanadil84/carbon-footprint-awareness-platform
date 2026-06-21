import { InfoPageLayout } from '../components/layout/InfoPageLayout';
import { FileText, List, AlertTriangle } from 'lucide-react';

const sections = [
  {
    icon: <FileText size={24} aria-hidden="true" />,
    title: 'Terms of Service',
    description: 'The complete terms governing your use of EcoTrack. Includes account terms, payment terms, and service level agreements.'
  },
  {
    icon: <List size={24} aria-hidden="true" />,
    title: 'Usage Rules',
    description: 'Guidelines for acceptable use of the EcoTrack platform, including prohibited activities and content standards.'
  },
  {
    icon: <AlertTriangle size={24} aria-hidden="true" />,
    title: 'Limitations',
    description: 'Important limitations of liability, warranty disclaimers, and service availability terms that apply to your use of EcoTrack.'
  }
];

export const TermsPage = () => (
  <InfoPageLayout
    badgeText="Terms"
    headingId="terms-heading"
    headingHighlight="Terms"
    headingAfter=" of Service"
    description="Please read these terms carefully before using the EcoTrack platform."
    sections={sections}
  />
);
