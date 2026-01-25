/**
 * Centralized error handling utilities
 */

export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred";
}

export function logError(context: string, error: unknown) {
  console.error(`[${context}]`, error);
}

export function formatErrorForUser(error: unknown): string {
  const message = handleApiError(error);
  
  // User-friendly error messages
  if (message.includes("Bucket not found")) {
    return "Storage bucket not configured. Please contact administrator.";
  }
  if (message.includes("Unauthorized") || message.includes("401")) {
    return "You are not authorized to perform this action.";
  }
  if (message.includes("Forbidden") || message.includes("403")) {
    return "Access denied. You don't have permission for this action.";
  }
  if (message.includes("Network")) {
    return "Network error. Please check your connection and try again.";
  }
  
  return message;
}
