// src/utils/timezone.js
/**
 * Utility functions for consistent timezone handling in IST (Asia/Kolkata)
 */

/**
 * Get current date in IST timezone in YYYY-MM-DD format
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function getCurrentDateInIST() {
  const now = new Date();
  // Create a new date object with IST timezone offset (+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toISOString().slice(0, 10);
}

/**
 * Format a date/time string to IST display format
 * @param {string|Date} dateString - Date string or Date object (UTC timestamp)
 * @returns {string} Formatted time string in IST
 */
export function formatTimeInIST(dateString) {
  const date = new Date(dateString);
  // Convert UTC timestamp to IST for display
  const options = {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  };
  return date.toLocaleTimeString('en-IN', options);
}

/**
 * Format a date string to IST display format
 * @param {string|Date} dateString - Date string or Date object (UTC timestamp)
 * @returns {string} Formatted date string in IST
 */
export function formatDateInIST(dateString) {
  const date = new Date(dateString);
  // Convert UTC timestamp to IST for display
  const options = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  return date.toLocaleDateString('en-IN', options);
}

/**
 * Format a date/time string to IST display format (date and time)
 * @param {string|Date} dateString - Date string or Date object (UTC timestamp)
 * @returns {string} Formatted date-time string in IST
 */
export function formatDateTimeInIST(dateString) {
  const date = new Date(dateString);
  // Convert UTC timestamp to IST for display
  const options = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  return date.toLocaleDateString('en-IN', options);
}