import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { taskReportService } from '../services/taskReportService';
import ReportCard from '../components/reports/ReportCard';
import './Reports.css';

const Reports = () => {
    const { isAdmin } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalReports, setTotalReports] = useState(0);
    const [filterTab, setFilterTab] = useState('all'); // 'all', 'pending', 'resolved'

    useEffect(() => {
        loadReports();
    }, [currentPage, filterTab]);

    const loadReports = async () => {
        try {
            setLoading(true);

            let response;
            if (isAdmin()) {
                // Admin: Lấy tất cả báo cáo đã gửi với filter
                const params = {
                    page: currentPage,
                    limit: 20,
                    status: 'submitted' // Chỉ lấy báo cáo đã gửi
                };

                // Thêm filter theo is_resolved
                if (filterTab === 'pending') {
                    params.is_resolved = false;
                } else if (filterTab === 'resolved') {
                    params.is_resolved = true;
                }

                response = await taskReportService.getAllReports(params);
            } else {
                // User: Chỉ lấy báo cáo đã gửi của mình
                response = await taskReportService.getMyReports(currentPage, 20);

                // Lọc chỉ lấy báo cáo đã submitted
                if (response.success && response.data.reports) {
                    const submittedReports = response.data.reports.filter(
                        report => report.status === 'submitted'
                    );
                    response.data.reports = submittedReports;
                    // Cập nhật lại pagination sau khi filter
                    if (response.data.pagination) {
                        response.data.pagination.total_reports = submittedReports.length;
                    }
                }
            }

            if (response.success) {
                setReports(response.data.reports || []);
                if (response.data.pagination) {
                    setTotalPages(response.data.pagination.total_pages);
                    setTotalReports(response.data.pagination.total_reports);
                }
            }
        } catch (error) {
            console.error('Error loading reports:', error);
            toast.error('Không thể tải danh sách báo cáo');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleFilterChange = (tab) => {
        setFilterTab(tab);
        setCurrentPage(1); // Reset về trang 1 khi đổi filter
    };

    const handleReportUpdate = () => {
        // Callback khi report được update (mark resolved hoặc delete)
        loadReports();
    };

    if (loading) {
        return (
            <div className="reports-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Đang tải báo cáo...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="reports-container">
            <div className="reports-header">
                <div className="header-left">
                    <h1 className="page-title">
                        {isAdmin() ? 'Tất cả báo cáo' : 'Báo cáo của tôi'}
                    </h1>
                    <span className="report-count">({totalReports})</span>
                </div>
                <button onClick={loadReports} className="refresh-btn">
                     Làm mới
                </button>
            </div>

            {/* Filter Tabs - Chỉ hiện cho admin */}
            {isAdmin() && (
                <div className="filter-tabs">
                    <button
                        className={`filter-tab ${filterTab === 'all' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('all')}
                    >
                        Tất cả
                    </button>
                    <button
                        className={`filter-tab ${filterTab === 'pending' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('pending')}
                    >
                        Chưa xử lý
                    </button>
                    <button
                        className={`filter-tab ${filterTab === 'resolved' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('resolved')}
                    >
                        Đã xử lý
                    </button>
                </div>
            )}

            <div className="reports-content">
                {reports.length === 0 ? (
                    <div className="no-reports">
                        <h3>Không có báo cáo nào</h3>
                        <p>
                            {isAdmin()
                                ? 'Chưa có báo cáo nào trong hệ thống.'
                                : 'Bạn chưa có báo cáo nào. Hãy hoàn thành task và tạo báo cáo!'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="reports-list">
                        {reports.map(report => (
                            <ReportCard
                                key={report.id}
                                report={report}
                                showUser={isAdmin()}
                                isAdmin={isAdmin()}
                                onReportUpdate={handleReportUpdate}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="pagination">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="pagination-btn"
                        >
                            ← Trước
                        </button>

                        <div className="pagination-info">
                            Trang {currentPage} / {totalPages}
                        </div>

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="pagination-btn"
                        >
                            Sau →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reports;