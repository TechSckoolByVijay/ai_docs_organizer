/**
 * File Upload component with drag-and-drop functionality
 */
import React, { useState, useRef } from 'react';
import { documentsAPI } from '../api';

const FileUpload = ({ onUploadSuccess, onUploadError }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const fileInputRef = useRef(null);

  // Load categories on component mount
  React.useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await documentsAPI.getCategories();
        setCategories(response.data);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const uploadFile = async (file) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (selectedCategory) {
        formData.append('category', selectedCategory);
      }

      const response = await documentsAPI.upload(formData);
      
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
      
      // Reset form
      setSelectedCategory('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const message = error.response?.data?.detail || 'Upload failed';
      if (onUploadError) {
        onUploadError(message);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleCameraCapture = () => {
    // Request camera access for mobile devices
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formGroup}>
        <label style={styles.label}>Category (optional)</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={styles.select}
        >
          <option value="">Auto-detect category</option>
          {categories.map((category) => (
            <option key={category.name} value={category.name}>
              {category.display_name}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          ...styles.dropZone,
          ...(isDragOver ? styles.dropZoneActive : {}),
          ...(uploading ? styles.dropZoneUploading : {}),
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          style={styles.hiddenInput}
          accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
        />
        
        {uploading ? (
          <div style={styles.uploadingContent}>
            <div style={styles.spinner}></div>
            <p>Uploading...</p>
          </div>
        ) : (
          <div style={styles.dropContent}>
            <div style={styles.icon}>📄</div>
            <h3 style={styles.dropTitle}>Drop files here or click to browse</h3>
            <p style={styles.dropSubtitle}>
              Support for PDF, JPG, PNG, GIF, DOC, DOCX files
            </p>
            <p style={styles.dropHint}>Maximum file size: 10MB</p>
          </div>
        )}
      </div>

      <div style={styles.buttonGroup}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={styles.button}
          disabled={uploading}
        >
          Browse Files
        </button>
        <button
          type="button"
          onClick={handleCameraCapture}
          style={styles.cameraButton}
          disabled={uploading}
        >
          📷 Camera
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    marginBottom: '24px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '4px',
    fontWeight: '500',
    color: '#374151',
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
  },
  dropZone: {
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    padding: '40px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: '#fafafa',
    marginBottom: '16px',
  },
  dropZoneActive: {
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  dropZoneUploading: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
    cursor: 'not-allowed',
  },
  hiddenInput: {
    display: 'none',
  },
  dropContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  icon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  dropTitle: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#374151',
  },
  dropSubtitle: {
    margin: '0 0 4px 0',
    color: '#6b7280',
    fontSize: '14px',
  },
  dropHint: {
    margin: 0,
    color: '#9ca3af',
    fontSize: '12px',
  },
  uploadingContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: '#10b981',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #d1d5db',
    borderTop: '3px solid #10b981',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '12px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  button: {
    padding: '10px 20px',
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  cameraButton: {
    padding: '10px 20px',
    background: '#059669',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
};

// Add CSS animation for spinner
const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;
document.head.appendChild(styleSheet);

export default FileUpload;