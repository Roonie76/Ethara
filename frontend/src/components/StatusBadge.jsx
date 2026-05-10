import React from 'react';

export default function StatusBadge({ status }) {
  const styles = {
    'Done':        { background: 'var(--green-bg)',   color: 'var(--green)' },
    'Completed':   { background: 'var(--green-bg)',   color: 'var(--green)' },
    'In Progress': { background: 'var(--blue-light)', color: 'var(--blue)' },
    'Review':      { background: 'var(--yellow-bg)',  color: 'var(--yellow)' },
    'Todo':        { background: 'var(--gray-100)',   color: 'var(--gray-600)' },
    'Planning':    { background: 'var(--blue-light)', color: 'var(--blue)' },
    'Active':      { background: 'var(--green-bg)',   color: 'var(--green)' },
  };
  
  const label = status === 'Completed' ? 'Done' : status;
  
  return (
    <span className="status-badge" style={{
      ...(styles[status] || styles['Todo']),
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 10px',
      borderRadius: '100px',
      fontSize: '11px',
      fontWeight: '600'
    }}>
      {label}
    </span>
  );
}
