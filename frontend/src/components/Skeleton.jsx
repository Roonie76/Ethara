import React from 'react';

export const Skeleton = ({ width, height, borderRadius = '4px', className = '' }) => {
  return (
    <div 
      className={`skeleton-loader ${className}`}
      style={{ 
        width: width || '100%', 
        height: height || '20px', 
        borderRadius,
        background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-loading 1.5s infinite linear'
      }}
    >
      <style>{`
        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export const LoadingShell = ({ children, minHeight = '60vh' }) => (
  <div
    className="loading-shell"
    style={{
      minHeight,
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <div style={{ width: '100%', maxWidth: '960px' }}>
      {children}
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
      {[1, 2, 3, 4].map(i => <Skeleton key={i} height="100px" borderRadius="12px" />)}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
      <Skeleton height="300px" borderRadius="12px" />
      <Skeleton height="300px" borderRadius="12px" />
    </div>
  </div>
);

export const CenteredSpinner = () => (
  <div className="app-loading-screen">
    <div
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        border: '2px solid var(--blue)',
        borderTopColor: 'transparent',
        animation: 'spin 0.7s linear infinite',
      }}
    />
  </div>
);

export const TaskListSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    {[1, 2, 3, 4, 5, 6].map(i => (
      <Skeleton key={i} height="60px" borderRadius="8px" />
    ))}
  </div>
);
