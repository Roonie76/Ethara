import { useState, useEffect, useRef } from 'react';
import { X, Calendar, Plus, ChevronDown, Search, Check, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ProjectModal({ isOpen, onClose, project = null }) {
  const { users, currentUser, isAdmin, createProject, updateProject, deleteProject } = useApp();
  const [loading, setLoading] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    leadId: currentUser?.id || '',
    dueDate: new Date().toISOString().split('T')[0],
    memberIds: []
  });

  useEffect(() => {
    setError('');
    setShowUserDropdown(false);
    setMemberSearch('');
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        leadId: (project.leadId || project.lead_id) ? Number(project.leadId || project.lead_id) : '',
        dueDate: (project.dueDate || project.due_date) ? (project.dueDate || project.due_date).split('T')[0] : new Date().toISOString().split('T')[0],
        memberIds: (project.memberIds || project.member_ids || []).map(id => Number(id))
      });
    } else {
      setFormData({
        name: '',
        description: '',
        leadId: currentUser?.id || '',
        dueDate: new Date().toISOString().split('T')[0],
        memberIds: []
      });
    }
  }, [project, isOpen, currentUser]);
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    }
    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    let res;
    if (project) {
      res = await updateProject(project.id, formData);
    } else {
      res = await createProject(formData);
    }
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to save project');
    }
  }

  async function handleDelete() {
    if (!project) return;
    setLoading(true);
    const res = await deleteProject(project.id);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to delete project');
    }
  }

  const toggleMember = (id) => {
    const numId = Number(id);
    setFormData(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(numId) 
        ? prev.memberIds.filter(m => m !== numId)
        : [...prev.memberIds, numId]
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2>{project ? 'Edit Project' : 'Create New Project'}</h2>
            <p>{project ? 'Update your project workspace and team.' : 'Set up your project workspace and invite your team.'}</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ background: '#fff8f8', border: '1px solid #ffd0cc', color: 'var(--red)', padding: '10px 12px', borderRadius: '3px', fontSize: '13px', marginBottom: '16px' }}>
                {error}
              </div>
            )}
            
            {/* Project Name */}
            <div className="form-group">
              <label>Project Name</label>
              <input 
                type="text" 
                placeholder="e.g. Website Redesign 2024"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label>Description</label>
              <textarea 
                placeholder="Briefly describe the project goals and deliverables..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            {/* Lead and Due Date */}
            <div className="form-row">
              <div className="form-group">
                <label>Project Lead</label>
                <select 
                  value={formData.leadId}
                  onChange={e => {
                    const newLeadId = parseInt(e.target.value);
                    if (!newLeadId) return;
                    setFormData(prev => ({
                      ...prev,
                      leadId: newLeadId,
                      memberIds: prev.memberIds.includes(newLeadId) 
                        ? prev.memberIds 
                        : [...prev.memberIds, newLeadId]
                    }));
                  }}
                >
                  <option value="" disabled>Select a lead</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input 
                  type="date" 
                  value={formData.dueDate}
                  onChange={e => setFormData({...formData, dueDate: e.target.value})}
                />
              </div>
            </div>

            {/* Team Members */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label>Team Members</label>
              <div className="members-input">
                {formData.memberIds.map(id => {
                  const user = users.find(u => u.id === id);
                  return (
                    <div key={id} className="member-tag">
                      <div className="avatar-xs">{user?.name?.slice(0, 2).toUpperCase()}</div>
                      <span>{user?.name}</span>
                      <button type="button" onClick={() => toggleMember(id)}><X size={12} /></button>
                    </div>
                  );
                })}
                <div 
                  className="add-member-btn" 
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                >
                  <Plus size={16} />
                </div>
              </div>

              {/* User Selection Dropdown */}
              {showUserDropdown && (
                <div className="user-dropdown" ref={dropdownRef}>
                  <div className="dropdown-header">
                    <span>Select Team Members</span>
                    <button type="button" onClick={() => setShowUserDropdown(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}>
                      <X size={14} />
                    </button>
                  </div>
                  <div style={{ padding: '8px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input 
                        type="text" 
                        placeholder="Search members..." 
                        className="dropdown-search"
                        style={{ padding: '6px 12px 6px 30px', fontSize: '13px', borderRadius: '6px' }}
                        value={memberSearch}
                        onChange={e => setMemberSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="dropdown-list">
                    {users
                      .filter(u => u.name.toLowerCase().includes(memberSearch.toLowerCase()) || u.email.toLowerCase().includes(memberSearch.toLowerCase()))
                      .map(user => {
                        const isSelected = formData.memberIds.includes(Number(user.id));
                        return (
                          <div 
                            key={user.id} 
                            className={`dropdown-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => toggleMember(user.id)}
                          >
                            <div className="avatar-sm" style={{ background: isSelected ? 'var(--blue)' : '#cbd5e1' }}>
                              {user.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="user-meta" style={{ flex: 1 }}>
                              <strong>{user.name}</strong>
                              <span>{user.email}</span>
                            </div>
                            {isSelected && <Check size={16} style={{ color: 'var(--blue)' }} />}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex' }}>
              {project && isAdmin && (
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ color: 'var(--red)', borderColor: 'var(--red)', display: 'flex', alignItems: 'center', gap: '8px' }}
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 size={16} /> Delete Project
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (project ? 'Updating...' : 'Creating...') : (project ? 'Save Changes' : 'Create Project')}
              </button>
            </div>
          </div>
        </form>

        {showDeleteConfirm && (
          <div className="confirm-overlay" style={{
            position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.9)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            zIndex: 100, backdropFilter: 'blur(4px)', borderRadius: '12px'
          }}>
            <div style={{ textAlign: 'center', padding: '32px', maxWidth: '320px' }}>
              <div style={{ background: '#fee2e2', color: '#ef4444', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Trash2 size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>Delete Project?</h3>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
                This will permanently delete <strong>{project?.name}</strong> and all its tasks. This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                <button className="btn-primary" style={{ flex: 1, background: '#ef4444' }} onClick={handleDelete} disabled={loading}>
                  {loading ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
