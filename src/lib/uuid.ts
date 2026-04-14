/**
 * Generate a UUID v4
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Generate MongoDB ObjectId (12-byte hex string)
 * Format: timestamp(4) + machineId(3) + processId(2) + counter(3)
 */
export const generateObjectId = (): string => {
  // Timestamp (4 bytes)
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  
  // Machine ID (3 bytes) - using random values
  const machineId = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
  
  // Process ID (2 bytes) - using random values
  const processId = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  
  // Counter (3 bytes) - using random values
  const counter = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
  
  return timestamp + machineId + processId + counter;
};

/**
 * Generate conversation ID for new chat (MongoDB ObjectId format)
 */
export const generateConversationId = (): string => {
  return generateObjectId();
};