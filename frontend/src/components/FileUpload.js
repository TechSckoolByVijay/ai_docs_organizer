/**
 * File Upload component with drag-and-drop functionality
 */
import React, { useState, useRef } from 'react';
import { documentsAPI } from '../api';
import { useNotification } from '../NotificationContext';
import { 
  Upload, 
  Camera, 
  FileText, 
  Loader, 
  Check,
  FolderOpen,
  X,
  AlertCircle
} from 'lucide-react';

const FileUpload = ({ onUploadSuccess, onUploadError }) => {
  const { addNotification } = useNotification();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [batchUploading, setBatchUploading] = useState(false);
  const [fileStatuses, setFileStatuses] = useState({});
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
      if (files.length === 1) {
        uploadFile(files[0]);
      } else {
        setSelectedFiles(files);
      }
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      if (files.length === 1) {
        uploadFile(files[0]);
      } else {
        setSelectedFiles(files);
      }
    }
  };

  const uploadFile = async (file) => {
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (selectedCategory) {
        formData.append('category', selectedCategory);
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 20;
        });
      }, 200);

      const response = await documentsAPI.upload(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Add success notification
      addNotification({
        type: 'success',
        title: 'File Uploaded Successfully',
        message: `${file.name} has been uploaded and is being processed.`,
        autoRemove: true
      });
      
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
      
      // Reset form
      setSelectedCategory('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Reset progress after success animation
      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      const message = error.response?.data?.detail || 'Upload failed';
      
      // Add error notification
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: `Failed to upload ${file.name}: ${message}`,
        autoRemove: true
      });
      
      if (onUploadError) {
        onUploadError(message);
      }
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const uploadBatch = async () => {
    if (selectedFiles.length === 0) return;
    
    setBatchUploading(true);
    setFileStatuses({});
    
    try {
      const formData = new FormData();
      
      // Add all files to FormData
      selectedFiles.forEach((file, index) => {
        formData.append('files', file);
        setFileStatuses(prev => ({
          ...prev,
          [file.name]: { status: 'pending', progress: 0 }
        }));
      });
      
      // Add category if selected
      if (selectedCategory) {
        formData.append('category', selectedCategory);
      }

      const response = await documentsAPI.uploadBatch(formData);
      
      // Update file statuses based on response
      const updatedStatuses = {};
      response.data.files.forEach(fileResult => {
        updatedStatuses[fileResult.filename] = {
          status: fileResult.status,
          progress: 100,
          error: fileResult.error_message,
          documentId: fileResult.document_id
        };
      });
      setFileStatuses(updatedStatuses);
      
      // Add success notification
      addNotification({
        type: response.data.successful_uploads > 0 ? 'success' : 'error',
        title: 'Batch Upload Complete',
        message: response.data.message,
        autoRemove: true
      });
      
      if (onUploadSuccess && response.data.successful_uploads > 0) {
        onUploadSuccess(response.data);
      }
      
      // Reset after successful upload
      setTimeout(() => {
        setSelectedFiles([]);
        setFileStatuses({});
        setSelectedCategory('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 3000);
      
    } catch (error) {
      const message = error.response?.data?.detail || 'Batch upload failed';
      
      // Mark all files as failed
      const failedStatuses = {};
      selectedFiles.forEach(file => {
        failedStatuses[file.name] = {
          status: 'error',
          progress: 0,
          error: message
        };
      });
      setFileStatuses(failedStatuses);
      
      addNotification({
        type: 'error',
        title: 'Batch Upload Failed',
        message,
        autoRemove: true
      });
      
      if (onUploadError) {
        onUploadError(message);
      }
    } finally {
      setBatchUploading(false);
    }
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    
    // Remove from file statuses
    const fileToRemove = selectedFiles[index];
    if (fileToRemove) {
      setFileStatuses(prev => {
        const updated = { ...prev };
        delete updated[fileToRemove.name];
        return updated;
      });
    }
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    setFileStatuses({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCameraCapture = () => {
    // Request camera access for mobile devices
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.setAttribute('accept', 'image/*');
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Category (optional)
        </label>
        <div className="relative">
          <FolderOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field pl-10"
          >
            <option value="">Auto-detect category</option>
            {categories.map((category) => (
              <option key={category.name} value={category.name}>
                {category.display_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`upload-area ${isDragOver ? 'drag-over' : ''} ${(uploading || batchUploading) ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !(uploading || batchUploading) && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
          multiple
        />
        
        {(uploading || batchUploading) ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-200 dark:border-dark-600 rounded-full"></div>
              <div 
                className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"
                style={{
                  transform: `rotate(${uploadProgress * 3.6}deg)`,
                  transition: 'transform 0.3s ease'
                }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                {uploadProgress === 100 ? (
                  <Check className="w-8 h-8 text-green-500" />
                ) : (
                  <Loader className="w-8 h-8 text-primary-600 animate-pulse" />
                )}
              </div>
            </div>
            <div className="text-center">
              <p className="text-primary-600 dark:text-primary-400 font-medium">
                {uploadProgress === 100 ? 'Upload Complete!' : (batchUploading ? 'Processing Files...' : 'Uploading...')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {batchUploading ? `${selectedFiles.length} files` : `${Math.round(uploadProgress)}%`}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Drop files here or click to browse
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-1">
                Support for PDF, JPG, PNG, GIF, DOC, DOCX files
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Maximum file size: 10MB • Select multiple files for batch upload
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Selected Files Display */}
      {selectedFiles.length > 0 && (
        <div className="space-y-4 bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Selected Files ({selectedFiles.length})
            </h4>
            <div
              onClick={(e) => {
                e.preventDefault();                // Stop form submission
                e.stopPropagation();              // Stop event bubbling
                clearAllFiles();                  // Execute clear function
              }}
              disabled={batchUploading}
              style={{ 
                pointerEvents: 'auto',            // Force click capture
                zIndex: 9999,                     // Bring to front
                border: '1px solid #ef4444',      // Visible border
                padding: '6px 12px',              // Click area
                cursor: 'pointer',                // Visual feedback
                borderRadius: '6px',              // Rounded corners
                backgroundColor: batchUploading ? '#fca5a5' : 'transparent',
                color: batchUploading ? '#991b1b' : '#ef4444',
                fontSize: '14px',
                fontWeight: '500'
              }}
              className={batchUploading ? 'opacity-50' : 'hover:bg-red-50'}
            >
              Clear All
            </div>
          </div>
          
          {/* Isolated scrollable container */}
          <div 
            onClick={(e) => {
              e.preventDefault();                // Stop form submission
              e.stopPropagation();              // Stop event bubbling
            }}
            onWheel={(e) => {
              e.stopPropagation();              // Allow wheel scroll
            }}
            onMouseDown={(e) => {
              e.stopPropagation();              // Allow drag scroll
            }}
            onTouchStart={(e) => {
              e.stopPropagation();              // Allow touch scroll
            }}
            style={{
              maxHeight: '256px',
              overflowY: 'scroll',
              overflowX: 'hidden',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px',
              backgroundColor: '#f9fafb',
              position: 'relative',
              pointerEvents: 'auto',            // Force interaction
              zIndex: 1000,                     // Bring to front
              cursor: 'default'                 // Normal cursor for content
            }}
          >
            <div className="space-y-2">
            {selectedFiles.map((file, index) => {
              const status = fileStatuses[file.name];
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {status && (
                      <div className="flex items-center space-x-1">
                        {status.status === 'success' && <Check className="w-4 h-4 text-green-500" />}
                        {status.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                        {status.status === 'pending' && <Loader className="w-4 h-4 text-blue-500 animate-spin" />}
                      </div>
                    )}
                    {!batchUploading && (
                      <div
                        onClick={(e) => {
                          e.preventDefault();                // Stop form submission
                          e.stopPropagation();              // Stop event bubbling
                          removeFile(index);                // Execute remove function
                        }}
                        style={{ 
                          pointerEvents: 'auto',            // Force click capture
                          zIndex: 9999,                     // Bring to front
                          padding: '4px',                   // Click area
                          cursor: 'pointer',                // Visual feedback
                          borderRadius: '4px',              // Rounded corners
                          color: '#ef4444'
                        }}
                        className="hover:bg-red-100 dark:hover:bg-red-900/20"
                      >
                        <X className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
          
          {/* Batch Upload Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={uploadBatch}
              disabled={batchUploading || selectedFiles.length === 0}
              className="flex-1 btn-primary flex items-center justify-center space-x-2"
            >
              <Upload className="w-5 h-5" />
              <span>{batchUploading ? 'Uploading...' : `Upload ${selectedFiles.length} Files`}</span>
            </button>
          </div>
        </div>
      )}

      {/* Upload Progress Bar */}
      {uploading && (
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-primary-500 to-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}

      {/* Action Buttons - Only show when no files selected */}
      {selectedFiles.length === 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || batchUploading}
            className="flex-1 btn-primary flex items-center justify-center space-x-2"
          >
            <FolderOpen className="w-5 h-5" />
            <span>Browse Files</span>
          </button>
          <button
            type="button"
            onClick={handleCameraCapture}
            disabled={uploading || batchUploading}
            className="flex-1 btn-secondary flex items-center justify-center space-x-2"
          >
            <Camera className="w-5 h-5" />
            <span>Camera</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;