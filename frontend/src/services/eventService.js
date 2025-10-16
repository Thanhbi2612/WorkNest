import api from './api';

// Lấy danh sách events
export const getEvents = async () => {
    try {
        const response = await api.get('/events');
        return response.data;
    } catch (error) {
        console.error('Error fetching events:', error);
        throw error;
    }
};

// Tạo event mới
export const createEvent = async (eventData) => {
    try {
        const response = await api.post('/events', eventData);
        return response.data;
    } catch (error) {
        console.error('Error creating event:', error);
        throw error;
    }
};

// Cập nhật event
export const updateEvent = async (id, eventData) => {
    try {
        const response = await api.put(`/events/${id}`, eventData);
        return response.data;
    } catch (error) {
        console.error('Error updating event:', error);
        throw error;
    }
};

// Xóa event
export const deleteEvent = async (id) => {
    try {
        const response = await api.delete(`/events/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting event:', error);
        throw error;
    }
};

// Lấy chi tiết một event
export const getEventById = async (id) => {
    try {
        const response = await api.get(`/events/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching event:', error);
        throw error;
    }
};

// Lấy events của hôm nay
export const getTodayEvents = async () => {
    try {
        const response = await api.get('/events/today');
        return response.data;
    } catch (error) {
        console.error('Error fetching today events:', error);
        throw error;
    }
};