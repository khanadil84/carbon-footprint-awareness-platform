import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignUpPage } from './pages/auth/SignUpPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { EngineeringPage } from './pages/EngineeringPage';

const TrackerPage = lazy(() => import('./pages/TrackerPage').then(m => ({ default: m.TrackerPage })));
const PricingPage = lazy(() => import('./pages/PricingPage').then(m => ({ default: m.PricingPage })));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage').then(m => ({ default: m.ResourcesPage })));
const BlogPage = lazy(() => import('./pages/BlogPage').then(m => ({ default: m.BlogPage })));
const GuidesPage = lazy(() => import('./pages/GuidesPage').then(m => ({ default: m.GuidesPage })));
const HelpCenterPage = lazy(() => import('./pages/HelpCenterPage').then(m => ({ default: m.HelpCenterPage })));
const LegalPage = lazy(() => import('./pages/LegalPage').then(m => ({ default: m.LegalPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--text-secondary)' }}>
    <span role="status">Loading...</span>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  // While auth is initializing, don't redirect — wait for state to settle
  if (loading) return null;
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Public Route Component (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  // While auth is initializing, don't redirect — let the page render
  if (loading) return null;
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          
          <Route path="/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />
          <Route path="/signup" element={
            <PublicRoute>
              <SignUpPage />
            </PublicRoute>
          } />
          <Route path="/forgot-password" element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />

          <Route path="/engineering" element={<EngineeringPage />} />

          <Route path="/tracker" element={<Suspense fallback={<PageLoader />}><TrackerPage /></Suspense>} />
          <Route path="/pricing" element={<Suspense fallback={<PageLoader />}><PricingPage /></Suspense>} />
          <Route path="/resources" element={<Suspense fallback={<PageLoader />}><ResourcesPage /></Suspense>} />
          <Route path="/blog" element={<Suspense fallback={<PageLoader />}><BlogPage /></Suspense>} />
          <Route path="/guides" element={<Suspense fallback={<PageLoader />}><GuidesPage /></Suspense>} />
          <Route path="/help-center" element={<Suspense fallback={<PageLoader />}><HelpCenterPage /></Suspense>} />
          <Route path="/legal" element={<Suspense fallback={<PageLoader />}><LegalPage /></Suspense>} />
          <Route path="/privacy" element={<Suspense fallback={<PageLoader />}><PrivacyPage /></Suspense>} />
          <Route path="/terms" element={<Suspense fallback={<PageLoader />}><TermsPage /></Suspense>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
