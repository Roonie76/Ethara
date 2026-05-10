import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, MoreVertical } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function KanbanBoard({ tasks, users, projects, onTaskClick, onStatusChange, canEditTask, canMoveTask, showProjectName }) {
  const columns = {
    'Todo': tasks.filter(t => t.status === 'Todo'),
    'In Progress': tasks.filter(t => t.status === 'In Progress'),
    'Review': tasks.filter(t => t.status === 'Review'),
    'Done': tasks.filter(t => t.status === 'Done' || t.status === 'Completed'),
  };

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    
    const task = tasks.find(t => t.id.toString() === draggableId);
    if (canMoveTask && !canMoveTask(task, destination.droppableId)) {
      // Permission denied - handle visual feedback if needed
      return;
    }

    onStatusChange(parseInt(draggableId), destination.droppableId);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="kanban-board">
        {Object.entries(columns).map(([columnId, columnTasks]) => (
          <Droppable key={columnId} droppableId={columnId}>
            {(provided, snapshot) => (
              <div 
                className="kanban-column"
                {...provided.droppableProps}
                ref={provided.innerRef}
                style={{ background: snapshot.isDraggingOver ? '#f1f5f9' : 'transparent' }}
              >
                <div className="column-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`column-dot ${columnId.toLowerCase().replace(' ', '-')}`}></span>
                    <h3>{columnId}</h3>
                    <span className="task-count">{columnTasks.length}</span>
                  </div>
                </div>
                <div className="column-tasks">
                  {columnTasks.map((task, index) => (
                        <Draggable 
                          key={task.id} 
                          draggableId={task.id.toString()} 
                          index={index}
                          isDragDisabled={canEditTask && !canEditTask(task)}
                        >
                      {(provided, snapshot) => (
                        <div 
                          className={`task-card ${snapshot.isDragging ? 'dragging' : ''}`}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          onClick={() => onTaskClick(task)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div className="task-card-tag" style={{ 
                              color: task.priority === 'High' ? '#ef4444' : task.priority === 'Medium' ? '#eab308' : '#10b981',
                              background: 'transparent',
                              padding: '0',
                              fontSize: '10px',
                              fontWeight: '700'
                            }}>
                              {task.priority.toUpperCase()}
                            </div>
                            {showProjectName && (
                              <div style={{ fontSize: '10px', color: 'var(--gray-400)', fontWeight: '600' }}>
                                {projects?.find(p => Number(p.id) === Number(task.projectId))?.name}
                              </div>
                            )}
                          </div>
                          <h4 className="task-card-title">{task.title}</h4>
                          <div className="task-card-footer">
                            <div className="avatar-xs">
                              {users.find(u => Number(u.id) === Number(task.assigneeId))?.name?.slice(0, 2).toUpperCase() || '?'}
                            </div>
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                              <MoreVertical size={14} color="#94a3b8" />
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>

      <style>{`
        .kanban-board {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          align-items: flex-start;
          min-height: calc(100vh - 200px);
          background-image: 
            linear-gradient(90deg, rgba(226, 232, 240, 0.8) 1px, transparent 1px);
          background-size: calc(25% + 6px) 100%;
          background-position: -12px 0;
          padding: 8px 0;
        }

        .kanban-column {
          border-radius: 12px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: background 0.2s;
        }

        .column-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 8px;
          margin-bottom: 4px;
        }

        .column-header h3 {
          font-size: 14px;
          font-weight: 600;
          color: #475569;
        }

        .task-count {
          font-size: 12px;
          background: #e2e8f0;
          color: #64748b;
          padding: 2px 8px;
          border-radius: 100px;
        }

        .column-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .column-dot.todo { background: #94a3b8; }
        .column-dot.in-progress { background: #3b82f6; }
        .column-dot.review { background: #f59e0b; }
        .column-dot.done { background: #10b981; }

        .column-tasks {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 100px;
        }

        .task-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          cursor: grab;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .task-card:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .task-card.dragging {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          transform: rotate(2deg);
        }

        .task-card-tag {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 2px 8px;
          border-radius: 4px;
          width: fit-content;
          margin-bottom: 8px;
        }

        .task-card-title {
          font-size: 14px;
          font-weight: 500;
          color: #1e293b;
          margin-bottom: 12px;
          line-height: 1.4;
        }

        .task-card-footer {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .avatar-xs {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #e2e8f0;
          color: #475569;
          font-size: 9px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .icon-btn:hover {
          background: #f1f5f9;
          color: #475569;
        }
        @media (max-width: 1024px) {
          .kanban-board {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            background-image: none;
          }
        }

        @media (max-width: 768px) {
          .kanban-board {
            display: flex;
            overflow-x: auto;
            gap: 16px;
            padding: 8px 0;
            min-height: calc(100vh - 200px);
            background-image: none;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
          }

          .kanban-column {
            min-width: 260px;
            scroll-snap-align: start;
            flex-shrink: 0;
          }

          .task-card {
            padding: 12px;
          }

          .task-card-title {
            font-size: 13px;
            margin-bottom: 8px;
          }
        }

        @media (max-width: 480px) {
          .kanban-board {
            padding: 4px 0;
          }

          .kanban-column {
            min-width: 240px;
          }

          .column-header h3 {
            font-size: 13px;
          }

          .task-card {
            padding: 10px;
          }
        }
      `}</style>
    </DragDropContext>
  );
}
