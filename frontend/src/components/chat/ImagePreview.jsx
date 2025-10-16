// ================================================
// IMAGE PREVIEW COMPONENT
// Hiển thị preview các ảnh đã chọn trước khi gửi
// ================================================

import './ImagePreview.css';

const ImagePreview = ({ images, onRemove }) => {
    if (!images || images.length === 0) {
        return null;
    }

    return (
        <div className="image-preview-container">
            <div className="image-preview-list">
                {images.map((image) => (
                    <div key={image.id} className="image-preview-item">
                        <img
                            src={image.preview}
                            alt={image.name}
                            className="preview-thumbnail"
                        />
                        <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => onRemove(image.id)}
                            title="Xóa ảnh"
                        >
                            ✕
                        </button>
                        <div className="image-info">
                            <span className="image-name">{image.name}</span>
                            <span className="image-size">
                                {(image.size / 1024).toFixed(1)} KB
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ImagePreview;
