import React, { useState, useRef } from 'react';
import './DocumentUploader.css';

const DocumentUploader = ({ onUploadSuccess, onUploadError }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (file) => {
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
      onUploadError && onUploadError('Please select a CSV file only');
      return;
    }

    uploadFile(file);
  };

  const uploadFile = async (file) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      setUploadedFile({
        name: file.name,
        size: file.size,
        tableName: result.table_name,
        rowsProcessed: result.rows_processed,
        columns: result.columns,
        schema: result.schema
      });

      onUploadSuccess && onUploadSuccess(result);
      
      setTimeout(() => {
        setUploadProgress(0);
        setIsUploading(false);
      }, 1000);

    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      setUploadProgress(0);
      onUploadError && onUploadError(error.message);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="document-uploader">
      <div className="uploader-header">
        <h3>📊 Upload CSV Data</h3>
        <p>Upload your CSV file to start querying with natural language</p>
      </div>

      <div 
        className={`upload-zone ${dragOver ? 'drag-over' : ''} ${isUploading ? 'uploading' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={triggerFileInput}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={(e) => handleFileSelect(e.target.files[0])}
        />
        
        {isUploading ? (
          <div className="upload-progress">
            <div className="upload-spinner"></div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p>Uploading and processing... {uploadProgress}%</p>
          </div>
        ) : uploadedFile ? (
          <div className="upload-success">
            <div className="success-icon">✅</div>
            <h4>File Uploaded Successfully!</h4>
            <div className="file-details">
              <p><strong>File:</strong> {uploadedFile.name}</p>
              <p><strong>Size:</strong> {formatFileSize(uploadedFile.size)}</p>
              <p><strong>Table:</strong> {uploadedFile.tableName}</p>
              <p><strong>Rows:</strong> {uploadedFile.rowsProcessed?.toLocaleString()}</p>
              <p><strong>Columns:</strong> {uploadedFile.columns?.length}</p>
            </div>
            <div className="column-list">
              <strong>Available Columns:</strong>
              <div className="column-tags">
                {uploadedFile.columns?.map((col, index) => (
                  <span key={index} className="column-tag">{col}</span>
                ))}
              </div>
            </div>
            <button className="upload-new-btn" onClick={triggerFileInput}>
              Upload New File
            </button>
          </div>
        ) : (
          <div className="upload-prompt">
            <div className="upload-icon">📁</div>
            <h4>Drop your CSV file here</h4>
            <p>or <span className="upload-link">click to browse</span></p>
            <div className="upload-hints">
              <p>• Supports any CSV structure</p>
              <p>• Automatic data type detection</p>
              <p>• Dynamic schema adaptation</p>
            </div>
          </div>
        )}
      </div>

      {uploadedFile && (
        <div className="schema-preview">
          <h4>📋 Data Schema Preview</h4>
          <div className="schema-table">
            <div className="schema-header">
              <span>Column</span>
              <span>Type</span>
              <span>Sample Values</span>
            </div>
            {Object.entries(uploadedFile.schema || {}).map(([column, info]) => (
              <div key={column} className="schema-row">
                <span className="column-name">{column}</span>
                <span className="column-type">{info.type}</span>
                <span className="sample-values">
                  {info.sample_values?.slice(0, 2).join(', ')}
                  {info.sample_values?.length > 2 ? '...' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;