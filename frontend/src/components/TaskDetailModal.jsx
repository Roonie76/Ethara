import React from 'react';
import { Plus } from 'lucide-react';

export default function TaskDetailModal({
  task,
  onClose,
  projects,
  users,
  isAdmin,
  currentUser,
  onStatusUpdate, 
  onUpdate,
  canEdit,
  canMove,
  canChangeMeta
}) {
  if (!task) return null;

  const getProjectName = (id) => projects?.find(p => Number(p.id) === Number(id))?.name || 'Project';
  const getAssigneeName = (id) => users?.find(u => Number(u.id) === Number(id))?.name || '?';
  const metaLocked = !canChangeMeta(task);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--gray-400)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>
              TF-{String(task.id).slice(-3).toUpperCase()} · {getProjectName(task.projectId)}
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--gray-900)' }}>{task.title}</h2>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--gray-400)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Description</label>
            <p style={{ fontSize: '14px', color: 'var(--gray-600)', lineHeight: '1.6' }}>{task.description || 'No description provided.'}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--gray-400)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Status</label>
              <select
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--gray-200)', fontSize: '13px' }}
                value={task.status}
                onChange={e => onStatusUpdate(task.id, e.target.value)}
                disabled={!canEdit(task)}
              >
                {['Todo', 'In Progress', 'Review', 'Done'].map(s => (
                  <option key={s} value={s} disabled={!canMove(task, s)}>
                    {s}{!canMove(task, s) ? ' (Lead/Assignee Only)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--gray-400)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Assigned to: {metaLocked && <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '400' }}>🔒</span>}
              </label>
              {canChangeMeta(task) ? (
                <select 
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--gray-200)', fontSize: '13px' }}
                  value={task.assigneeId || ''}
                  onChange={e => onUpdate && onUpdate(task.id, { assigneeId: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="avatar" style={{ width: '24px', height: '24px', fontSize: '11px' }}>{getAssigneeName(task.assigneeId).slice(0, 2).toUpperCase()}</div>
                  <span style={{ fontSize: '14px', color: 'var(--gray-700)' }}>{getAssigneeName(task.assigneeId)}</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--gray-400)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Priority {metaLocked && <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '400' }}>🔒</span>}
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: `1px solid ${metaLocked ? '#e2e8f0' : 'var(--gray-200)'}`,
                  fontSize: '13px',
                  fontWeight: '600',
                  color: metaLocked ? '#94a3b8' : (task.priority === 'High' ? '#ef4444' : task.priority === 'Medium' ? '#eab308' : '#10b981'),
                  background: metaLocked ? '#f8fafc' : 'transparent',
                  cursor: metaLocked ? 'not-allowed' : 'pointer',
                  opacity: metaLocked ? 0.7 : 1
                }}
                value={task.priority}
                onChange={e => onUpdate && onUpdate(task.id, { priority: e.target.value })}
                disabled={metaLocked}
              >
                {['Low', 'Medium', 'High'].map(p => (
                  <option key={p} value={p} style={{ color: '#000', background: '#fff' }}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--gray-400)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Due Date {metaLocked && <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '400' }}>🔒</span>}
              </label>
              <input
                type="date"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: `1px solid ${metaLocked ? '#e2e8f0' : 'var(--gray-200)'}`,
                  fontSize: '13px',
                  background: metaLocked ? '#f8fafc' : 'transparent',
                  cursor: metaLocked ? 'not-allowed' : 'pointer',
                  opacity: metaLocked ? 0.7 : 1,
                  color: metaLocked ? '#94a3b8' : 'inherit'
                }}
                value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                onChange={e => onUpdate && onUpdate(task.id, { dueDate: e.target.value })}
                disabled={metaLocked}
              />
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .modal-overlay {
            padding: 16px;
            align-items: flex-end;
          }
          .modal-overlay > .card {
            padding: 24px 16px !important;
            margin: 0;
            max-height: 95vh;
            width: 100% !important;
            max-width: 100% !important;
            border-radius: 20px 20px 0 0 !important;
            overflow-y: auto;
          }
          .modal-overlay > .card > div {
            gap: 16px !important;
          }
          .modal-overlay select, .modal-overlay input[type="date"] {
            font-size: 16px !important;
          }
        }

        @media (max-width: 480px) {
          .modal-overlay {
            padding: 0;
          }
          .modal-overlay > .card {
            padding: 20px 12px !important;
            max-height: 100vh;
            border-radius: 16px 16px 0 0 !important;
          }
          .modal-overlay > .card h2 {
            font-size: 17px !important;
          }
        }
      `}</style>
    </div>
  );
}
