import React from 'react';
import { useSettings } from '../../context/SettingsContext';
import './Pagination.css';

// ELLIPSIS PAGINATION (Option 2) - Hiển thị ... cho nhiều trang
const Pagination = ({ currentPage, totalPages, totalItems, onPageChange, loading = false }) => {
    const { settings } = useSettings();
    const isDarkMode = settings.appearance.mode === 'dark';
    // Không hiển thị pagination nếu chỉ có 1 trang hoặc không có trang nào
    if (totalPages <= 1) {
        return null;
    }

    const handlePrevious = () => {
        if (currentPage > 1 && !loading) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages && !loading) {
            onPageChange(currentPage + 1);
        }
    };

    const handlePageClick = (page) => {
        if (page !== currentPage && !loading) {
            onPageChange(page);
        }
    };

    // Generate page numbers với ellipsis
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            // Hiển thị tất cả nếu ít hơn maxVisible
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Luôn hiển thị trang đầu
            pages.push(1);

            // Tính toán các trang ở giữa
            let startPage = Math.max(2, currentPage - 1);
            let endPage = Math.min(totalPages - 1, currentPage + 1);

            // Thêm dấu ... nếu cần
            if (startPage > 2) {
                pages.push('...');
            }

            // Thêm các trang ở giữa
            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }

            // Thêm dấu ... nếu cần
            if (endPage < totalPages - 1) {
                pages.push('...');
            }

            // Luôn hiển thị trang cuối
            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <div className={`pagination-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
            <div className="pagination-info">
                Trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong>
                {totalItems > 0 && <span className="total-items"> (Tổng: {totalItems} task)</span>}
            </div>

            <div className="pagination-controls">
                <button
                    className="pagination-btn prev"
                    onClick={handlePrevious}
                    disabled={currentPage === 1 || loading}
                >
                    ‹ Trước
                </button>

                <div className="pagination-numbers">
                    {getPageNumbers().map((page, index) => (
                        page === '...' ? (
                            <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                                ...
                            </span>
                        ) : (
                            <button
                                key={page}
                                className={`pagination-number ${page === currentPage ? 'active' : ''}`}
                                onClick={() => handlePageClick(page)}
                                disabled={loading}
                            >
                                {page}
                            </button>
                        )
                    ))}
                </div>

                <button
                    className="pagination-btn next"
                    onClick={handleNext}
                    disabled={currentPage === totalPages || loading}
                >
                    Tiếp ›
                </button>
            </div>
        </div>
    );
};

export default Pagination;
