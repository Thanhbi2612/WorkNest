import  { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import '../styles/toastCustom.css';
import { getEvents, createEvent, deleteEvent, updateEvent } from '../services/eventService';
import EventDetailPopup from '../components/calendar/EventDetailPopup';
import EventModal from '../components/calendar/EventModal';
import { useSettings } from '../context/SettingsContext';

const Calendar = () => {
  const { settings } = useSettings();
  const isDarkMode = settings.appearance.mode === 'dark';

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  // Load events từ API khi component mount
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const response = await getEvents();
        if (response.success) {
          // Transform API data to FullCalendar format
          const transformedEvents = response.data.map(event => ({
            id: event.id,
            title: event.title,
            start: event.start_date,
            end: event.end_date,
            backgroundColor: '#3b82f6',
            borderColor: '#3b82f6',
            extendedProps: {
              description: event.description,
              created_at: event.created_at,
              updated_at: event.updated_at
            }
          }));
          setEvents(transformedEvents);
        }
      } catch (error) {
        console.error('Failed to load events:', error);
        setError('Không thể tải danh sách sự kiện');
        toast.error('Không thể tải danh sách sự kiện');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Khi click vào ngày trống để tạo event mới
  const handleDateSelect = (selectInfo) => {
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();

    setSelectedDate(selectInfo);
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  // Khi click vào event có sẵn để xem chi tiết
  const handleEventClick = (clickInfo) => {
    setSelectedEvent(clickInfo.event);
    setShowDetailPopup(true);
  };

  // Xóa event
  const handleDeleteEvent = async (event) => {
    try {
      const response = await deleteEvent(event.id);

      if (response.success) {
        // Remove event từ calendar
        event.remove();

        // Cập nhật state
        setEvents(prevEvents => prevEvents.filter(e => e.id !== event.id));

        // Đóng popup
        setShowDetailPopup(false);
        setSelectedEvent(null);

        // Hiển thị thông báo thành công
        toast.success('Đã xóa sự kiện thành công!');
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast.error('Không thể xóa sự kiện. Vui lòng thử lại.');
    }
  };

  // Mở modal edit event
  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setShowDetailPopup(false);
    setShowEventModal(true);
  };

  // Lưu event (tạo mới hoặc update)
  const handleSaveEvent = async (eventData, existingEvent) => {
    try {
      if (existingEvent) {
        // Update existing event
        const response = await updateEvent(existingEvent.id, eventData);

        if (response.success) {
          // Update event trong calendar
          existingEvent.setProp('title', response.data.title);
          existingEvent.setStart(response.data.start_date);
          existingEvent.setEnd(response.data.end_date);
          existingEvent.setExtendedProp('description', response.data.description);
          existingEvent.setExtendedProp('updated_at', response.data.updated_at);

          // Cập nhật state
          setEvents(prevEvents =>
            prevEvents.map(e =>
              e.id === existingEvent.id
                ? {
                    ...e,
                    title: response.data.title,
                    start: response.data.start_date,
                    end: response.data.end_date,
                    extendedProps: {
                      ...e.extendedProps,
                      description: response.data.description,
                      updated_at: response.data.updated_at
                    }
                  }
                : e
            )
          );

          setShowEventModal(false);
          setSelectedEvent(null);

          // Hiển thị thông báo thành công
          toast.success('Đã cập nhật sự kiện thành công!');
        }
      } else {
        // Create new event
        const response = await createEvent(eventData);

        if (response.success) {
          // Transform API response to FullCalendar format
          const newEvent = {
            id: response.data.id,
            title: response.data.title,
            start: response.data.start_date,
            end: response.data.end_date,
            backgroundColor: '#3b82f6',
            borderColor: '#3b82f6',
            extendedProps: {
              description: response.data.description,
              created_at: response.data.created_at,
              updated_at: response.data.updated_at
            }
          };

          // Cập nhật state
          setEvents(prevEvents => [...prevEvents, newEvent]);

          setShowEventModal(false);
          setSelectedDate(null);

          // Hiển thị thông báo thành công
          toast.success('Đã tạo sự kiện mới thành công!');
        }
      }
    } catch (error) {
      console.error('Failed to save event:', error);
      toast.error('Không thể lưu sự kiện. Vui lòng thử lại.');
    }
  };

  return (
    <div style={{
      padding: '2rem',
      background: isDarkMode ? '#111827' : '#f3f4f6',
      minHeight: '100vh',
      color: isDarkMode ? '#f9fafb' : '#111827'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#1664d1',
            marginBottom: '0.5rem'
          }}>
            Lịch công việc
          </h1>
          <p style={{ fontSize: '1.1rem' , color: isDarkMode ? '#1664d1' : '#1664d1'}}>
            Quản lý thời gian và lịch trình của bạn. Click vào ngày để thêm sự kiện, click vào sự kiện để xem chi tiết.
          </p>
          <p style={{ fontSize: '1.1rem' , color: isDarkMode ? '#1664d1' : '#1664d1'}}>
            Hãy chọn Tháng, Tuần và Ngày để cụ thể hóa thời gian công việc của bạn ^^
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#dc2626',
            color: '#fff',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{
            background: isDarkMode ? '#1f2937' : '#ffffff',
            borderRadius: '12px',
            padding: '3rem',
            border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <p style={{ color: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: '1.1rem' }}>
              Đang tải lịch công việc...
            </p>
          </div>
        )}

        {/* Calendar Container - only show when not loading */}
        {!loading && (
          <div style={{
            background: isDarkMode ? '#1f2937' : '#ffffff',
            borderRadius: '12px',
            padding: '2rem',
            border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb'
          }}>
            <style jsx>{`
            .fc {
              --fc-bg-event-color: #3b82f6;
              --fc-bg-event-opacity: 1;
              --fc-border-color: ${isDarkMode ? '#374151' : '#e5e7eb'};
              --fc-button-bg-color: ${isDarkMode ? '#374151' : '#f3f4f6'};
              --fc-button-border-color: ${isDarkMode ? '#374151' : '#d1d5db'};
              --fc-button-hover-bg-color: ${isDarkMode ? '#4b5563' : '#e5e7eb'};
              --fc-button-hover-border-color: ${isDarkMode ? '#4b5563' : '#d1d5db'};
              --fc-button-active-bg-color: ${isDarkMode ? '#6b7280' : '#d1d5db'};
              --fc-button-active-border-color: ${isDarkMode ? '#6b7280' : '#9ca3af'};
              --fc-event-text-color: #ffffff;
              --fc-neutral-bg-color: ${isDarkMode ? '#1f2937' : '#ffffff'};
              --fc-page-bg-color: ${isDarkMode ? '#1f2937' : '#ffffff'};
            }

            .fc .fc-toolbar-title {
              color: ${isDarkMode ? '#f9fafb' : '#111827'} !important;
              font-size: 1.5rem !important;
              font-weight: 600 !important;
            }

            .fc .fc-button-primary {
              background-color: ${isDarkMode ? '#374151' : '#f3f4f6'} !important;
              border-color: ${isDarkMode ? '#374151' : '#d1d5db'} !important;
              color: ${isDarkMode ? '#f9fafb' : '#111827'} !important;
            }

            .fc .fc-button-primary:hover {
              background-color: ${isDarkMode ? '#4b5563' : '#e5e7eb'} !important;
              border-color: ${isDarkMode ? '#4b5563' : '#d1d5db'} !important;
            }

            .fc .fc-button-primary:focus {
              box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25) !important;
            }

            .fc-theme-standard .fc-scrollgrid {
              border: 1px solid ${isDarkMode ? '#374151' : '#e5e7eb'} !important;
            }

            .fc-theme-standard td, .fc-theme-standard th {
              border: 1px solid ${isDarkMode ? '#374151' : '#e5e7eb'} !important;
            }

            .fc-col-header-cell {
              background-color: ${isDarkMode ? '#374151' : '#f9fafb'} !important;
            }

            .fc-col-header-cell-cushion {
              color: ${isDarkMode ? '#f9fafb' : '#111827'} !important;
              font-weight: 600 !important;
              padding: 10px 4px !important;
            }

            .fc-daygrid-day {
              background-color: ${isDarkMode ? '#1f2937' : '#ffffff'} !important;
            }

            .fc-daygrid-day:hover {
              background-color: ${isDarkMode ? '#374151' : '#f3f4f6'} !important;
            }

            .fc-daygrid-day-number {
              color: ${isDarkMode ? '#f9fafb' : '#111827'} !important;
              padding: 8px !important;
            }

            .fc-day-today {
              background-color: rgba(59, 130, 246, 0.1) !important;
            }

            .fc-day-today .fc-daygrid-day-number {
              color: #3b82f6 !important;
              font-weight: bold !important;
            }

            .fc-event {
              cursor: pointer !important;
              border-radius: 4px !important;
              margin: 1px !important;
            }

            .fc-event:hover {
              opacity: 0.8 !important;
            }

            .fc-event-title {
              font-weight: 500 !important;
              font-size: 0.875rem !important;
            }

            .fc-timegrid-slot {
              height: 2.5em !important;
            }

            .fc-timegrid-axis {
              color: ${isDarkMode ? '#9ca3af' : '#6b7280'} !important;
            }

            .fc-timegrid-slot-label {
              color: ${isDarkMode ? '#9ca3af' : '#6b7280'} !important;
            }

            .fc-scrollgrid-liquid {
              height: auto !important;
            }
          `}</style>

          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            initialView='dayGridMonth'
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            events={events}
            select={handleDateSelect}
            eventClick={handleEventClick}
            height="auto"
            locale="vi"
            buttonText={{
              today: 'Hôm nay',
              month: 'Tháng',
              week: 'Tuần',
              day: 'Ngày'
            }}
            dayHeaderFormat={{
              weekday: 'short'
            }}
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
            displayEventTime={true}
            displayEventEnd={true}
          />
        </div>
        )}

        {/* Event Detail Popup */}
        <EventDetailPopup
          event={selectedEvent}
          onClose={() => {
            setShowDetailPopup(false);
            setSelectedEvent(null);
          }}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
        />

        {/* Event Create/Edit Modal */}
        <EventModal
          isOpen={showEventModal}
          onClose={() => {
            setShowEventModal(false);
            setSelectedEvent(null);
            setSelectedDate(null);
          }}
          onSave={handleSaveEvent}
          event={selectedEvent}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  );
};

export default Calendar;