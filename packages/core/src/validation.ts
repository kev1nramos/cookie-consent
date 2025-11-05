/**
 * Validation schemas using Zod for runtime type checking
 * Protects against prototype pollution and injection attacks
 */

import { z } from 'zod';

// Maximum values for security constraints
const MAX_TIMESTAMP = 8640000000000000; // JavaScript max date
const MIN_TIMESTAMP = 0;
const MAX_CUSTOM_CATEGORIES = 50;
const MAX_CATEGORY_NAME_LENGTH = 100;
const VALID_CATEGORY_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;
const MAX_STORAGE_KEY_LENGTH = 256;
const VALID_STORAGE_KEY_REGEX = /^[a-zA-Z0-9_-]+$/;

/**
 * Schema for validating consent state from storage
 * Prevents prototype pollution by validating all fields
 */
export const ConsentStateSchema = z.object({
  version: z.number().int().min(1).max(1000),
  essential: z.literal(true), // Essential must always be true
  analytics: z.boolean(),
  marketing: z.boolean(),
  timestamp: z.number().int().min(MIN_TIMESTAMP).max(MAX_TIMESTAMP),
  expiresAt: z.number().int().min(MIN_TIMESTAMP).max(MAX_TIMESTAMP),
}).catchall(z.boolean()); // Custom categories must be boolean

/**
 * Validate and sanitize consent state from untrusted storage
 * Creates a clean object without prototype pollution risk
 */
export function validateConsentState(
  data: unknown,
  customCategories: string[] = []
): { success: true; data: any } | { success: false; error: string } {
  try {
    // First, ensure it's an object
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return { success: false, error: 'Data must be an object' };
    }

    // Parse with Zod schema
    const parsed = ConsentStateSchema.parse(data);

    // Create a clean object without prototype
    const clean = Object.create(null);

    // Only copy validated required fields
    clean.version = parsed.version;
    clean.essential = parsed.essential;
    clean.analytics = parsed.analytics;
    clean.marketing = parsed.marketing;
    clean.timestamp = parsed.timestamp;
    clean.expiresAt = parsed.expiresAt;

    // Only copy expected custom categories (prevent unexpected properties)
    for (const category of customCategories) {
      if (category in parsed && typeof (parsed as any)[category] === 'boolean') {
        clean[category] = (parsed as any)[category];
      }
    }

    // Validate timestamp logic
    if (clean.expiresAt <= clean.timestamp) {
      return { success: false, error: 'expiresAt must be after timestamp' };
    }

    // Validate timestamps are reasonable (not negative, not too far in future)
    const now = Date.now();
    const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
    const tenYearsFromNow = now + (10 * 365 * 24 * 60 * 60 * 1000);

    if (clean.timestamp < oneYearAgo) {
      return { success: false, error: 'timestamp is too old' };
    }

    if (clean.expiresAt > tenYearsFromNow) {
      return { success: false, error: 'expiresAt is too far in the future' };
    }

    return { success: true, data: clean };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: `Validation failed: ${error.issues[0].message}` };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}

/**
 * Validate custom category names
 * Prevents injection attacks and ensures safe storage keys
 */
export function validateCustomCategories(
  categories: unknown
): { success: true; data: string[] } | { success: false; error: string } {
  if (!Array.isArray(categories)) {
    return { success: false, error: 'Custom categories must be an array' };
  }

  if (categories.length > MAX_CUSTOM_CATEGORIES) {
    return {
      success: false,
      error: `Too many custom categories (max ${MAX_CUSTOM_CATEGORIES})`
    };
  }

  const validated: string[] = [];
  const seen = new Set<string>();

  for (const category of categories) {
    // Must be a string
    if (typeof category !== 'string') {
      return { success: false, error: 'Category names must be strings' };
    }

    // Check length
    if (category.length === 0 || category.length > MAX_CATEGORY_NAME_LENGTH) {
      return {
        success: false,
        error: `Category name length must be 1-${MAX_CATEGORY_NAME_LENGTH} characters`
      };
    }

    // Check for valid characters (alphanumeric, underscore, hyphen)
    if (!VALID_CATEGORY_NAME_REGEX.test(category)) {
      return {
        success: false,
        error: `Category name "${category}" contains invalid characters. Only a-z, A-Z, 0-9, _, - allowed`
      };
    }

    // Check for duplicates
    if (seen.has(category)) {
      return { success: false, error: `Duplicate category: "${category}"` };
    }

    // Reserved names (prevent overriding built-in properties)
    const reserved = ['version', 'essential', 'analytics', 'marketing', 'timestamp', 'expiresAt', '__proto__', 'constructor', 'prototype'];
    if (reserved.includes(category.toLowerCase())) {
      return {
        success: false,
        error: `Category name "${category}" is reserved`
      };
    }

    seen.add(category);
    validated.push(category);
  }

  return { success: true, data: validated };
}

/**
 * Validate and sanitize storage key
 * Prevents cookie injection attacks
 */
export function validateStorageKey(
  key: unknown
): { success: true; data: string } | { success: false; error: string } {
  if (typeof key !== 'string') {
    return { success: false, error: 'Storage key must be a string' };
  }

  if (key.length === 0 || key.length > MAX_STORAGE_KEY_LENGTH) {
    return {
      success: false,
      error: `Storage key length must be 1-${MAX_STORAGE_KEY_LENGTH} characters`
    };
  }

  // Only allow safe characters (prevent cookie injection)
  if (!VALID_STORAGE_KEY_REGEX.test(key)) {
    return {
      success: false,
      error: 'Storage key contains invalid characters. Only a-z, A-Z, 0-9, _, - allowed'
    };
  }

  return { success: true, data: key };
}

/**
 * Validate consent duration
 */
export function validateDuration(
  duration: unknown
): { success: true; data: number } | { success: false; error: string } {
  if (typeof duration !== 'number') {
    return { success: false, error: 'Duration must be a number' };
  }

  if (duration < 1 || duration > 3650) { // 1 day to 10 years
    return { success: false, error: 'Duration must be between 1 and 3650 days' };
  }

  if (!Number.isInteger(duration)) {
    return { success: false, error: 'Duration must be an integer' };
  }

  return { success: true, data: duration };
}

/**
 * Validate consent version
 */
export function validateVersion(
  version: unknown
): { success: true; data: number } | { success: false; error: string } {
  if (typeof version !== 'number') {
    return { success: false, error: 'Version must be a number' };
  }

  if (version < 1 || version > 1000) {
    return { success: false, error: 'Version must be between 1 and 1000' };
  }

  if (!Number.isInteger(version)) {
    return { success: false, error: 'Version must be an integer' };
  }

  return { success: true, data: version };
}
