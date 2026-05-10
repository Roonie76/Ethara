import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Plus, Search, CheckSquare, AlertCircle, CheckCircle2, Circle, Trash2, Layout, List as ListIcon, X } from 'lucide-react';
import { TaskListSkeleton } from '../components/Skeleton';

import StatusBadge from '../components/StatusBadge';
import KanbanBoard from '../components/KanbanBoard';
import TaskDetailModal from '../components/TaskDetailModal';

export default function TasksPage() {
  const { tasks, projects, users, currentUser, isAdmin, loading, createTask, updateTask, updateTaskStatus, deleteTask } = useApp();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [filterStatus, setStatus] = useState('All');
  const [view, setView] = useState('kanban');
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTask, setNewTask] = useState({ 
    title: '', 
    description: '', 
    status: 'Todo', 
    priority: 'Medium', 
    projectId: '', 
    assigneeId: '',
    dueDate: new Date().toISOString().split('T')[0]
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const statuses = ['All', 'Todo', 'In Progress', 'Review', 'Done'];

  useEffect(() => {
    if (location.state?.taskId && tasks.length > 0) {
      const task = tasks.find(t => t.id === location.state.taskId);
      if (task) setSelectedTask(task);
    }
  }, [location.state, tasks]);

  const visibleTasks = useMemo(() => {
    let list = tasks;

    // Filter for members: only show assigned to self or unassigned
    if (!isAdmin) {
      list = list.filter(t => 
        Number(t.assigneeId) === Number(currentUser?.id) || 
        !t.assigneeId
      );
    }

    if (search) list = list.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
    if (filterStatus !== 'All') list = list.filter(t => t.status === filterStatus);
    return list;
  }, [tasks, search, filterStatus, isAdmin, currentUser]);

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);
    const taskData = { ...newTask };
    if (!isAdmin) taskData.assigneeId = currentUser.id;
    const res = await createTask(taskData);
    setCreateLoading(false);
    if (res.error) {
      setCreateError(res.error);
      return;
    }
    setShowForm(false);
    setNewTask({ 
      title: '', 
      description: '', 
      status: 'Todo', 
      priority: 'Medium', 
      projectId: '', 
      assigneeId: '',
      dueDate: new Date().toISOString().split('T')[0]
    });
  }

  async function handleStatusUpdate(taskId, newStatus) {
    await updateTaskStatus(taskId, newStatus);
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => ({ ...prev, status: newStatus }));
    }
  }

  async function updateTaskField(taskId, updates) {
    await updateTask(taskId, updates);
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => ({ ...prev, ...updates }));
    }
  }

  function canEdit(task) {
    if (isAdmin) return true;
    if (!task || !currentUser) return false;
    const project = projects?.find(p => Number(p.id) === Number(task.projectId));
    if (!project) return false;
    const isMember = project.memberIds?.some(mid => Number(mid) === Number(currentUser?.id));
    return Number(task.assigneeId) === Number(currentUser.id) || Number(project.leadId) === Number(currentUser.id) || isMember;
  }

  function canChangeMeta(task) {
    if (isAdmin) return true;
    if (!task || !currentUser) return false;
    const project = projects?.find(p => Number(p.id) === Number(task.projectId));
    return Number(project?.leadId) === Number(currentUser.id);
  }

  function canMove(task, destination) {
    if (isAdmin) return true;
    if (!task || !currentUser) return false;
    
    const project = projects?.find(p => Number(p.id) === Number(task.projectId));
    if (!project) return false;

    const isLead = Number(project.leadId) === Number(currentUser?.id);
    const isAssignee = Number(task.assigneeId) === Number(currentUser?.id);
    const isMember = project.memberIds?.some(mid => Number(mid) === Number(currentUser?.id));
    
    // Only lead or admin can move to Done
    if (destination === 'Done' || destination === 'Completed') return isLead;
    
    // Any project member (or lead/admin) can move between other statuses
    return isLead || isMember || isAssignee;
  }

  function getAssigneeName(assigneeId) {
    return users?.find(u => Number(u.id) === Number(assigneeId))?.name || '?';
  }

  function getProjectName(projectId) {
    return projects?.find(p => p.id === projectId)?.name || '';
  }

  return (
    <div className="content-area">
      <div className="top-bar page-top-bar">
        <div className="search-container">
          <Search size={14} color="var(--gray-400)" />
          <input type="text" className="search-input" placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="top-actions">
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={13} /> New Issue
          </button>
        </div>
      </div>

      <div className="page-header tasks-page-header">
        <div className="header-text">
          <h1>Issues</h1>
          <p>Manage and track workspace tasks</p>
        </div>
        
        <div className="header-controls">
          <div className="view-toggle-wrap">
            <button 
              className={`view-toggle-btn ${view === 'kanban' ? 'active' : ''}`}
              onClick={() => setView('kanban')}
            >
              <Layout size={14} /> Kanban
            </button>
            <button 
              className={`view-toggle-btn ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
            >
              <ListIcon size={14} /> List
            </button>
          </div>

          <div className="status-filters-scroll">
            {statuses.map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className="status-badge"
                style={{
                  cursor: 'pointer',
                  background: filterStatus === s ? 'var(--blue-light)' : 'var(--gray-100)',
                  color: filterStatus === s ? 'var(--blue)' : 'var(--gray-600)',
                  whiteSpace: 'nowrap'
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <form onSubmit={handleCreate} className="task-create-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gray-900)' }}>New Issue</div>
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--gray-400)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>
            {createError && (
              <div style={{ background: '#fff8f8', border: '1px solid #ffd0cc', color: 'var(--red)', padding: '10px 12px', borderRadius: '3px', fontSize: '13px' }}>
                {createError}
              </div>
            )}
            <div className="task-form-row-2" style={{ display: 'grid', gap: '12px' }}>
              <div className="search-container" style={{ width: '100%' }}>
                <input className="search-input" placeholder="Issue title" value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })} required />
              </div>
              <div className="search-container" style={{ width: '100%' }}>
                <select className="search-input" value={newTask.projectId}
                  onChange={e => setNewTask({ ...newTask, projectId: e.target.value })} required>
                  <option value="">Select project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="task-form-row-4" style={{ display: 'grid', gap: '12px' }}>
              <div className="search-container" style={{ width: '100%' }}>
                <input type="date" className="search-input" value={newTask.dueDate}
                  onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })} />
              </div>
              <div className="search-container" style={{ width: '100%' }}>
                <select className="search-input" value={newTask.priority}
                  onChange={e => setNewTask({ ...newTask, priority: e.target.value })}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              {isAdmin ? (
                <div className="search-container" style={{ width: '100%' }}>
                  <select className="search-input" value={newTask.assigneeId}
                    onChange={e => setNewTask({ ...newTask, assigneeId: e.target.value })}>
                    <option value="">Unassigned</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              ) : (
                <div className="search-container" style={{ width: '100%' }}>
                  <input className="search-input" value={currentUser?.name} disabled style={{ color: 'var(--gray-400)' }} />
                </div>
              )}
            </div>
            <div className="search-container" style={{ width: '100%', padding: '10px 12px', alignItems: 'flex-start' }}>
              <textarea className="search-input" placeholder="Description…" value={newTask.description}
                onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                style={{ minHeight: '80px', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setCreateError(''); }}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={createLoading}>
                {createLoading ? 'Creating...' : 'Create Issue'}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div className="card" style={{ maxWidth: '380px', width: '90%', padding: '24px' }}>
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '8px' }}>Delete issue?</div>
            <p style={{ fontSize: '13px', color: 'var(--gray-600)', marginBottom: '20px' }}>
              <strong>{deleteConfirm.title}</strong> will be permanently deleted.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-primary" style={{ background: 'var(--red)' }}
                onClick={async () => { await deleteTask(deleteConfirm.id); setDeleteConfirm(null); }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="content-body">
        {loading ? (
          <div className="card" style={{ padding: '16px' }}>
            <TaskListSkeleton />
          </div>
        ) : view === 'list' ? (
          <div className="card" style={{ padding: 0 }}>
            <div className="task-list-header">
              {['', 'Title', 'Status', 'Priority', 'Assignee', ''].map((h, i) => (
                <div key={i} style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-400)' }}>{h}</div>
              ))}
            </div>

            <div className="task-list">
              {visibleTasks.map(task => {
                const isDone = task.status === 'Done' || task.status === 'Completed';
                const editable = canEdit(task);
                return (
                  <div key={task.id} className="task-row task-row-grid"
                    style={{ opacity: editable ? 1 : 0.65 }}
                    onClick={() => setSelectedTask(task)}>
                    <div className="task-col-check" style={{ display: 'flex', alignItems: 'center' }}>
                      {isDone
                        ? <CheckCircle2 size={15} color="var(--green)" />
                        : <Circle size={15} color={editable ? 'var(--gray-400)' : 'var(--gray-200)'} />}
                    </div>
                    <div className="task-col-title">
                      <div style={{ fontSize: '11px', color: 'var(--gray-400)', fontWeight: '500', marginBottom: '1px' }}>
                        TF-{String(task.id).slice(-3).toUpperCase()}
                        {getProjectName(task.projectId) && <span style={{ marginLeft: '6px', color: 'var(--gray-300)' }}>· {getProjectName(task.projectId)}</span>}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--gray-900)' }}>{task.title}</div>
                    </div>
                    <div className="task-col-status" style={{ display: 'flex', alignItems: 'center' }}>
                      <StatusBadge status={task.status} />
                    </div>
                    <div className="task-col-priority" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px',
                      color: task.priority === 'High' ? 'var(--red)' : task.priority === 'Medium' ? '#eab308' : '#10b981' }}>
                      <AlertCircle size={13} /> {task.priority}
                    </div>
                    <div className="task-col-assignee" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="avatar" style={{ width: '22px', height: '22px', fontSize: '10px', flexShrink: 0 }}>
                        {getAssigneeName(task.assigneeId).slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--gray-600)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {getAssigneeName(task.assigneeId)}
                      </span>
                    </div>
                    <div className="task-col-action" style={{ display: 'flex', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                      {editable && (
                        <button
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-300)', display: 'flex', padding: '2px' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--gray-300)'}
                          onClick={() => setDeleteConfirm(task)}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {visibleTasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray-400)' }}>
                <CheckSquare size={40} style={{ opacity: 0.15, marginBottom: '16px' }} />
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: 'var(--gray-600)' }}>No issues found</div>
                <div style={{ fontSize: '13px' }}>Try adjusting your filters.</div>
              </div>
            )}
          </div>
        ) : (
          <KanbanBoard 
            tasks={visibleTasks} 
            users={users} 
            projects={projects}
            onTaskClick={setSelectedTask} 
            onStatusChange={handleStatusUpdate} 
            canEditTask={canEdit}
            canMoveTask={canMove}
            showProjectName={true}
          />
        )}
      </div>

      <style>{`
        .view-toggle-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: none;
          background: transparent;
          color: var(--gray-600);
          font-size: 13px;
          font-weight: 500;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-toggle-btn.active {
          background: #fff;
          color: var(--blue);
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .tasks-page-header {
          margin-bottom: 24px;
        }
        .header-controls {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .view-toggle-wrap {
          display: flex;
          background: var(--gray-100);
          padding: 2px;
          border-radius: 8px;
        }
        .status-filters-scroll {
          display: flex;
          gap: 6px;
        }

        .task-list-header {
          display: grid;
          grid-template-columns: 24px 1fr 110px 90px 140px 36px;
          padding: 8px 16px;
          border-bottom: 1px solid var(--gray-200);
        }

        .task-row-grid {
          display: grid;
          grid-template-columns: 24px 1fr 110px 90px 140px 36px;
          padding: 10px 16px;
        }

        @media (max-width: 768px) {
          .header-controls {
            flex-direction: column;
            align-items: stretch;
            width: 100%;
          }
          .status-filters-scroll {
            overflow-x: auto;
            padding-bottom: 4px;
            -webkit-overflow-scrolling: touch;
          }
          .view-toggle-wrap {
            width: 100%;
          }
          .view-toggle-btn {
            flex: 1;
            justify-content: center;
          }
          .task-form-row-2 {
            grid-template-columns: 1fr;
          }
          .task-form-row-4 {
            grid-template-columns: 1fr 1fr;
          }
          .task-list-header {
            grid-template-columns: 20px 1fr 80px 36px;
            padding: 8px 12px;
          }
          .task-list-header > div:nth-child(4),
          .task-list-header > div:nth-child(5) {
            display: none;
          }
          .task-row-grid {
            grid-template-columns: 20px 1fr 80px 36px;
            padding: 10px 12px;
          }
          .task-col-priority,
          .task-col-assignee {
            display: none !important;
          }
        }

        @media (max-width: 480px) {
          .task-form-row-4 {
            grid-template-columns: 1fr;
          }
          .task-list-header {
            display: none;
          }
          .task-row-grid {
            grid-template-columns: 1fr 70px;
            padding: 12px 10px;
          }
          .task-col-check,
          .task-col-priority,
          .task-col-assignee,
          .task-col-action {
            display: none !important;
          }
        }
      `}</style>

      <TaskDetailModal 
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        projects={projects}
        users={users}
        isAdmin={isAdmin}
        currentUser={currentUser}
        onStatusUpdate={handleStatusUpdate}
        onUpdate={updateTaskField}
        canEdit={canEdit}
        canMove={canMove}
        canChangeMeta={canChangeMeta}
      />
    </div>
  );
}
