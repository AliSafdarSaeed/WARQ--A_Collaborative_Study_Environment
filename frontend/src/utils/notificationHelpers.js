import { toast } from 'react-hot-toast';

// Store for tracking shown notifications
const notificationStore = {
  userJoined: new Set(),
  userTyping: new Map(), // Map of userId -> timeout
  userEditing: new Map(), // Map of userId -> timeout
};

// Debounce time for typing/editing notifications (in milliseconds)
const TYPING_DEBOUNCE = 3000;
const EDITING_DEBOUNCE = 5000;

export const showUserJoinedNotification = (userId, userName) => {
  if (!notificationStore.userJoined.has(userId)) {
    toast.success(`${userName} joined the note`, {
      duration: 3000,
      position: 'bottom-right',
    });
    notificationStore.userJoined.add(userId);
  }
};

export const showUserTypingNotification = (userId, userName) => {
  // Clear existing timeout if any
  if (notificationStore.userTyping.has(userId)) {
    clearTimeout(notificationStore.userTyping.get(userId).timeoutId);
    // If the same user is already shown as typing, don't show again
    if (notificationStore.userTyping.get(userId).toastId) {
      return;
    }
  }

  // Show new typing notification
  const toastId = toast(`${userName} is typing...`, {
    duration: TYPING_DEBOUNCE,
    position: 'bottom-right',
    icon: '✍️',
  });

  // Set timeout to clear the notification
  const timeoutId = setTimeout(() => {
    toast.dismiss(toastId);
    notificationStore.userTyping.delete(userId);
  }, TYPING_DEBOUNCE);

  // Store the notification info
  notificationStore.userTyping.set(userId, { timeoutId, toastId });
};

export const showUserEditingNotification = (userId, userName) => {
  // Clear existing timeout if any
  if (notificationStore.userEditing.has(userId)) {
    clearTimeout(notificationStore.userEditing.get(userId).timeoutId);
    // If the same user is already shown as editing, don't show again
    if (notificationStore.userEditing.get(userId).toastId) {
      return;
    }
  }

  // Show new editing notification
  const toastId = toast(`${userName} is editing the note...`, {
    duration: EDITING_DEBOUNCE,
    position: 'bottom-right',
    icon: '📝',
  });

  // Set timeout to clear the notification
  const timeoutId = setTimeout(() => {
    toast.dismiss(toastId);
    notificationStore.userEditing.delete(userId);
  }, EDITING_DEBOUNCE);

  // Store the notification info
  notificationStore.userEditing.set(userId, { timeoutId, toastId });
};

export const clearUserNotifications = (userId) => {
  // Clear typing notification
  if (notificationStore.userTyping.has(userId)) {
    clearTimeout(notificationStore.userTyping.get(userId).timeoutId);
    toast.dismiss(notificationStore.userTyping.get(userId).toastId);
    notificationStore.userTyping.delete(userId);
  }

  // Clear editing notification
  if (notificationStore.userEditing.has(userId)) {
    clearTimeout(notificationStore.userEditing.get(userId).timeoutId);
    toast.dismiss(notificationStore.userEditing.get(userId).toastId);
    notificationStore.userEditing.delete(userId);
  }
};

// Clear all notifications when user leaves
export const clearAllNotifications = () => {
  notificationStore.userJoined.clear();
  notificationStore.userTyping.forEach(({ timeoutId, toastId }) => {
    clearTimeout(timeoutId);
    toast.dismiss(toastId);
  });
  notificationStore.userTyping.clear();
  notificationStore.userEditing.forEach(({ timeoutId, toastId }) => {
    clearTimeout(timeoutId);
    toast.dismiss(toastId);
  });
  notificationStore.userEditing.clear();
}; 