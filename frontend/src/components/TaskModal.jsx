import { useState, useEffect } from 'react';
import { X, Calendar, Plus, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function TaskModal({ isOpen, onClose, projectId = '', task = null }) {
  const { users, projects, currentUser, isAdmin, createTask, updateTask } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Todo',
    priority: 'Medium',
    projectId: projectId || '',
    assigneeId: '',
    dueDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    setError('');
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'Todo',
        priority: task.priority || 'Medium',
        projectId: task.projectId || projectId || '',
        assigneeId: task.assigneeId || '',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : new Date().toISOString().split('T')[0]
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'Todo',
        priority: 'Medium',
        projectId: projectId || '',
        assigneeId: currentUser?.id || '',
        dueDate: new Date().toISOString().split('T')[0]
      });
    }
  }, [task, isOpen, projectId, currentUser]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.title.trim()) {
        setError('Title is required');
        return;
    }
    if (!formData.projectId) {
        setError('Project is required');
        return;
    }

    setLoading(true);
    setError('');
    
    let res;
    if (task) {
      res = await updateTask(task.id, formData);
    } else {
      res = await createTask(formData);
    }
    
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to save task');
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <div>
            <h2>{task ? 'Edit Task' : 'Add New Task'}</h2>
            <p>{task ? 'Update task details.' : 'Assign a new task to your project.'}</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {error && (
              <div style={{ background: '#fff8f8', border: '1px solid #ffd0cc', color: 'var(--red)', padding: '10px 12px', borderRadius: '4px', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label>Task Title</label>
              <input 
                type="text" 
                placeholder="What needs to be done?"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea 
                placeholder="Add more details about this task..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                style={{ minHeight: '80px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Status</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                >
                  {['Todo', 'In Progress', 'Review', 'Done'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select 
                  value={formData.priority}
                  onChange={e => setFormData({...formData, priority: e.target.value})}
                  style={{ 
                      color: formData.priority === 'High' ? '#ef4444' : formData.priority === 'Medium' ? '#eab308' : '#10b981',
                      fontWeight: '600'
                  }}
                >
                  {['Low', 'Medium', 'High'].map(p => (
                    <option key={p} value={p} style={{ color: '#374151' }}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Assignee</label>
                <select 
                  value={formData.assigneeId}
                  onChange={e => setFormData({...formData, assigneeId: e.target.value})}
                >
                  <option value="">Unassigned</option>
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
            
            {!projectId && (
                <div className="form-group">
                <label>Project</label>
                <select 
                  value={formData.projectId}
                  onChange={e => setFormData({...formData, projectId: e.target.value})}
                >
                  <option value="">Select Project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (task ? 'Update Task' : 'Add Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
