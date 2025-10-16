
import { useLocation } from 'react-router-dom';
import TaskList from '../components/tasks/TaskList';

const TasksPage = () => {
    const location = useLocation();

    // Lấy filter type từ pathname
    const pathname = location.pathname;
    let filterType = 'today';
    let title = 'Nhiệm vụ chưa bắt đầu';

    if (pathname.includes('not-started')) {
        filterType = 'today';
        title = 'Nhiệm vụ chưa bắt đầu';
    } else if (pathname.includes('in-progress')) {
        filterType = 'upcoming';
        title = 'Nhiệm vụ đang làm';
    } else if (pathname.includes('overdue')) {
        filterType = 'overdue';
        title = 'Nhiệm vụ quá hạn';
    }

    return (
        <TaskList
            filterType={filterType}
            title={title}
        />
    );
};

export default TasksPage;
