/**
 * File Upload component with drag-and-drop functionality
 */
import React, { useState, useRef } from 'react';
import { documentsAPI } from '../api';
import { 
  Upload, 
  Camera, 
  Image, 
  FileText, 
  Loader, 
  Check,
  FolderOpen
} from 'lucide-react';

const FileUpload = ({ onUploadSuccess, onUploadError }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
      if (onUploadError) {
        onUploadError(message);
      }
      setUploadProgress(0);
    } finally {
      setUploading(false);
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
        className={`upload-area ${isDragOver ? 'drag-over' : ''} ${uploading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
        />
        
        {uploading ? (
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
                {uploadProgress === 100 ? 'Upload Complete!' : 'Uploading...'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {Math.round(uploadProgress)}%
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
                Maximum file size: 10MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Progress Bar */}
      {uploading && (
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-primary-500 to-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex-1 btn-primary flex items-center justify-center space-x-2"
        >
          <FolderOpen className="w-5 h-5" />
          <span>Browse Files</span>
        </button>
        <button
          type="button"
          onClick={handleCameraCapture}
          disabled={uploading}
          className="flex-1 btn-secondary flex items-center justify-center space-x-2"
        >
          <Camera className="w-5 h-5" />
          <span>Camera</span>
        </button>
      </div>

      {/* Supported File Types */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Supported File Types:
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { type: 'PDF Documents', icon: <FileText className="w-5 h-5 text-red-500" /> },
            { type: 'Images (JPG, PNG)', icon: <Image className="w-5 h-5 text-blue-500" /> },
            { type: 'Word Documents', icon: <FileText className="w-5 h-5 text-blue-600" /> },
          ].map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              {item.icon}
              <span className="text-sm text-gray-600 dark:text-gray-400">{item.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;