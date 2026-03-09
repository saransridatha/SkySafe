export function DashboardLoadingState() {
  return (
    <div className="loading-state">
      <div className="loading-card">
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line short" />
        <div className="skeleton skeleton-line small" />
      </div>
      <div className="loading-card">
        <div className="skeleton skeleton-block" />
      </div>
      <div className="loading-card">
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line short" />
      </div>
    </div>
  );
}
