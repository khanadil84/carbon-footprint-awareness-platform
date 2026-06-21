import { InfoPageLayout } from '../components/layout/InfoPageLayout';
import { Scale, Info, ShieldCheck } from 'lucide-react';

const sections = [
  {
    icon: <Scale size={24} aria-hidden="true" />,
    title: 'Legal Information',
    description: 'General legal information about EcoTrack, including company details, terms of engagement, and jurisdictional notices.'
  },
  {
    icon: <Info size={24} aria-hidden="true" />,
    title: 'Disclaimer',
    description: 'Important disclaimers regarding carbon footprint calculations, data accuracy, and the informational nature of our services.'
  },
  {
    icon: <ShieldCheck size={24} aria-hidden="true" />,
    title: 'User Responsibilities',
    description: 'Guidelines for acceptable use, data accuracy responsibilities, and community standards for all EcoTrack users.'
  }
];

export const LegalPage = () => (
  <InfoPageLayout
    badgeText="Legal"
    headingId="legal-heading"
    headingHighlight="Legal"
    headingAfter=" Information"
    description="Important legal documents and information regarding the use of EcoTrack."
    sections={sections}
  />
);
