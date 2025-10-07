/**
 * Document List component for displaying user documents
 */
import React, { useState } from 'react';
import { documentsAPI } from '../api';

const DocumentList = ({ documents, onDocumentDeleted, onRefresh }) => {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    setDeletingId(documentId);
    try {
      await documentsAPI.delete(documentId);
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

  const getCategoryColor = (category) => {
    const colors = {
      invoice: '#3b82f6',
      medical: '#ef4444',
      insurance: '#8b5cf6',
      tax: '#f59e0b',
      financial: '#10b981',
      warranty: '#6366f1',
      utility: '#f97316',
      legal: '#64748b',
      employment: '#06b6d4',
      automotive: '#84cc16',
      real_estate: '#ec4899',
      subscription: '#14b8a6',
      government: '#7c3aed',
      business: '#dc2626',
      travel: '#2563eb',
      education: '#059669',
      personal: '#9333ea',
      other: '#6b7280',
    };
    return colors[category] || '#6b7280';
  };

  if (documents.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>📂</div>
        <h3 style={styles.emptyTitle}>No documents yet</h3>
        <p style={styles.emptySubtitle}>
          Upload your first document to get started organizing your files
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Your Documents ({documents.length})</h3>
        <button onClick={onRefresh} style={styles.refreshButton}>
          🔄 Refresh
        </button>
      </div>

      <div style={styles.grid}>
        {documents.map((doc) => (
          <div key={doc.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div 
                style={{
                  ...styles.categoryBadge,
                  backgroundColor: getCategoryColor(doc.category),
                }}
              >
                {doc.category}
              </div>
              <div style={styles.cardActions}>
                <button
                  onClick={() => handleDownload(doc.id, doc.original_filename)}
                  style={styles.actionButton}
                  title="Download"
                >
                  ⬇️
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  style={styles.deleteButton}
                  disabled={deletingId === doc.id}
                  title="Delete"
                >
                  {deletingId === doc.id ? '⏳' : '🗑️'}
                </button>
              </div>
            </div>

            <div style={styles.cardBody}>
              <h4 style={styles.filename}>{doc.original_filename}</h4>
              <div style={styles.details}>
                <span style={styles.detail}>
                  📅 {formatDate(doc.upload_date)}
                </span>
                <span style={styles.detail}>
                  📏 {formatFileSize(doc.file_size)}
                </span>
                <span style={styles.detail}>
                  📋 {doc.content_type}
                </span>
              </div>
              
              {doc.processing_status && (
                <div style={styles.statusContainer}>
                  <span 
                    style={{
                      ...styles.status,
                      ...(doc.processing_status === 'completed' ? styles.statusCompleted :
                          doc.processing_status === 'failed' ? styles.statusFailed :
                          styles.statusPending)
                    }}
                  >
                    {doc.processing_status === 'completed' ? '✅' : 
                     doc.processing_status === 'failed' ? '❌' : '⏳'} 
                    {doc.processing_status}
                  </span>
                </div>
              )}

              {doc.extracted_text && (
                <div style={styles.preview}>
                  <p style={styles.previewText}>
                    {doc.extracted_text.substring(0, 100)}...
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    margin: '24px 0',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    margin: 0,
    color: '#1f2937',
    fontSize: '20px',
    fontWeight: '600',
  },
  refreshButton: {
    padding: '8px 16px',
    background: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  card: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  categoryBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  cardActions: {
    display: 'flex',
    gap: '4px',
  },
  actionButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    fontSize: '16px',
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    fontSize: '16px',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  filename: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '500',
    color: '#1f2937',
    wordBreak: 'break-word',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  detail: {
    fontSize: '12px',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  statusContainer: {
    marginTop: '8px',
  },
  status: {
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  statusCompleted: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  statusFailed: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  preview: {
    marginTop: '8px',
    padding: '8px',
    backgroundColor: '#f9fafb',
    borderRadius: '4px',
    border: '1px solid #e5e7eb',
  },
  previewText: {
    margin: 0,
    fontSize: '12px',
    color: '#4b5563',
    fontStyle: 'italic',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6b7280',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  emptyTitle: {
    margin: '0 0 8px 0',
    fontSize: '20px',
    fontWeight: '600',
    color: '#374151',
  },
  emptySubtitle: {
    margin: 0,
    fontSize: '16px',
  },
};

export default DocumentList;