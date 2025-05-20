import React from 'react';
import { FiEye, FiDownload, FiTrash2 } from 'react-icons/fi';
import { supabase } from '../services/supabase';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const FileCard = ({ file, noteId, onDelete, userRole, isCollab, compact }) => {
  const canDelete = !isCollab || ['admin', 'editor'].includes(userRole);

  const handleView = async () => {
    try {
      // First check if file exists
      const { data: checkData, error: checkError } = await supabase.storage
        .from('uploads')
        .list(file.file_path.split('/').slice(0, -1).join('/'));

      if (checkError) throw checkError;

      const fileName = file.file_path.split('/').pop();
      const fileExists = checkData.some(f => f.name === fileName);

      if (!fileExists) {
        throw new Error('File not found in storage');
      }

      // Get a signed URL that expires in 1 hour
      const { data: { signedUrl }, error: signedError } = await supabase.storage
        .from('uploads')
        .createSignedUrl(file.file_path, 3600); // 3600 seconds = 1 hour

      if (signedError) throw signedError;

      // Define viewable file types
      const viewableTypes = [
        'image/',
        'application/pdf',
        'text/',
        'application/json',
        'video/',
        'audio/',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      // Check if the file type is viewable
      const isViewable = viewableTypes.some(type => file.file_type?.startsWith(type));

      if (isViewable) {
        // For viewable files, open in new tab
        window.open(signedUrl, '_blank');
      } else {
        // For non-viewable files, trigger download
        const response = await fetch(signedUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error getting file URL:', err);
      toast.error('Failed to open file: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDownload = async () => {
    try {
      // First check if file exists
      const { data: checkData, error: checkError } = await supabase.storage
        .from('uploads')
        .list(file.file_path.split('/').slice(0, -1).join('/'));

      if (checkError) throw checkError;

      const fileName = file.file_path.split('/').pop();
      const fileExists = checkData.some(f => f.name === fileName);

      if (!fileExists) {
        throw new Error('File not found in storage');
      }

      const { data, error } = await supabase.storage
        .from('uploads')
        .download(file.file_path);

      if (error) throw error;

      // Create a download link
      const url = URL.createObjectURL(data);
    const link = document.createElement('a');
      link.href = url;
      link.download = file.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
      toast.error('Failed to download file: ' + (err.message || 'Unknown error'));
    }
  };

  // Update handleDelete to add a more styled confirmation dialog
  const handleDelete = async () => {
    // Use a custom styled dialog instead of basic confirm
    if (!window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('uploads')
        .remove([file.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('file_path', file.file_path);

      if (dbError) throw dbError;

      toast.success('File deleted successfully');
      onDelete(); // Refresh files list
    } catch (err) {
      console.error('Error deleting file:', err);
      toast.error('Failed to delete file: ' + (err.message || 'Unknown error'));
    }
  };

  const getFileIcon = () => {
    const type = file.file_type || file.type;
    if (type?.startsWith('image/')) return '🖼️';
    if (type?.startsWith('video/')) return '🎥';
    if (type?.startsWith('audio/')) return '🎵';
    if (type?.includes('pdf')) return '📄';
    if (type?.includes('document') || type?.includes('sheet')) return '📝';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className={`file-card${compact ? ' compact' : ''}`}>
      <div className="file-icon">{getFileIcon()}</div>
      <div className="file-info">
        <div className="file-name" title={file.file_name}>
          {file.file_name}
        </div>
        <div className="file-meta">
          <span className="file-size">{formatFileSize(file.file_size)}</span>
          <span className="file-type">{file.file_type}</span>
        </div>
      </div>
      <div className="file-actions">
        <button onClick={handleView} className="file-action-btn view" title="View">
          <FiEye size={compact ? 16 : 20} />
      </button>
        <button onClick={handleDownload} className="file-action-btn download" title="Download">
          <FiDownload size={compact ? 16 : 20} />
      </button>
      {canDelete && (
          <button onClick={handleDelete} className="file-action-btn delete" title="Delete">
            <X size={compact ? 14 : 16} />
        </button>
      )}
      </div>

      <style>{`
        .file-card {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--background-lighter);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 10px 16px;
          transition: all 0.2s ease;
          max-width: 320px;
        }
        .file-card.compact {
          background: #47e58422;
          border: 1.5px solid #47e584;
          padding: 6px 10px;
          max-width: 180px;
          min-width: 0;
          font-size: 12px;
          box-shadow: 0 2px 8px rgba(71,229,132,0.10);
        }
        .file-card.compact .file-icon {
          font-size: 18px;
          min-width: 20px;
        }
        .file-card.compact .file-name {
          font-size: 12px;
        }
        .file-card.compact .file-meta {
          font-size: 10px;
        }
        .file-card.compact .file-action-btn {
          padding: 3px;
        }
        .file-card:hover {
          background: var(--background-dark);
          border-color: var(--primary-color);
          transform: translateY(-1px);
        }
        .file-icon {
          font-size: 24px;
          min-width: 32px;
          text-align: center;
        }
        .file-info {
          flex: 1;
          min-width: 0;
        }
        .file-name {
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .file-meta {
          display: flex;
          gap: 8px;
          font-size: 12px;
          color: var(--text-secondary);
        }
        .file-actions {
          display: flex;
          gap: 4px;
        }
        .file-action-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          padding: 6px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .file-action-btn:hover {
          background: var(--background-dark);
          color: var(--primary-color);
        }
        .file-action-btn.delete:hover {
          color: var(--danger-color);
        }
        .file-size, .file-type {
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
};

export default FileCard;