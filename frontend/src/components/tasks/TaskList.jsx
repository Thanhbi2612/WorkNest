import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { taskService } from '../../services/taskService';
import TaskCard from '../tasks/TaskCard';
import Pagination from '../common/Pagination';
import './TaskList.css';

const TaskList = ({ filterType, title }) => {
    const { isAdmin } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 6; // 6 tasks mỗi trang theo yêu cầu

    // Reset về trang 1 khi filterType thay đổi
    useEffect(() => {
        setCurrentPage(1);
    }, [filterType]);

    // Load tasks khi page thay đổi hoặc filterType thay đổi
    useEffect(() => {
        loadTasks();
    }, [currentPage, filterType]);

    const loadTasks = async () => {
        try {
            setLoading(true);
            setError(null);

            // Build filters dựa trên filterType
            const filters = {
                page: currentPage,
                limit: itemsPerPage
            };

            // Map filterType sang backend filters
            switch (filterType) {
                case 'today':
                    // Chưa bắt đầu = not_started status
                    filters.status = 'not_started';
                    break;
                case 'upcoming':
                    // Đang làm = in_progress status
                    filters.status = 'in_progress';
                    break;
                case 'overdue':
                    // Quá hạn = special filter
                    filters.overdue = true;
                    break;
                case 'completed':
                    // Hoàn thành = completed status
                    filters.status = 'completed';
                    break;
                default:
                    // Không filter gì cả
                    break;
            }

            const response = await taskService.getMyTasks(filters);

            if (response.success) {
                setTasks(response.data.tasks);

                // Update pagination info từ backend response
                const pagination = response.data.pagination;
                setCurrentPage(pagination.currentPage);
                setTotalPages(pagination.totalPages);
                setTotalItems(pagination.totalItems);
            } else {
                setError(response.message || 'Có lỗi xảy ra khi tải tasks');
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            setError('Không thể tải danh sách tasks');
        } finally {
            setLoading(false);
        }
    };

    const handleTaskUpdate = (updatedTask) => {
        // Reload lại trang hiện tại để cập nhật data
        loadTasks();
    };

    const handleTaskDelete = async (taskId) => {
        try {
            const response = await taskService.deleteCompletedTask(taskId);
            if (response.success) {
                // Reload lại trang hiện tại
                loadTasks();

                // Hiển thị thông báo thành công
                toast.success('Đã xóa task thành công!', {
                    icon: '✅',
                });
            } else {
                toast.error(response.message || 'Không thể xóa task');
            }
        } catch (error) {
            console.error('Error deleting task:', error);
            const errorMessage = error.message || 'Không thể xóa task. Vui lòng thử lại.';
            toast.error(errorMessage);
        }
    };

    const handleRefresh = () => {
        loadTasks();
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        // Scroll to top khi chuyển trang
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="task-list-container">
                <div className="task-list-header">
                    <h1 className="page-title">{title}</h1>
                </div>
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Đang tải tasks...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="task-list-container">
                <div className="task-list-header">
                    <h1 className="page-title">{title}</h1>
                </div>
                <div className="error-container">
                    <p className="error-message">{error}</p>
                    <button onClick={handleRefresh} className="retry-btn">
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="task-list-container">
            <div className="task-list-header">
                <div className="header-left">
                    <h1 className="page-title">{title}</h1>
                    <span className="task-count">({totalItems})</span>
                </div>
                <div className="header-right">
                    <button onClick={handleRefresh} className="refresh-btn" disabled={loading}>
                        {loading ? 'Đang tải...' : 'Làm mới'}
                    </button>
                </div>
            </div>

            <div className="task-list-content">
                {tasks.length === 0 ? (
                    <div className="no-tasks">
                        <h3>Không có nhiệm vụ nào</h3>
                        <p>Chưa có nhiệm vụ nào trong danh mục này.</p>
                    </div>
                ) : (
                    <>
                        <div className="tasks-list">
                            {tasks.map(task => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    onTaskUpdate={handleTaskUpdate}
                                    onTaskDelete={isAdmin() ? handleTaskDelete : null}
                                    showActions={true}
                                    isCompleted={filterType === 'completed' && isAdmin()}
                                />
                            ))}
                        </div>

                        {/* Pagination Component */}
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            onPageChange={handlePageChange}
                            loading={loading}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default TaskList;