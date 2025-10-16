// ================================================
// MESSAGE MENU COMPONENT
// 3-dot menu với Edit/Delete options
// ================================================

import { useState, useEffect, useRef } from 'react';
import './MessageMenu.css';

const MessageMenu = ({ messageId, onEdit, onDelete, isOwn, canEdit = true }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    // Close menu khi click bên ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Chỉ hiện menu cho tin nhắn của mình
    if (!isOwn) return null;

    const handleEdit = () => {
        setIsOpen(false);
        onEdit(messageId);
    };

    const handleDelete = () => {
        setIsOpen(false);
        onDelete(messageId);
    };

    return (
        <div className="message-menu" ref={menuRef}>
            <button
                className="message-menu-btn"
                onClick={() => setIsOpen(!isOpen)}
                title="Tùy chọn"
            >
                ⋮
            </button>

            {isOpen && (
                <div className="message-menu-dropdown">
                    {canEdit && (
                        <button className="menu-option" onClick={handleEdit}>
                             Sửa
                        </button>
                    )}
                    <button className="menu-option delete" onClick={handleDelete}>
                         Xóa
                    </button>
                </div>
            )}
        </div>
    );
};

export default MessageMenu;
