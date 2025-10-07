/**
 * Document List component for displaying user documents
 */
import React, { useState, useEffect } from 'react';
import { documentsAPI } from '../api';
import { 
  Download, 
  Trash2, 
  FileText, 
  Image, 
  Calendar, 
  HardDrive, 
  RefreshCw,
  FolderOpen,
  AlertCircle,
  CheckCircle,
  Clock,
  File,
  Tag
} from 'lucide-react';

const DocumentList = ({ documents, onDocumentDeleted, onRefresh }) => {
  const [deletingId, setDeletingId] = useState(null);
  const [thumbnailUrls, setThumbnailUrls] = useState({});

  // Load thumbnails for image documents
  useEffect(() => {
    const loadThumbnails = async () => {
      const imageDocuments = documents.filter(doc => 
        doc.content_type && (doc.content_type.startsWith('image/') || doc.content_type === 'application/pdf')
      );

      const newThumbnailUrls = {};
      
      for (const doc of imageDocuments) {
        try {
          const response = await documentsAPI.getThumbnail(doc.id, 960);
          const blob = new Blob([response.data], { type: 'image/jpeg' });
          const url = URL.createObjectURL(blob);
          newThumbnailUrls[doc.id] = url;
        } catch (error) {
          console.log(`Failed to load thumbnail for document ${doc.id}:`, error);
        }
      }
      
      setThumbnailUrls(prev => {
        // Clean up old URLs
        Object.values(prev).forEach(url => URL.revokeObjectURL(url));
        return newThumbnailUrls;
      });
    };

    if (documents.length > 0) {
      loadThumbnails();
    }

    // Cleanup function
    return () => {
      Object.values(thumbnailUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [documents]);

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    setDeletingId(documentId);
    try {
      await documentsAPI.delete(documentId);
      
      // Clean up thumbnail URL if exists
      if (thumbnailUrls[documentId]) {
        URL.revokeObjectURL(thumbnailUrls[documentId]);
        setThumbnailUrls(prev => {
          const newUrls = { ...prev };
          delete newUrls[documentId];
          return newUrls;
        });
      }
      
      if (onDocumentDeleted) {
        onDocumentDeleted(documentId);
      }
    } catch (error) {
      alert('Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (documentId, filename) => {
    try {
      const response = await documentsAPI.download(documentId);
      
      // Create blob and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Failed to download document');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getFileIcon = (doc) => {
    const filename = doc.original_filename;
    const contentType = doc.content_type;
    const extension = filename.toLowerCase().split('.').pop();
    
    // Check if we have a thumbnail for this image or PDF - smaller size for better layout
    if ((contentType?.includes('image') || contentType === 'application/pdf') && thumbnailUrls[doc.id]) {
      return (
        <div className="w-48 h-48 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 shadow-md">
          <img 
            src={thumbnailUrls[doc.id]} 
            alt={filename}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      );
    }
    
    // Fallback to medium-sized icons for non-images/PDFs
    if (contentType?.includes('image') || ['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return <Image className="w-12 h-12 text-blue-500" />;
    }
    
    switch (extension) {
      case 'pdf':
        return <FileText className="w-12 h-12 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="w-12 h-12 text-blue-600" />;
      default:
        return <File className="w-12 h-12 text-gray-500" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null; // Don't show icon for completed status
    }
  };

  const shouldShowStatus = (status) => {
    // Only show status if it's not completed (to reduce UI clutter)
    return status && status !== 'completed';
  };

  const getCategoryStyle = (category) => {
    const styles = {
      invoice: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200',
      medical: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200',
      insurance: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200',
      tax: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200',
      financial: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200',
      warranty: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-200',
      utility: 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200',
      legal: 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200',
      employment: 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-800 dark:text-cyan-200',
      automotive: 'bg-lime-100 dark:bg-lime-900/20 text-lime-800 dark:text-lime-200',
      real_estate: 'bg-pink-100 dark:bg-pink-900/20 text-pink-800 dark:text-pink-200',
      subscription: 'bg-teal-100 dark:bg-teal-900/20 text-teal-800 dark:text-teal-200',
      government: 'bg-violet-100 dark:bg-violet-900/20 text-violet-800 dark:text-violet-200',
      business: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200',
      travel: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200',
      education: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200',
      personal: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200',
      other: 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200',
    };
    return styles[category] || styles.other;
  };

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
          <FolderOpen className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No documents yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
          Upload your first document to get started organizing your files with AI-powered categorization
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Compact */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Your Documents ({documents.length})
        </h3>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRefresh();
          }}
          style={{ pointerEvents: 'auto', zIndex: 10 }}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors cursor-pointer text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Document Grid - optimized layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
        {documents.map((doc, index) => (
          <div 
            key={doc.id} 
            className="card p-5 card-hover animate-slide-up overflow-hidden relative group"
            style={{ 
              animationDelay: `${index * 50}ms`,
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}
            title={doc.extracted_text ? `Preview: ${doc.extracted_text.substring(0, 200)}...` : doc.original_filename}
          >
            {/* Hover Preview Tooltip */}
            {doc.extracted_text && (
              <div className="absolute inset-x-0 bottom-0 bg-gray-900/95 dark:bg-gray-800/95 text-white p-3 rounded-b-lg transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-in-out z-10 backdrop-blur-sm">
                <div className="flex items-start space-x-2">
                  <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-300" />
                  <div>
                    <p className="text-xs font-medium text-blue-200 mb-1">Document Preview:</p>
                    <p className="text-xs text-gray-200 leading-relaxed">
                      "{doc.extracted_text.substring(0, 150)}..."
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Large Thumbnail Display - moved to top for image documents and PDFs */}
            {((doc.content_type?.includes('image') || doc.content_type === 'application/pdf') && thumbnailUrls[doc.id]) && (
              <div className="flex justify-center mb-4">
                <div className="w-48 h-48 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 shadow-md">
                  <img 
                    src={thumbnailUrls[doc.id]} 
                    alt={doc.original_filename}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            )}
            
            {/* Card Header - Compact */}
            <div className="flex items-start justify-between mb-3 w-full overflow-hidden">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                {/* Only show small icon if not an image/PDF with thumbnail */}
                {!((doc.content_type?.includes('image') || doc.content_type === 'application/pdf') && thumbnailUrls[doc.id]) && (
                  <div className="flex-shrink-0">
                    {getFileIcon(doc)}
                  </div>
                )}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <h4 
                    className="text-base font-semibold text-gray-900 dark:text-white truncate w-full mb-1" 
                    title={doc.original_filename}
                  >
                    {doc.original_filename}
                  </h4>
                  <div className="flex items-center flex-wrap gap-2 w-full overflow-hidden">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${getCategoryStyle(doc.category)} flex-shrink-0`}>
                      <Tag className="w-2.5 h-2.5 mr-1" />
                      {doc.category}
                    </span>
                    {shouldShowStatus(doc.processing_status) && (
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        {getStatusIcon(doc.processing_status)}
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {doc.processing_status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-1 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDownload(doc.id, doc.original_filename);
                  }}
                  style={{ pointerEvents: 'auto', zIndex: 10 }}
                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors cursor-pointer"
                  title="Download document"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(doc.id);
                  }}
                  disabled={deletingId === doc.id}
                  style={{ pointerEvents: 'auto', zIndex: 10 }}
                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                  title="Delete document"
                >
                  {deletingId === doc.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Document Details - Compact */}
            <div className="grid grid-cols-2 gap-3 py-2 border-t border-gray-200 dark:border-gray-600 w-full overflow-hidden">
              <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 min-w-0 overflow-hidden">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span className="truncate max-w-full">
                  {formatDate(doc.upload_date)}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 min-w-0 overflow-hidden">
                <HardDrive className="w-3 h-3 flex-shrink-0" />
                <span className="truncate max-w-full">
                  {formatFileSize(doc.file_size)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentList;