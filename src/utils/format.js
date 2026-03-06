/**
 * Utility functions for formatting
 */

/**
 * Format duration from created_at to updated_at
 */
export const formatDuration = (createdAt, updatedAt, status) => {
  if (!createdAt) return '-';
  
  const start = new Date(createdAt);
  const isFinished = ['completed', 'completed_with_errors', 'failed', 'stopped'].includes(status);
  
  let end;
  if (isFinished) {
    if (!updatedAt) return '-';
    end = new Date(updatedAt);
  } else {
    end = updatedAt ? new Date(updatedAt) : new Date();
  }
  
  const diffMs = end - start;
  if (diffMs < 0) return '-';
  
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours >= 2) return '5m';
  
  if (hours > 0) {
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  } else if (minutes > 0) {
    const remainingSecs = seconds % 60;
    return `${minutes}m ${remainingSecs}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Format timestamp for display
 */
export const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Escape HTML
 */
export const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
};

/**
 * Capitalize first letter
 */
export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Get priority class name
 */
export const getPriorityClass = (priority) => {
  switch (priority) {
    case 'P1': return 'priority-high';
    case 'P2': return 'priority-med';
    case 'P3': return 'priority-low';
    default: return 'priority-low';
  }
};

/**
 * Get status class name
 */
export const getStatusClass = (status) => {
  switch (status) {
    case 'created':
    case 'ready': return 'ready';
    case 'draft': return 'draft';
    case 'review': return 'review';
    default: return 'draft';
  }
};
