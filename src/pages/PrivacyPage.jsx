import { InfoPageLayout } from '../components/layout/InfoPageLayout';
import { Shield, Database, Users } from 'lucide-react';

const sections = [
  {
    icon: <Shield size={24} aria-hidden="true" />,
    title: 'Privacy Policy',
    description: 'Our commitment to protecting your personal information. Learn how we collect, use, and safeguard your data when you use EcoTrack.'
  },
  {
    icon: <Database size={24} aria-hidden="true" />,
    title: 'Data Handling',
    description: 'Details on how your activity data is processed, stored, and encrypted. We prioritize transparency in our data management practices.'
  },
  {
    icon: <Users size={24} aria-hidden="true" />,
    title: 'User Rights',
    description: 'Your rights regarding access, correction, deletion, and portability of your personal data under applicable privacy regulations.'
  }
];

export const PrivacyPage = () => (
  <InfoPageLayout
    badgeText="Privacy"
    headingId="privacy-heading"
    headingHighlight="Privacy"
    headingAfter=" &amp; Data Protection"
    description="Your privacy matters. Learn how we handle your data with care and transparency."
    sections={sections}
  />
);
