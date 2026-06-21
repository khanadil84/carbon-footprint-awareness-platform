export const ErrorBanner = ({ message }) => {
  if (!message) return null;
  return (
    <div className="input-error-message" role="alert" style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#fee2e2', borderRadius: '0.25rem' }}>
      {message}
    </div>
  );
};
