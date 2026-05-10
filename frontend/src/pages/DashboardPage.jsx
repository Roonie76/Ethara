import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Briefcase,
  Layout,
  CheckSquare,
  AlertTriangle,
  ChevronRight,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { isPast, parseISO, formatDistanceToNow } from 'date-fns';
import { DashboardSkeleton } from '../components/Skeleton';
import TaskDetailModal from '../components/TaskDetailModal';

export default function DashboardPage() {
  const { currentUser, tasks, projects, users, isAdmin, loading, updateTask, updateTaskStatus } = useApp();
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState(null);

  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const activeTasks = tasks.filter(t => t.status !== 'Done' && t.status !== 'Completed').length;
    const completedTasks = tasks.filter(t => t.status === 'Done' || t.status === 'Completed').length;
    const overdueTasks = tasks.filter(t =>
      t.status !== 'Done' && t.status !== 'Completed' && t.dueDate && isPast(parseISO(t.dueDate))
    );
    const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
    const todoCount = tasks.filter(t => t.status === 'Todo').length;
    const reviewCount = tasks.filter(t => t.status === 'Review').length;
    const myTasks = tasks.filter(t => t.assigneeId === currentUser?.id).length;
    const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    return {
      totalProjects,
      activeTasks,
      completedTasks,
      overdueTasks,
      inProgressCount,
      todoCount,
      reviewCount,
      myTasks,
      completionRate
    };
  }, [tasks, projects, currentUser]);

  const overdueList = stats.overdueTasks.slice(0, 3);
  const myTasksList = useMemo(() => {
    return tasks
      .filter(t => Number(t.assigneeId) === Number(currentUser?.id) && t.status !== 'Done' && t.status !== 'Completed')
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 3);
  }, [tasks, currentUser]);

  // Recent activity derived from real task data
  const recentActivity = useMemo(() => {
    const sorted = [...tasks]
      .filter(t => t.updatedAt)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 3);
    return sorted.map(t => {
      const user = users.find(u => Number(u.id) === Number(t.assigneeId)) || currentUser;
      const project = projects.find(p => Number(p.id) === Number(t.projectId));
      let action = 'updated';
      if (t.status === 'Done' || t.status === 'Completed') action = 'completed';
      else if (t.status === 'In Progress') action = 'started working on';
      else if (t.status === 'Review') action = 'moved to review';
      return {
        id: t.id,
        user,
        action,
        target: t.title,
        project: project?.name,
        time: t.updatedAt ? formatDistanceToNow(parseISO(t.updatedAt), { addSuffix: true }) : 'recently',
      };
    });
  }, [tasks, users, projects, currentUser]);

  const totalTasks = tasks.length || 1;
  const inProgressP = Math.round((stats.inProgressCount / totalTasks) * 100);
  const doneP = Math.round((stats.completedTasks / totalTasks) * 100);
  const todoP = 100 - inProgressP - doneP;

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
    return Number(task.assigneeId) === Number(currentUser.id) || Number(project?.leadId) === Number(currentUser.id);
  }

  function canMove(task, destination) {
    if (isAdmin) return true;
    if (!task || !currentUser) return false;
    const project = projects?.find(p => Number(p.id) === Number(task.projectId));
    const isLead = Number(project?.leadId) === Number(currentUser.id);
    if (destination === 'Done') return isLead;
    return canEdit(task);
  }

  return (
    <div className="content-area">


      {loading ? <DashboardSkeleton /> : (
        <>
          {/* Header */}
          <div className="dashboard-header" style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>
              Welcome back, {currentUser?.name?.split(' ')[0]}
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Here's what's happening with your projects today.</p>
          </div>

          {/* Summary Cards */}
          <div className="stats-grid dashboard-stats-grid" style={{ gap: '16px', marginBottom: '24px' }}>
            <div className="stat-card" onClick={() => navigate('/projects')} style={{ cursor: 'pointer' }}>
              <div className="stat-card-header">
                <span>Total Projects</span>
                <div className="icon-box blue"><Briefcase size={16} /></div>
              </div>
              <div className="stat-value">{stats.totalProjects}</div>
              <div className="stat-trend positive">{stats.totalProjects > 0 ? `${stats.totalProjects} active` : 'Get started'}</div>
            </div>

            <div className="stat-card" onClick={() => navigate('/tasks')} style={{ cursor: 'pointer' }}>
              <div className="stat-card-header">
                <span>Active Tasks</span>
                <div className="icon-box purple"><Layout size={16} /></div>
              </div>
              <div className="stat-value">{stats.activeTasks}</div>
              <div className="stat-subtext">{stats.myTasks} assigned to you</div>
            </div>

            <div className="stat-card" onClick={() => navigate('/tasks')} style={{ cursor: 'pointer' }}>
              <div className="stat-card-header">
                <span>Completed</span>
                <div className="icon-box green"><CheckSquare size={16} /></div>
              </div>
              <div className="stat-value">{stats.completedTasks}</div>
              <div className="stat-trend positive">{stats.completionRate}% completion rate</div>
            </div>

            <div className="stat-card" onClick={() => navigate('/tasks')} style={{ cursor: 'pointer' }}>
              <div className="stat-card-header">
                <span>Overdue</span>
                <div className="icon-box red"><AlertTriangle size={16} /></div>
              </div>
              <div className="stat-value" style={{ color: '#ef4444' }}>{stats.overdueTasks.length}</div>
              <div className="stat-trend negative">Requires attention</div>
            </div>
          </div>

          {/* Middle Row */}
          <div className="dashboard-middle-row" style={{ display: 'grid', gap: '20px', marginBottom: '24px' }}>
            {/* Task Status Distribution */}
            <div className="card">
              <h3 className="card-title">Task Status Distribution</h3>
              <div className="status-chart-container">
                <div className="donut-chart">
                  <div className="donut-center">
                    <strong>{tasks.length}</strong>
                    <span>Total Tasks</span>
                  </div>
                </div>
                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="dot blue"></span>
                    <span>In Progress</span>
                    <strong>{stats.inProgressCount}</strong>
                  </div>
                  <div className="legend-item">
                    <span className="dot green"></span>
                    <span>Done</span>
                    <strong>{stats.completedTasks}</strong>
                  </div>
                  <div className="legend-item">
                    <span className="dot gray"></span>
                    <span>To Do</span>
                    <strong>{stats.todoCount}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Tasks List */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 className="card-title" style={{ margin: 0 }}>My Tasks</h3>
                <button className="text-btn" onClick={() => navigate('/tasks')}>View All</button>
              </div>
              <div className="overdue-list">
                {myTasksList.length > 0 ? myTasksList.map(task => (
                  <div key={task.id} className="overdue-item" onClick={() => setSelectedTask(task)} style={{ borderColor: '#f1f5f9' }}>
                    <div className="overdue-icon-box" style={{ background: '#f5f3ff' }}>
                      <CheckSquare size={16} color="#8b5cf6" />
                    </div>
                    <div className="overdue-content">
                      <strong>{task.title}</strong>
                      <span>{projects.find(p => p.id === task.projectId)?.name || 'General Project'}</span>
                    </div>
                    <div className={`urgency-tag ${task.priority === 'High' ? 'high' : task.priority === 'Medium' ? 'medium' : 'low'}`}>{task.priority}</div>
                    <ChevronRight size={16} color="#94a3b8" />
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '13px' }}>
                    You have no active tasks.
                  </div>
                )}
              </div>
            </div>

            {/* Overdue Tasks List */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 className="card-title" style={{ margin: 0 }}>Overdue</h3>
                <button className="text-btn" onClick={() => navigate('/tasks')}>View All</button>
              </div>
              <div className="overdue-list">
                {overdueList.length > 0 ? overdueList.map(task => (
                  <div key={task.id} className="overdue-item" onClick={() => setSelectedTask(task)}>
                    <div className="overdue-icon-box">
                      <Clock size={16} color="#ef4444" />
                    </div>
                    <div className="overdue-content">
                      <strong>{task.title}</strong>
                      <span>{projects.find(p => p.id === task.projectId)?.name || 'General Project'}</span>
                    </div>
                    <div className="time-ago" style={{ fontSize: '11px', margin: '0 8px' }}>{formatDistanceToNow(parseISO(task.dueDate))} ago</div>
                    <ChevronRight size={16} color="#94a3b8" />
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '13px' }}>
                    No overdue tasks.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h3 className="card-title">Recent Activity</h3>
            <div className="activity-list">
              {recentActivity.length > 0 ? recentActivity.map(item => (
                <div key={item.id} className="activity-item">
                  <div className="avatar-small">{item.user?.name?.slice(0, 2).toUpperCase()}</div>
                  <div className="activity-text">
                    <strong>{item.user?.name}</strong> {item.action} <span className="highlight">{item.target}</span>
                    {item.project && <> in <span className="highlight">{item.project}</span></>}
                    <div className="activity-time">{item.time}</div>
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: '13px', width: '100%' }}>
                  No recent activity yet. Create tasks to get started.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        .card-title {
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 20px;
        }

        .stat-card {
          background: #fff;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .stat-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #64748b;
          font-size: 13px;
          font-weight: 500;
        }

        .icon-box {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-box.blue { background: #eff6ff; color: #3b82f6; }
        .icon-box.purple { background: #f5f3ff; color: #8b5cf6; }
        .icon-box.green { background: #f0fdf4; color: #22c55e; }
        .icon-box.red { background: #fef2f2; color: #ef4444; }

        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: #0f172a;
        }

        .stat-trend {
          font-size: 12px;
          font-weight: 500;
        }

        .stat-trend.positive { color: #22c55e; }
        .stat-trend.negative { color: #ef4444; }

        .stat-subtext {
          font-size: 12px;
          color: #94a3b8;
        }

        .status-chart-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }

        .donut-chart {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background: conic-gradient(
            #3b82f6 0% ${inProgressP}%, 
            #22c55e ${inProgressP}% ${inProgressP + doneP}%, 
            #e2e8f0 ${inProgressP + doneP}% 100%
          );
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .donut-center {
          width: 100px;
          height: 100px;
          background: #fff;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .donut-center strong { font-size: 20px; color: #0f172a; }
        .donut-center span { font-size: 11px; color: #64748b; }

        .chart-legend {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
          color: #475569;
        }

        .legend-item strong { margin-left: auto; color: #0f172a; }

        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .dot.blue { background: #3b82f6; }
        .dot.green { background: #22c55e; }
        .dot.gray { background: #e2e8f0; }

        .text-btn {
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .overdue-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .overdue-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          transition: all 0.2s;
          cursor: pointer;
        }

        .overdue-item:hover {
          border-color: #e2e8f0;
          background: #f8fafc;
        }

        .overdue-icon-box {
          width: 40px;
          height: 40px;
          background: #fef2f2;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .overdue-content {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .overdue-content strong { font-size: 14px; color: #1e293b; margin-bottom: 2px; }
        .overdue-content span { font-size: 12px; color: #64748b; }

        .urgency-tag {
          padding: 2px 10px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 600;
        }

        .urgency-tag.high { background: #fee2e2; color: #ef4444; }

        .time-ago {
          font-size: 12px;
          color: #ef4444;
          font-weight: 500;
          margin: 0 12px;
        }

        .activity-list {
          display: flex;
          gap: 32px;
        }

        .activity-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          flex: 1;
        }

        .avatar-small {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #e2e8f0;
          color: #475569;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .activity-text {
          font-size: 13px;
          color: #475569;
          line-height: 1.5;
        }

        .activity-text strong { color: #0f172a; }
        .highlight { color: #3b82f6; font-weight: 500; }
        .activity-time { font-size: 11px; color: #94a3b8; margin-top: 4px; }

        /* Dashboard responsive */
        .dashboard-stats-grid {
          grid-template-columns: repeat(4, 1fr);
        }

        .dashboard-middle-row {
          grid-template-columns: 1fr 1fr 1fr;
        }

        @media (max-width: 1024px) {
          .dashboard-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .dashboard-middle-row {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        @media (max-width: 768px) {
          .dashboard-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .dashboard-middle-row {
            grid-template-columns: 1fr !important;
          }
          .activity-list {
            flex-direction: column;
            gap: 16px;
          }
          .overdue-item {
            gap: 10px;
            padding: 10px;
          }
          .urgency-tag {
            display: none;
          }
          .time-ago {
            margin: 0 4px;
            font-size: 11px;
          }
          .stat-card {
            padding: 16px;
          }
          .stat-value {
            font-size: 20px;
          }
          .donut-chart {
            width: 120px;
            height: 120px;
          }
          .donut-center {
            width: 80px;
            height: 80px;
          }
          .donut-center strong { font-size: 16px; }
        }

        @media (max-width: 480px) {
          .dashboard-stats-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .stat-card {
            padding: 12px;
          }
          .stat-value {
            font-size: 18px;
          }
          .stat-card-header {
            font-size: 11px;
          }
          .icon-box {
            width: 28px;
            height: 28px;
          }
          .overdue-icon-box {
            width: 32px;
            height: 32px;
          }
          .donut-chart {
            width: 100px;
            height: 100px;
          }
          .donut-center {
            width: 68px;
            height: 68px;
          }
          .donut-center strong { font-size: 14px; }
          .donut-center span { font-size: 9px; }
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
      />
    </div>
  );
}
