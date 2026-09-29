import { createContext, useContext } from "react";

/**
 * V160-D: what the detail frame found after the rank-1 chart|map row - the
 * analysis blocks ranked 2 and below and the notes between them. That part
 * reads as layer 2: folded until the reader opens it (or layer 2 is open).
 */
export interface DetailFoldV160 {
  /** Tagged analysis blocks after rank 1. */
  restBlocks: number;
  /** Any content after the rank-1 row (blocks or notes). */
  hasRest: boolean;
}

export const DetailFoldContextV160 = createContext<DetailFoldV160>({ restBlocks: 0, hasRest: false });

export function useDetailFoldV160(): DetailFoldV160 {
  return useContext(DetailFoldContextV160);
}
