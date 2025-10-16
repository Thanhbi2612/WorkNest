import { useState, useEffect } from 'react';
import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import './TaskCompletionRadialChart.css';

const TaskCompletionRadialChart = ({ taskStats }) => {
    // Calculate completion rate
    const total = taskStats?.total || 0;
    const completed = taskStats?.completed || 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Data for RadialBarChart
    const data = [
        {
            name: 'Hoàn thành',
            value: completionRate,
            fill: '#10b981'
        }
    ];

    // Custom label in center
    const renderCustomLabel = () => {
        return (
            <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="radial-label"
            >
                <tspan x="50%" dy="-10" className="radial-percentage">
                    {completionRate}%
                </tspan>
                <tspan x="50%" dy="25" className="radial-subtitle">
                    Hoàn thành
                </tspan>
            </text>
        );
    };

    return (
        <div className="chart-container radial-chart-container">
            <div className="chart-header">
                <h3>Tỷ lệ hoàn thành</h3>
                <p className="chart-subtitle">
                    {completed} / {total} nhiệm vụ
                </p>
            </div>

            {total === 0 ? (
                <div className="no-data">
                    <p>Chưa có dữ liệu nhiệm vụ</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="90%"
                        barSize={20}
                        data={data}
                        startAngle={90}
                        endAngle={-270}
                    >
                        <PolarAngleAxis
                            type="number"
                            domain={[0, 100]}
                            angleAxisId={0}
                            tick={false}
                        />
                        <RadialBar
                            background={{ fill: '#e5e7eb' }}
                            dataKey="value"
                            cornerRadius={10}
                            fill="#10b981"
                        />
                        {renderCustomLabel()}
                    </RadialBarChart>
                </ResponsiveContainer>
            )}

            {/* Additional Stats */}
            <div className="completion-stats">
                <div className="stat-item">
                    <span className="stat-label">Đang làm:</span>
                    <span className="stat-value in-progress">{taskStats?.in_progress || 0}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Chưa bắt đầu:</span>
                    <span className="stat-value not-started">{taskStats?.not_started || 0}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Quá hạn:</span>
                    <span className="stat-value overdue">{taskStats?.overdue || 0}</span>
                </div>
            </div>
        </div>
    );
};

export default TaskCompletionRadialChart;
