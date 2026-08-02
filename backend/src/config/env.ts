/**
 * Helper utility to retrieve required environment variables.
 * Throws an Error immediately at startup if the variable is missing or empty.
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value || !value.trim()) {
    throw new Error(`Environment variable ${key} is required but missing or empty`);
  }
  return value;
}
