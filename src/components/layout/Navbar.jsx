import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { Leaf, Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

export const Navbar = memo(() => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const toggleRef = useRef(null);
  const menuRef = useRef(null);

  const toggleMenu = useCallback(() => setIsMenuOpen(prev => !prev), []);
  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
    toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen, closeMenu]);

  useEffect(() => {
    if (!isMenuOpen || !menuRef.current) return;
    const firstFocusable = menuRef.current.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) setTimeout(() => firstFocusable.focus(), 50);
  }, [isMenuOpen]);

  return (
    <header className="navbar-header">
      <div className="container">
        <nav className="navbar" aria-label="Main navigation">
          <div className="navbar-brand">
            <a href="/" className="navbar-logo" aria-label="EcoTrack Home">
              <Leaf className="navbar-logo-icon" aria-hidden="true" />
              <span className="navbar-logo-text">EcoTrack</span>
            </a>
          </div>

          <div className="navbar-menu desktop-only">
            <ul className="navbar-links">
              <li><a href="#features" className="navbar-link">Features</a></li>
              <li><a href="#impact" className="navbar-link">Impact</a></li>
              <li><a href="#about" className="navbar-link">About Us</a></li>
              <li><a href="/engineering" className="navbar-link">Engineering</a></li>
            </ul>
            <div className="navbar-actions">
              <Button variant="ghost" onClick={() => navigate('/login')}>Log in</Button>
              <Button variant="primary" onClick={() => navigate('/signup')}>Sign up</Button>
            </div>
          </div>

          <button
            ref={toggleRef}
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

      {isMenuOpen && (
        <div id="mobile-menu" className="mobile-menu" ref={menuRef} role="menu" aria-label="Mobile navigation">
          <ul className="mobile-menu-links">
            <li><a href="#features" className="mobile-menu-link" onClick={closeMenu}>Features</a></li>
            <li><a href="#impact" className="mobile-menu-link" onClick={closeMenu}>Impact</a></li>
            <li><a href="#about" className="mobile-menu-link" onClick={closeMenu}>About Us</a></li>
            <li><a href="/engineering" className="mobile-menu-link" onClick={closeMenu}>Engineering</a></li>
          </ul>
          <div className="mobile-menu-actions">
            <Button variant="ghost" className="mobile-action-btn" onClick={() => { closeMenu(); navigate('/login'); }}>Log in</Button>
            <Button variant="primary" className="mobile-action-btn" onClick={() => { closeMenu(); navigate('/signup'); }}>Sign up</Button>
          </div>
        </div>
      )}
    </header>
  );
});
