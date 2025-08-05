// /utils/formatDate.ts

/**
 * Safely formats a timestamp string into a locale-specific time string (e.g., "10:30 PM").
 * It handles invalid or missing timestamps gracefully.
 * @param timestamp - The date string from the server.
 * @returns A formatted time string or an empty string if the timestamp is invalid.
 */
export const formatTimestamp = (timestamp: string | undefined | null): string => {
  // Return early if the timestamp is null, undefined, or an empty string
  if (!timestamp) {
    return "";
  }

  const date = new Date(timestamp);

  // Check if the created date object is valid.
  // isNaN(date.getTime()) is the most reliable way to check for an "Invalid Date".
  if (isNaN(date.getTime())) {
    console.warn("Received an invalid timestamp:", timestamp);
    return "";
  }

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};