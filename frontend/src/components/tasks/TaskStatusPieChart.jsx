import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import './TaskStatusPieChart.css';

const TaskStatusPieChart = ({ taskStats }) => {
    // Transform API data into Recharts format
    const data = [
        {
            name: 'Hoàn thành',
            value: taskStats?.completed || 0,
            color: '#10b981'
        },
        {
            name: 'Đang thực hiện',
            value: taskStats?.in_progress || 0,
            color: '#3b82f6'
        },
        {
            name: 'Chưa bắt đầu',
            value: taskStats?.not_started || 0,
            color: '#6b7280'
        },
        {
            name: 'Quá hạn',
            value: taskStats?.overdue || 0,
            color: '#ef4444'
        }
    ];

    // Filter out zero values for cleaner chart
    const filteredData = data.filter(item => item.value > 0);

    // Custom label to show percentage
    const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percent < 0.05) return null; // Don't show label for small slices

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                style={{ fontSize: '14px', fontWeight: '600' }}
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    // Custom tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label">{payload[0].name}</p>
                    <p className="tooltip-value">
                        Số lượng: <strong>{payload[0].value}</strong>
                    </p>
                    <p className="tooltip-percent">
                        Tỷ lệ: <strong>{((payload[0].percent || 0) * 100).toFixed(1)}%</strong>
                    </p>
                </div>
            );
        }
        return null;
    };

    if (!taskStats || filteredData.length === 0) {
        return (
            <div className="chart-container">
                <div className="chart-header">
                    <h3>Trạng thái nhiệm vụ</h3>
                </div>
                <div className="no-data">
                    <p>Chưa có dữ liệu nhiệm vụ</p>
                </div>
            </div>
        );
    }

    return (
        <div className="chart-container">
            <div className="chart-header">
                <h3>Trạng thái nhiệm vụ</h3>
                <p className="chart-subtitle">Tổng: {taskStats.total || 0} nhiệm vụ</p>
            </div>

            <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                    <Pie
                        data={filteredData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomLabel}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {filteredData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        formatter={(value, entry) => (
                            <span style={{ color: '#374151', fontSize: '14px' }}>
                                {value}: {entry.payload.value}
                            </span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TaskStatusPieChart;
