import { Leaf, Globe, Mail, MessageSquare } from 'lucide-react';
import './Footer.css';

export const Footer = () => {
  return (
    <footer className="footer" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Footer</h2>
      <div className="container">
        <div className="footer-grid">
          
          <div className="footer-brand">
            <a href="/" className="footer-logo" aria-label="EcoTrack Home">
              <Leaf className="footer-logo-icon" aria-hidden="true" />
              <span className="footer-logo-text">EcoTrack</span>
            </a>
            <p className="footer-description">
              Empowering individuals and organizations to measure, track, and reduce their carbon footprint for a sustainable future.
            </p>
            <div className="footer-socials">
              <a href="#" className="social-link" aria-label="Website">
                <Globe aria-hidden="true" />
              </a>
              <a href="#" className="social-link" aria-label="Email">
                <Mail aria-hidden="true" />
              </a>
              <a href="#" className="social-link" aria-label="Contact">
                <MessageSquare aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="footer-links-group">
            <h3 className="footer-heading">Platform</h3>
            <ul className="footer-links" role="list">
              <li><a href="#features">Features</a></li>
              <li><a href="#impact">Impact</a></li>
              <li><a href="#pricing">Pricing</a></li>
            </ul>
          </div>

          <div className="footer-links-group">
            <h3 className="footer-heading">Resources</h3>
            <ul className="footer-links" role="list">
              <li><a href="#blog">Blog</a></li>
              <li><a href="#guides">Guides</a></li>
              <li><a href="#help">Help Center</a></li>
            </ul>
          </div>

          <div className="footer-links-group">
            <h3 className="footer-heading">Legal</h3>
            <ul className="footer-links" role="list">
              <li><a href="#privacy">Privacy</a></li>
              <li><a href="#terms">Terms</a></li>
            </ul>
          </div>

        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} EcoTrack Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
