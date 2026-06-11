import React, { useState } from 'react';
import { Leaf, Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="navbar-header">
      <div className="container">
        <nav className="navbar" aria-label="Main Navigation">
          <div className="navbar-brand">
            <a href="/" className="navbar-logo" aria-label="EcoTrack Home">
              <Leaf className="navbar-logo-icon" aria-hidden="true" />
              <span className="navbar-logo-text">EcoTrack</span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="navbar-menu desktop-only">
            <ul className="navbar-links">
              <li><a href="#features" className="navbar-link">Features</a></li>
              <li><a href="#impact" className="navbar-link">Impact</a></li>
              <li><a href="#about" className="navbar-link">About Us</a></li>
            </ul>
            <div className="navbar-actions">
              <Button variant="ghost" onClick={() => navigate('/login')}>Log in</Button>
              <Button variant="primary" onClick={() => navigate('/signup')}>Sign up</Button>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="navbar-toggle mobile-only"
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </nav>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div id="mobile-menu" className="mobile-menu" role="menu">
          <ul className="mobile-menu-links">
            <li><a href="#features" className="mobile-menu-link" onClick={toggleMenu}>Features</a></li>
            <li><a href="#impact" className="mobile-menu-link" onClick={toggleMenu}>Impact</a></li>
            <li><a href="#about" className="mobile-menu-link" onClick={toggleMenu}>About Us</a></li>
          </ul>
          <div className="mobile-menu-actions">
            <Button variant="ghost" className="mobile-action-btn" onClick={() => { toggleMenu(); navigate('/login'); }}>Log in</Button>
            <Button variant="primary" className="mobile-action-btn" onClick={() => { toggleMenu(); navigate('/signup'); }}>Sign up</Button>
          </div>
        </div>
      )}
    </header>
  );
};
