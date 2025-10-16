import  { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import CreateProjectForm from '../components/projects/CreateProjectForm';
import ConfirmDialog from '../components/ConfirmDialog';
import './Projects.css';

const Projects = () => {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedProject, setExpandedProject] = useState(null);
  const [projectTasks, setProjectTasks] = useState({});
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectService.getAllProjects(1, 100);
      if (response.success) {
        setProjects(response.data.projects);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Không thể tải danh sách dự án');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (projectData) => {
    try {
      const response = await projectService.createProject(projectData);
      if (response.success) {
        toast.success('Tạo dự án thành công!');
        setShowCreateForm(false);
        loadProjects();
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error(error.message || 'Không thể tạo dự án');
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Đang hoạt động',
      inactive: 'Tạm dừng',
      completed: 'Đã hoàn thành'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      active: '#10b981',
      inactive: '#f59e0b',
      completed: '#3b82f6'
    };
    return colors[status] || '#6b7280';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const loadProjectTasks = async (projectId) => {
    if (expandedProject === projectId) {
      setExpandedProject(null);
      return;
    }

    if (projectTasks[projectId]) {
      setExpandedProject(projectId);
      return;
    }

    try {
      // Load TẤT CẢ tasks của dự án (không giới hạn pagination)
      const response = await taskService.getAllTasks({
        project_id: projectId,
        limit: 1000 // Load tối đa 1000 tasks (thực tế sẽ ít hơn nhiều)
      });
      if (response.success) {
        setProjectTasks(prev => ({
          ...prev,
          [projectId]: response.data.tasks
        }));
        setExpandedProject(projectId);
      }
    } catch (error) {
      console.error('Error loading project tasks:', error);
      toast.error('Không thể tải danh sách task');
    }
  };

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    setDeleteLoading(true);
    try {
      const response = await projectService.deleteProject(projectToDelete.id);
      if (response.success) {
        toast.success(response.message || 'Xóa dự án thành công!');
        setShowConfirmDelete(false);
        setProjectToDelete(null);
        loadProjects(); // Reload danh sách projects
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error(error.message || 'Không thể xóa dự án');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmDelete(false);
    setProjectToDelete(null);
  };

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div>
          <h1>{isAdmin() ? 'Quản lý Dự án' : 'Dự án'}</h1>
          <p>{isAdmin() ? 'Quản lý tất cả các dự án trong hệ thống' : 'Xem danh sách các dự án'}</p>
        </div>
        {isAdmin() && (
          <button
            className="btn-create-project"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? '✕ Hủy' : '+ Tạo Dự Án Mới'}
          </button>
        )}
      </div>

      {showCreateForm && isAdmin() && (
        <div className="create-form-section">
          <CreateProjectForm
            onProjectCreated={handleCreateProject}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {!showCreateForm && (
        <div className="projects-content">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Đang tải dự án...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <h3>Chưa có dự án nào</h3>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map(project => (
                <div key={project.id} className="project-card">
                  <div className="project-card-header">
                    <div className="project-header-left">
                      <h3 className="project-name">{project.name}</h3>
                      <span
                        className="project-status-badge"
                        style={{ backgroundColor: getStatusColor(project.status) }}
                      >
                        {getStatusLabel(project.status)}
                      </span>
                    </div>
                    {isAdmin() && (
                      <button
                        className="btn-delete-project"
                        onClick={() => handleDeleteClick(project)}
                        title="Xóa dự án"
                      >
                        Xóa
                      </button>
                    )}
                  </div>

                  {project.description && (
                    <p className="project-description">{project.description}</p>
                  )}

                  <div className="project-stats">
                    <div className="stat-item">
                      <div className="stat-content">
                        <span className="stat-number">{project.task_count || 0}</span>
                        <span className="stat-label">Tasks</span>
                      </div>
                    </div>
                  </div>

                  <div className="project-footer">
                    <div className="project-meta">
                      <span className="meta-label">Ngày tạo:</span>
                      <span className="meta-value">{formatDate(project.created_at)}</span>
                    </div>
                    {project.task_count > 0 && (
                      <button
                        className="btn-view-tasks"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadProjectTasks(project.id);
                        }}
                      >
                        {expandedProject === project.id ? '▲ Ẩn Tasks' : '▼ Xem Tasks'}
                      </button>
                    )}
                  </div>

                  {expandedProject === project.id && projectTasks[project.id] && (
                    <div className="tasks-list-section">
                      <div className="tasks-list-header">
                        <h4>Danh sách Tasks ({projectTasks[project.id].length})</h4>
                      </div>
                      <div className="tasks-list">
                        {projectTasks[project.id].length > 0 ? (
                          projectTasks[project.id].map(task => (
                            <div key={task.id} className="task-item">
                              <span className="task-bullet">•</span>
                              <span className="task-name">{task.title}</span>
                              <span
                                className="task-status-mini"
                                style={{
                                  backgroundColor:
                                    task.status === 'completed' ? '#10b981' :
                                    task.status === 'in_progress' ? '#f59e0b' : '#6b7280'
                                }}
                              >
                                {task.status === 'completed' ? 'Hoàn thành' :
                                 task.status === 'in_progress' ? 'Đang làm' : 'Mới'}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="no-tasks">Chưa có task nào</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDelete}
        title="Xác nhận xóa dự án"
        message={`Bạn có chắc chắn muốn xóa dự án "${projectToDelete?.name}" không?`}
        infoMessage="Các task trong dự án sẽ không bị xóa và có thể được gán lại vào dự án khác."
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={deleteLoading}
        variant="danger"
      />
    </div>
  );
};

export default Projects;
