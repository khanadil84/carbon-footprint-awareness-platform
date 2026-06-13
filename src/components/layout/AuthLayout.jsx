// React import not required with the new JSX transform
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import './AuthLayout.css';

export const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="auth-layout">
      {/* Visual Side */}
      <div className="auth-visual" aria-hidden="true">
        <div className="auth-visual-content">
          <div className="auth-brand">
            <Leaf className="auth-logo-icon" />
            <span className="auth-logo-text">EcoTrack</span>
          </div>
          <h1 className="auth-visual-title">Start your sustainable journey today.</h1>
          <p className="auth-visual-subtitle">
            Join thousands of individuals committed to tracking and reducing their carbon footprint for a greener tomorrow.
          </p>
        </div>
      </div>

      {/* Form Side */}
      <div className="auth-form-container">
        <div className="auth-form-wrapper">
          <div className="auth-form-header">
            {/* Mobile Logo */}
            <Link to="/" className="auth-mobile-brand" aria-label="EcoTrack Home">
              <Leaf className="auth-logo-icon" />
              <span className="auth-logo-text">EcoTrack</span>
            </Link>
            
            <h2 className="auth-title">{title}</h2>
            {subtitle && <p className="auth-subtitle">{subtitle}</p>}
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
};
