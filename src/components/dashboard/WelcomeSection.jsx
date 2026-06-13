// React import not required with the new JSX transform

export const WelcomeSection = ({ user }) => {
  return (
    <section className="dfp-welcome" aria-labelledby="dfp-welcome-heading">
      <div className="dfp-welcome__inner container">
        <div className="dfp-welcome__text">
          <h1 id="dfp-welcome-heading">Welcome back, {user?.name || user?.email}</h1>
          <p className="dfp-welcome__email">{user?.email}</p>
        </div>
      </div>
    </section>
  );
};

export default WelcomeSection;
