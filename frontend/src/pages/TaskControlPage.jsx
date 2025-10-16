import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { projectService } from '../services/projectService';
import CreateTaskForm from '../components/tasks/CreateTaskForm';
import Pagination from '../components/common/Pagination';
import './TaskControlPage.css';

const TaskControlPage = () => {
    const { isAdmin } = useAuth();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [projectFilter, setProjectFilter] = useState('');
    const [projects, setProjects] = useState([]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalTasks, setTotalTasks] = useState(0);
    const [tasksPerPage, setTasksPerPage] = useState(6); // 6 tasks/trang như user pages

    // Redirect if not admin
    if (!isAdmin()) {
        return (
            <div className="access-denied">
                <h2>Quyền truy cập bị từ chối</h2>
                <p>Bạn không có quyền truy cập trang này.</p>
            </div>
        );
    }

    useEffect(() => {
        loadProjects();
    }, []);

    useEffect(() => {
        loadTasks();
    }, [statusFilter, priorityFilter, projectFilter, currentPage]);

    const loadProjects = async () => {
        try {
            const response = await projectService.getProjectsForDropdown();
            if (response.success) {
                setProjects(response.data);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    };

    const loadTasks = async () => {
        try {
            setLoading(true);
            const response = await taskService.getAllTasks({
                status: statusFilter,
                priority: priorityFilter,
                project_id: projectFilter,
                page: currentPage,
                limit: tasksPerPage
            });

            if (response.success) {
                setTasks(response.data.tasks);
                // Update pagination info (ĐÃ SỬA: format mới camelCase)
                if (response.data.pagination) {
                    setCurrentPage(response.data.pagination.currentPage);
                    setTotalPages(response.data.pagination.totalPages);
                    setTotalTasks(response.data.pagination.totalItems);
                    setTasksPerPage(response.data.pagination.itemsPerPage);
                }
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            toast.error('Không thể tải danh sách tasks');
        } finally {
            setLoading(false);
        }
    };

    const handleTaskCreated = (newTask) => {
        console.log('Task created:', newTask);
        setShowCreateForm(false);
        setCurrentPage(1); // Reset về trang đầu
        loadTasks(); // Refresh task list
        toast.success('Tạo task mới thành công!');
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleFilterChange = () => {
        // Reset về trang 1 khi thay đổi filter
        setCurrentPage(1);
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

    const getStatusLabel = (status) => {
        const labels = {
            not_started: 'Chưa bắt đầu',
            in_progress: 'Đang thực hiện',
            completed: 'Hoàn thành',
            cancelled: 'Đã hủy'
        };
        return labels[status] || status;
    };

    const getPriorityLabel = (priority) => {
        const labels = {
            low: 'Thấp',
            medium: 'Trung bình',
            high: 'Cao',
            urgent: 'Khẩn cấp'
        };
        return labels[priority] || priority;
    };

    const getStatusColor = (status) => {
        const colors = {
            not_started: '#6b7280',
            in_progress: '#3b82f6',
            completed: '#10b981',
            cancelled: '#ef4444'
        };
        return colors[status] || '#6b7280';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            low: '#10b981',
            medium: '#3b82f6',
            high: '#f59e0b',
            urgent: '#ef4444'
        };
        return colors[priority] || '#6b7280';
    };

    return (
        <div className="task-control-page">
            <div className="task-control-header">
                <h1>Kiểm soát Task</h1>
                <p>Quản lý và tạo tasks cho các thành viên trong hệ thống</p>
            </div>

            <div className="task-control-actions">
                <button
                    className="create-task-btn"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                >
                    {showCreateForm ? '✕ Hủy' : '+ Tạo Task Mới'}
                </button>
            </div>

            {showCreateForm && (
                <div className="create-task-section">
                    <CreateTaskForm
                        onTaskCreated={handleTaskCreated}
                        onCancel={() => setShowCreateForm(false)}
                    />
                </div>
            )}

            {!showCreateForm && (
                <div className="task-management-section">
                    <div className="task-list-section">
                        <div className="task-list-header">
                            <h2>Danh sách Tasks {totalTasks > 0 && `(${totalTasks})`}</h2>
                            <button className="refresh-btn" onClick={loadTasks}>
                                 Làm mới
                            </button>
                        </div>

                        <div className="task-filters">
                            <select
                                className="filter-select"
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    handleFilterChange();
                                }}
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="not_started">Chưa bắt đầu</option>
                                <option value="in_progress">Đang thực hiện</option>
                                <option value="completed">Hoàn thành</option>
                            </select>
                            <select
                                className="filter-select"
                                value={priorityFilter}
                                onChange={(e) => {
                                    setPriorityFilter(e.target.value);
                                    handleFilterChange();
                                }}
                            >
                                <option value="">Tất cả mức độ</option>
                                <option value="low">Thấp</option>
                                <option value="medium">Trung bình</option>
                                <option value="high">Cao</option>
                                <option value="urgent">Khẩn cấp</option>
                            </select>
                            <select
                                className="filter-select"
                                value={projectFilter}
                                onChange={(e) => {
                                    setProjectFilter(e.target.value);
                                    handleFilterChange();
                                }}
                            >
                                <option value="">Tất cả dự án</option>
                                {Array.isArray(projects) && projects.map(project => (
                                    <option key={project.id} value={project.id}>
                                        {project.name} {project.status === 'completed' ? '(Hoàn thành)' : project.status === 'inactive' ? '(Ngừng hoạt động)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {loading ? (
                            <div className="task-list-loading">
                                <div className="loading-spinner"></div>
                                <p>Đang tải danh sách tasks...</p>
                            </div>
                        ) : tasks.length === 0 ? (
                            <div className="task-list-placeholder">
                                <p>Không có task nào</p>
                            </div>
                        ) : (
                            <div className="task-list">
                                {tasks.map(task => (
                                    <div key={task.id} className="task-item-readonly">
                                        <div className="task-item-header">
                                            <h3 className="task-item-title">{task.title}</h3>
                                            <div className="task-item-badges">
                                                <span
                                                    className="task-badge priority-badge"
                                                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                                                >
                                                    {getPriorityLabel(task.priority)}
                                                </span>
                                                <span
                                                    className="task-badge status-badge"
                                                    style={{ backgroundColor: getStatusColor(task.status) }}
                                                >
                                                    {getStatusLabel(task.status)}
                                                </span>
                                            </div>
                                        </div>

                                        {task.description && (
                                            <p className="task-item-description">{task.description}</p>
                                        )}

                                        <div className="task-item-details">
                                            <div className="task-detail-row">
                                                <span className="detail-label">Người thực hiện:</span>
                                                <span className="detail-value">
                                                    {task.assignee_first_name} {task.assignee_last_name} ({task.assignee_username})
                                                </span>
                                            </div>
                                            <div className="task-detail-row">
                                                <span className="detail-label">Người tạo:</span>
                                                <span className="detail-value">
                                                    {task.creator_first_name} {task.creator_last_name}
                                                </span>
                                            </div>
                                            {task.project_name && (
                                                <div className="task-detail-row">
                                                    <span className="detail-label">Dự án:</span>
                                                    <span className="detail-value">{task.project_name}</span>
                                                </div>
                                            )}
                                            <div className="task-detail-row">
                                                <span className="detail-label">Thời gian:</span>
                                                <span className="detail-value">
                                                    {formatDate(task.start_date)} → {formatDate(task.due_date)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {!loading && tasks.length > 0 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={totalTasks}
                                onPageChange={handlePageChange}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskControlPage;