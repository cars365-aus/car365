import type { CanonicalVehicle, Rejection, Warning } from "../types";

export type TransformResult = 
  | { type: "success"; payload: Record<string, string>; warnings: Warning[] }
  | { type: "rejected"; rejections: Rejection[]; warnings: Warning[] };

export interface ChannelAdapter {
  code: string;
  name: string;
  
  /**
   * PURE transform function. No I/O, no clock, no randomness.
   * Takes a vehicle (and optional context like mapped enums) and returns
   * either the flattened key-value payload for this channel or a list of rejections.
   */
  transform(v: CanonicalVehicle, opts?: Record<string, unknown>): TransformResult;
}
