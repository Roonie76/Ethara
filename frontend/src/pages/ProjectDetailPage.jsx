import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Layout, 
  List as ListIcon, 
  Plus, 
  Pencil, 
  Users, 
  ChevronLeft,
  Search,
  MoreVertical
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { Skeleton } from '../components/Skeleton';
import TaskDetailModal from '../components/TaskDetailModal';
import KanbanBoard from '../components/KanbanBoard';
import ProjectModal from '../components/ProjectModal';
import TaskModal from '../components/TaskModal';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, tasks, users, isAdmin, currentUser, updateTask, updateTaskStatus, loading } = useApp();
  const [view, setView] = useState('kanban'); // 'kanban' or 'list'
  const [search, setSearch] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const project = useMemo(() => projects.find(p => p.id === parseInt(id)), [projects, id]);
  const projectTasks = useMemo(() => tasks.filter(t => t.projectId === parseInt(id)), [tasks, id]);
  
  const filteredTasks = useMemo(() => {
    if (!search) return projectTasks;
    return projectTasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
  }, [projectTasks, search]);

  const columns = {
    'Todo': filteredTasks.filter(t => t.status === 'Todo'),
    'In Progress': filteredTasks.filter(t => t.status === 'In Progress'),
    'Review': filteredTasks.filter(t => t.status === 'Review'),
    'Done': filteredTasks.filter(t => t.status === 'Done' || t.status === 'Completed'),
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Update status in backend
    await updateTaskStatus(parseInt(draggableId), destination.droppableId);
  };

  if (loading) return <div className="content-area"><Skeleton height="400px" /></div>;
  if (!project) return <div className="content-area">Project not found</div>;
  async function updateTaskField(taskId, updates) {
    await updateTask(taskId, updates);
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => ({ ...prev, ...updates }));
    }
  }
  const isLead = Number(project.leadId) === Number(currentUser?.id);
  const canManage = isAdmin || isLead;

  function canEdit(task) {
    if (isAdmin) return true;
    if (!task || !currentUser) return false;
    const isProjectMember = project.memberIds?.map(id => Number(id)).includes(Number(currentUser.id));
    return Number(task.assigneeId) === Number(currentUser.id) || isLead || isProjectMember;
  }

  function canChangeMeta(task) {
    return isAdmin || isLead;
  }

  function canMove(task, destination) {
    if (isAdmin) return true;
    if (!task || !currentUser) return false;

    const isProjectLead = Number(project.leadId) === Number(currentUser?.id);
    const isAssignee = Number(task.assigneeId) === Number(currentUser?.id);
    const isMember = project.memberIds?.some(mid => Number(mid) === Number(currentUser?.id));
    
    // Only lead or admin can move to Done
    if (destination === 'Done' || destination === 'Completed') return isProjectLead;
    
    // Any project member (or lead/admin) can move between other statuses
    return isProjectLead || isMember || isAssignee;
  }

  return (
    <div className="content-area project-detail-page">
      {/* Breadcrumbs / Back */}
      <div className="project-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#64748b', fontSize: '13px' }}>
        <button onClick={() => navigate('/projects')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ChevronLeft size={14} /> Projects
        </button>
        <span>/</span>
        <span style={{ color: '#0f172a', fontWeight: '500' }}>{project.name}</span>
      </div>

      {/* Header */}
      <div className="project-detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>{project.name}</h1>
          <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '600px', wordBreak: 'break-word' }}>{project.description}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '-8px' }}>
            {project.memberIds?.slice(0, 3).map(mid => {
              const u = users.find(user => user.id === mid);
              return (
                <div key={mid} className="avatar" style={{ width: '32px', height: '32px', border: '2px solid #fff', fontSize: '11px' }}>
                  {u?.name?.slice(0, 2).toUpperCase()}
                </div>
              );
            })}
            {project.memberIds?.length > 3 && (
              <div className="avatar" style={{ width: '32px', height: '32px', border: '2px solid #fff', fontSize: '11px', background: '#f1f5f9', color: '#64748b' }}>
                +{project.memberIds.length - 3}
              </div>
            )}
          </div>
          {canManage && (
            <button className="btn-secondary" style={{ padding: '8px' }} onClick={() => setShowEditModal(true)}>
              <Pencil size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="project-toolbar">
        <div className="view-toggle-container">
          <button 
            className={`tab-btn ${view === 'kanban' ? 'active' : ''}`}
            onClick={() => setView('kanban')}
          >
            <Layout size={16} /> Kanban
          </button>
          <button 
            className={`tab-btn ${view === 'list' ? 'active' : ''}`}
            onClick={() => setView('list')}
          >
            <ListIcon size={16} /> List
          </button>
        </div>

        <div className="project-actions">
          <div className="search-container project-search">
            <Search size={14} color="#94a3b8" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search tasks..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Task
          </button>
        </div>
      </div>

      {/* Content */}
      {view === 'kanban' ? (
        <KanbanBoard 
          tasks={filteredTasks} 
          users={users} 
          projects={projects}
          onTaskClick={setSelectedTask}
          onStatusChange={updateTaskStatus}
          canEditTask={canEdit}
          canMoveTask={canMove}
          showProjectName={false}
        />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {/* List View - simplified table */}
          <div className="list-view">
             {filteredTasks.length === 0 ? (
               <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No tasks found in this project.</div>
             ) : (
               filteredTasks.map(task => (
                 <div key={task.id} className="task-row project-task-row"
                   style={{ padding: '12px 20px', cursor: 'pointer' }}
                   onClick={() => setSelectedTask(task)}
                 >
                    <div style={{ fontWeight: '500', color: '#1e293b' }}>{task.title}</div>
                    <div><StatusBadge status={task.status} /></div>
                    <div className="project-task-priority" style={{ fontSize: '13px', color: task.priority === 'High' ? '#ef4444' : '#64748b' }}>{task.priority}</div>
                    <div className="project-task-assignee avatar-xs">{users.find(u => Number(u.id) === Number(task.assigneeId))?.name?.slice(0, 2).toUpperCase() || '?'}</div>
                 </div>
               ))
             )}
          </div>
        </div>
      )}

      <style>{`
        .project-task-row {
          display: grid;
          grid-template-columns: 1fr 120px 100px 100px;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid transparent;
          background: transparent;
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          background: #f1f5f9;
          color: #1e293b;
        }

        .tab-btn.active {
          background: #fff;
          border-color: #e2e8f0;
          color: #3b82f6;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .task-row:hover {
          background: #f8fafc;
        }

        .project-task-row {
          display: grid;
          grid-template-columns: 1fr 120px 100px 100px;
        }

        .project-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 16px;
          gap: 12px;
        }
        .view-toggle-container { display: flex; gap: 8px; }
        .project-actions { display: flex; gap: 12px; }
        .project-search { width: 200px; background: #f8fafc; }

        @media (max-width: 768px) {
          .project-detail-header {
            flex-direction: column;
          }
          .project-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          .project-actions {
            flex-direction: column;
          }
          .project-search {
            width: 100%;
          }
          .tab-btn {
            flex: 1;
            justify-content: center;
            padding: 8px;
          }
          .project-task-row {
            grid-template-columns: 1fr 100px 80px !important;
          }
          .project-task-assignee {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .tab-btn {
            padding: 5px 8px;
            font-size: 12px;
            gap: 4px;
          }
          .project-task-row {
            grid-template-columns: 1fr 90px !important;
          }
          .project-task-priority {
            display: none;
          }
          .project-task-assignee {
            display: none;
          }
        }
      `}</style>
      <ProjectModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        project={project}
      />
      <TaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        projectId={id}
      />
      <TaskDetailModal 
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        projects={projects}
        users={users}
        isAdmin={isAdmin}
        currentUser={currentUser}
        onStatusUpdate={updateTaskStatus}
        onUpdate={updateTaskField}
        canEdit={canEdit}
        canMove={canMove}
        canChangeMeta={canChangeMeta}
      />
    </div>
  );
}
