/**
 * Property-Based Testing Configuration
 * Feature: elite-ui-overhaul
 *
 * Shared configuration for all property tests in this feature.
 * Uses fast-check with Vitest integration.
 */

import type { Parameters } from "fast-check";

/**
 * Default fast-check parameters ensuring a minimum of 100 iterations
 * per property test, as specified in the design document.
 */
export const PBT_CONFIG: Parameters<unknown> = {
  numRuns: 100,
  verbose: false,
};
