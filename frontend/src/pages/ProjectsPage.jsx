import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Plus, Trash2, Users, FolderOpen, Search, User } from 'lucide-react';
import ProjectModal from '../components/ProjectModal';
import { LoadingShell, Skeleton } from '../components/Skeleton';

import StatusBadge from '../components/StatusBadge';

export default function ProjectsPage() {
  const { projects, tasks, users, isAdmin, loading, createProject, deleteProject } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtered = projects.filter(p => {
    const matchStatus = filter === 'All' || p.status === filter;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const getLeadName = (id) => users.find(u => u.id === id)?.name || 'Unknown';

  return (
    <div className="content-area">
      <div className="top-bar page-top-bar">
        <div className="search-container">
          <Search size={14} color="var(--gray-400)" />
          <input type="text" className="search-input" placeholder="Search projects…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="top-actions">
          {isAdmin && (
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={13} /> New Project
            </button>
          )}
        </div>
      </div>

      <div className="page-header">
        <h1>Projects</h1>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['All', 'Planning', 'Active', 'Completed'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className="status-badge"
              style={{
                cursor: 'pointer',
                background: filter === s ? 'var(--blue-light)' : 'var(--gray-100)',
                color: filter === s ? 'var(--blue)' : 'var(--gray-600)',
              }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <ProjectModal 
        isOpen={showForm} 
        onClose={() => setShowForm(false)} 
      />

      {deleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div className="card" style={{ maxWidth: '400px', width: '90%', padding: '24px' }}>
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '8px' }}>Delete project?</div>
            <p style={{ fontSize: '13px', color: 'var(--gray-600)', marginBottom: '20px' }}>
              This will permanently delete <strong>{deleteConfirm.name}</strong> and all its tasks. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-primary" style={{ background: 'var(--red)' }}
                onClick={async () => { await deleteProject(deleteConfirm.id); setDeleteConfirm(null); }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="stats-grid">
        {loading ? (
          <LoadingShell minHeight="50vh">
            <div className="stats-grid" style={{ marginBottom: 0 }}>
              {[1, 2, 3].map(i => <Skeleton key={i} height="260px" borderRadius="12px" />)}
            </div>
          </LoadingShell>
        ) : (
          <>
            {filtered.map(project => {
              const projectTasks = tasks.filter(t => t.projectId === project.id);
              const doneTasks = projectTasks.filter(t => t.status === 'Done' || t.status === 'Completed').length;
              const progress = projectTasks.length
                ? Math.round((doneTasks / projectTasks.length) * 100)
                : project.status === 'Completed' ? 100 : 0;

              return (
                <div key={project.id} className="card" onClick={() => navigate(`/projects/${project.id}`)} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--gray-900)' }}>{project.name}</div>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--gray-600)', marginBottom: '16px', lineHeight: '1.5', height: '40px', overflow: 'hidden' }}>
                    {project.description || 'No description provided.'}
                  </p>

                  <div className="progress-bar-container" style={{ marginBottom: '8px' }}>
                    <div className="progress-fill" style={{ width: `${progress}%`, background: project.status === 'Completed' ? 'var(--green)' : 'var(--blue)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--gray-400)', marginBottom: '16px', fontWeight: '500' }}>
                    <span>{progress}% complete</span>
                    <span>{doneTasks}/{projectTasks.length} tasks</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--gray-100)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--gray-600)' }}>
                        <User size={13} color="var(--gray-400)" />
                        <span>Lead: {getLeadName(project.leadId)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--gray-400)' }}>
                        <Users size={13} />
                        <span>{project.memberIds?.length || 0} team member{project.memberIds?.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    {isAdmin && (
                      <button className="btn-icon"
                        style={{ width: '28px', height: '28px', color: 'var(--red)', border: 'none', background: 'none', cursor: 'pointer' }}
                        onClick={e => { e.stopPropagation(); setDeleteConfirm(project); }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '80px 20px', color: 'var(--gray-400)' }}>
                <FolderOpen size={48} style={{ opacity: 0.15, marginBottom: '16px' }} />
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: 'var(--gray-600)' }}>No projects found</div>
                <div style={{ fontSize: '13px' }}>{isAdmin ? 'Create a new project to get started.' : 'No projects match your filter.'}</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
