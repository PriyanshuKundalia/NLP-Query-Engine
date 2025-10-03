import React, { useState } from 'react';

const DocumentUploader = ({ onUploadComplete, onUploadSuccess, onUploadError }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    setIsUploading(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok) {
        const uploadRecord = {
          id: Date.now(),
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          uploadDate: new Date().toISOString(),
          status: 'success',
          rowsProcessed: result.rows_processed || 0,
          tableName: result.table_name || 'unknown',
          columns: result.columns || []
        };

        setUploadHistory([uploadRecord, ...uploadHistory]);
        setSelectedFile(null);
        
        if (onUploadComplete) {
          onUploadComplete(uploadRecord);
        }
        
        if (onUploadSuccess) {
          onUploadSuccess(uploadRecord);
        }

        // Show detailed success message
        const message = `✅ Successfully uploaded ${selectedFile.name}!\n` +
                       `📊 Rows processed: ${result.rows_processed}\n` +
                       `🗃️ Table created: ${result.table_name}\n` +
                       `📋 Columns: ${result.columns?.join(', ') || 'N/A'}`;
        alert(message);
        
        // Force page refresh to update all components with new CSV data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      // Upload error occurred
      const errorMessage = error.message;
      
      if (onUploadError) {
        onUploadError(errorMessage);
      }
      
      alert(`Upload failed: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="query-panel">
      <div className="panel-container">
        {/* Header Section */}
        <div className="panel-header">
          <div className="header-content">
            <h2 className="panel-title">
              <span className="title-icon">📁</span>
              File Upload Center
            </h2>
            <p className="panel-subtitle">
              Upload CSV, Excel, or JSON files to query with natural language
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <div className="upload-section">
          <div 
            className={`upload-dropzone ${dragOver ? 'drag-over' : ''} ${selectedFile ? 'has-file' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput').click()}
          >
            <div className="dropzone-content">
              {selectedFile ? (
                <div className="selected-file">
                  <div className="file-icon">📄</div>
                  <div className="file-details">
                    <div className="file-name">{selectedFile.name}</div>
                    <div className="file-size">{formatFileSize(selectedFile.size)}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                    className="remove-file-btn"
                    disabled={isUploading ? true : false}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="empty-dropzone">
                  <div className="upload-icon">☁️</div>
                  <h3 className="upload-title">Drop files here or click to browse</h3>
                  <p className="upload-subtitle">Supports CSV, Excel (.xlsx, .xls), and JSON files</p>
                </div>
              )}
            </div>
            
            <input
              type="file"
              id="fileInput"
              onChange={handleFileSelect}
              accept=".csv,.xlsx,.xls,.json"
              disabled={isUploading ? true : false}
              className="file-input-hidden"
            />
          </div>

          <div className="upload-actions">
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="upload-btn"
            >
              {isUploading ? (
                <>
                  <span className="btn-icon">⏳</span>
                  Uploading...
                </>
              ) : (
                <>
                  <span className="btn-icon">⬆️</span>
                  Upload File
                </>
              )}
            </button>
          </div>
        </div>

        {/* Supported Formats */}
        <div className="formats-section">
          <div className="section-header">
            <h3 className="section-title">
              <span className="section-icon">📋</span>
              Supported Formats
            </h3>
          </div>
          
          <div className="formats-grid">
            <div className="format-card">
              <span className="format-icon">📊</span>
              <div className="format-info">
                <h4>CSV Files</h4>
                <p>Comma-separated values with headers</p>
              </div>
            </div>
            
            <div className="format-card">
              <span className="format-icon">📈</span>
              <div className="format-info">
                <h4>Excel Files</h4>
                <p>XLSX and XLS spreadsheet files</p>
              </div>
            </div>
            
            <div className="format-card">
              <span className="format-icon">🔧</span>
              <div className="format-info">
                <h4>JSON Files</h4>
                <p>Structured data in JSON format</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload History */}
        {uploadHistory.length > 0 && (
          <div className="history-section">
            <div className="section-header">
              <h3 className="section-title">
                <span className="section-icon">📝</span>
                Upload History
              </h3>
              <button 
                onClick={() => setUploadHistory([])}
                className="clear-history-btn"
              >
                Clear History
              </button>
            </div>

            <div className="history-list">
              {uploadHistory.slice(0, 10).map((record) => (
                <div key={record.id} className={`history-item ${record.status}`}>
                  <div className="history-content">
                    <span className="history-icon">
                      {record.status === 'success' ? '✅' : '❌'}
                    </span>
                    <div className="history-details">
                      <span className="history-filename">{record.fileName}</span>
                      <span className="history-meta">
                        {formatFileSize(record.fileSize)} • {record.rowsProcessed || 0} rows
                        {record.tableName && ` • Table: ${record.tableName}`}
                      </span>
                    </div>
                    <span className="history-time">
                      {new Date(record.uploadDate).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUploader;