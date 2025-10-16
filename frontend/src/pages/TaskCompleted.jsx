import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { taskReportService } from '../services/taskReportService';
import TaskCard from '../components/tasks/TaskCard';
import ReportForm from '../components/reports/ReportForm';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';
import './TaskCompleted.css';

const TaskCompleted = () => {
    const { isAdmin } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showReportForm, setShowReportForm] = useState(false);
    const [taskReports, setTaskReports] = useState({});
    const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
    const [taskToSubmit, setTaskToSubmit] = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 6;

    useEffect(() => {
        loadTasks();
    }, [currentPage]);

    const loadTasks = async () => {
        try {
            setLoading(true);
            // Sử dụng backend pagination với status=completed
            const response = await taskService.getMyTasks({
                page: currentPage,
                limit: itemsPerPage,
                status: 'completed'  // Backend filter completed tasks
            });

            if (response.success) {
                setTasks(response.data.tasks);

                // Update pagination info
                const pagination = response.data.pagination;
                setCurrentPage(pagination.currentPage);
                setTotalPages(pagination.totalPages);
                setTotalItems(pagination.totalItems);

                // Load reports for completed tasks on current page
                await loadReportsForTasks(response.data.tasks);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            toast.error('Không thể tải danh sách tasks');
        } finally {
            setLoading(false);
        }
    };

    const loadReportsForTasks = async (completedTasks) => {
        const reportsData = {};
        for (const task of completedTasks) {
            try {
                const response = await taskReportService.getTaskReports(task.id);
                if (response.success && response.data.reports && response.data.reports.length > 0) {
                    reportsData[task.id] = response.data.reports[0]; // Lấy báo cáo đầu tiên (user chỉ có 1 báo cáo/task)
                }
            } catch (error) {
                console.error(`Error loading report for task ${task.id}:`, error);
            }
        }
        setTaskReports(reportsData);
    };

    const handleAddReport = (task) => {
        setSelectedTask(task);
        setShowReportForm(true);
    };

    const handleSaveReport = async (formData) => {
        try {
            const existingReport = taskReports[selectedTask.id];

            let response;
            if (existingReport) {
                // Update existing report
                response = await taskReportService.updateReport(selectedTask.id, existingReport.id, formData);
                toast.success('Cập nhật báo cáo thành công!');
            } else {
                // Create new report
                response = await taskReportService.createReport(selectedTask.id, formData);
                toast.success('Tạo báo cáo thành công!');
            }

            if (response.success) {
                // Update local state
                setTaskReports(prev => ({
                    ...prev,
                    [selectedTask.id]: response.data.report
                }));
                setShowReportForm(false);
                setSelectedTask(null);
            }
        } catch (error) {
            toast.error(error.message || 'Không thể lưu báo cáo');
        }
    };

    const handleSubmitReport = (task) => {
        const report = taskReports[task.id];

        if (!report) {
            toast.error('Vui lòng tạo báo cáo trước khi gửi!');
            return;
        }

        if (report.status === 'submitted') {
            toast.info('Báo cáo đã được gửi rồi!');
            return;
        }

        setTaskToSubmit(task);
        setShowConfirmSubmit(true);
    };

    const handleConfirmSubmit = async () => {
        if (!taskToSubmit) return;

        const report = taskReports[taskToSubmit.id];
        setSubmitLoading(true);

        try {
            const response = await taskReportService.submitReport(taskToSubmit.id, report.id);
            if (response.success) {
                toast.success('Gửi báo cáo thành công!', {
                    icon: '✅',
                });
                // Update local state
                setTaskReports(prev => ({
                    ...prev,
                    [taskToSubmit.id]: response.data.report
                }));
                setShowConfirmSubmit(false);
                setTaskToSubmit(null);
            }
        } catch (error) {
            toast.error(error.message || 'Không thể gửi báo cáo');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleCancelSubmit = () => {
        setShowConfirmSubmit(false);
        setTaskToSubmit(null);
    };

    const handleTaskDelete = async (taskId) => {
        try {
            const response = await taskService.deleteConfirmedTask(taskId);
            if (response.success) {
                // Reload current page
                loadTasks();
                toast.success('Đã xóa task thành công!');
            }
        } catch (error) {
            toast.error(error.message || 'Không thể xóa task');
        }
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="task-completed-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Đang tải tasks...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="task-completed-container">
            <div className="task-completed-header">
                <div className="header-left">
                    <h1 className="page-title">Nhiệm vụ đã hoàn thành</h1>
                    <span className="task-count">({totalItems})</span>
                </div>
                <button onClick={loadTasks} className="refresh-btn" disabled={loading}>
                    {loading ? 'Đang tải...' : 'Làm mới'}
                </button>
            </div>

            {showReportForm && selectedTask && (
                <div className="report-form-overlay">
                    <div className="report-form-modal">
                        <ReportForm
                            task={selectedTask}
                            existingReport={taskReports[selectedTask.id]}
                            onSave={handleSaveReport}
                            onCancel={() => {
                                setShowReportForm(false);
                                setSelectedTask(null);
                            }}
                        />
                    </div>
                </div>
            )}

            <div className="task-completed-content">
                {tasks.length === 0 ? (
                    <div className="no-tasks">
                        <h3>Không có nhiệm vụ nào</h3>
                        <p>Chưa có nhiệm vụ hoàn thành nào.</p>
                    </div>
                ) : (
                    <>
                        <div className="tasks-list">
                            {tasks.map(task => {
                                const report = taskReports[task.id];
                                const hasReport = !!report;
                                const isReportSubmitted = report?.status === 'submitted';

                                return (
                                    <div key={task.id} className="task-with-report">
                                        <TaskCard
                                            task={task}
                                            onTaskUpdate={() => {}}
                                            onTaskDelete={handleTaskDelete}
                                            showActions={true}
                                            isCompleted={false}
                                        />

                                        <div className="report-actions">
                                            <button
                                                onClick={() => handleAddReport(task)}
                                                className="btn-add-report"
                                                disabled={isReportSubmitted}
                                            >
                                                {hasReport ? ' Sửa báo cáo' : ' Thêm báo cáo'}
                                            </button>

                                            <button
                                                onClick={() => handleSubmitReport(task)}
                                                className={`btn-submit-report ${isReportSubmitted ? 'submitted' : ''}`}
                                                disabled={isReportSubmitted}
                                            >
                                                {isReportSubmitted ? ' Đã gửi' : ' Gửi báo cáo'}
                                            </button>

                                            {hasReport && (
                                                <span className="report-status">
                                                    {isReportSubmitted ? (
                                                        <span className="status-submitted">Đã gửi báo cáo</span>
                                                    ) : (
                                                        <span className="status-draft">Đã có báo cáo ,bấm gửi báo cáo để xác nhận</span>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
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

            {/* Confirm Submit Dialog */}
            <ConfirmDialog
                isOpen={showConfirmSubmit}
                title="Xác nhận gửi báo cáo"
                message="Bạn có chắc chắn muốn gửi báo cáo?"
                infoMessage="Xác nhận rằng không có thay đổi nào khác nữa."
                confirmText="Xác nhận gửi"
                cancelText="Hủy"
                onConfirm={handleConfirmSubmit}
                onCancel={handleCancelSubmit}
                loading={submitLoading}
                variant="info"
            />
        </div>
    );
};

export default TaskCompleted;