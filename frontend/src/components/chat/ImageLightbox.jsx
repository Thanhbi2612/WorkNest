// ================================================
// IMAGE LIGHTBOX COMPONENT
// Hiển thị ảnh full size như Messenger
// ================================================

import { useEffect } from 'react';
import './ImageLightbox.css';

const ImageLightbox = ({ imageUrl, onClose }) => {
    // Close on ESC key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    // Prevent body scroll when lightbox is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div className="image-lightbox-overlay" onClick={onClose}>
            <button className="lightbox-close-btn" onClick={onClose}>
                ✕
            </button>
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                <img src={imageUrl} alt="Full size" />
            </div>
        </div>
    );
};

export default ImageLightbox;
