import { InfoPageLayout } from '../components/layout/InfoPageLayout';
import { HelpCircle, Wrench, MessageSquare } from 'lucide-react';

const sections = [
  {
    icon: <HelpCircle size={24} aria-hidden="true" />,
    title: 'FAQ',
    description: 'Find answers to commonly asked questions about carbon tracking, account management, billing, and more.'
  },
  {
    icon: <Wrench size={24} aria-hidden="true" />,
    title: 'Troubleshooting',
    description: 'Solutions for common issues including data sync problems, calculation discrepancies, and login difficulties.'
  },
  {
    icon: <MessageSquare size={24} aria-hidden="true" />,
    title: 'Contact Support',
    description: 'Can\'t find what you\'re looking for? Our support team is here to help. Reach out via email or live chat.'
  }
];

export const HelpCenterPage = () => (
  <InfoPageLayout
    badgeText="Help Center"
    headingId="help-heading"
    headingBefore="How can we "
    headingHighlight="help"
    headingAfter="?"
    description="Browse our help resources or get in touch with our support team."
    sections={sections}
  />
);
