// Lazy file reading - in-memory backend
//
// Backs a LazyReader with an existing Uint8Array. This does not save memory (the
// whole buffer is already resident) but provides a uniform reader for callers who
// already hold the bytes, and is the reference backend the tests exercise the
// cache against.

import type { LazyReader } from "./types";

export class MemoryReader implements LazyReader {
  constructor(private readonly data: Uint8Array) {}

  get size(): number {
    return this.data.length;
  }

  read(offset: number, length: number): Uint8Array {
    const end = Math.min(offset + length, this.data.length);
    if (offset < 0 || offset >= this.data.length || end <= offset) {
      return new Uint8Array(0);
    }
    // A view is safe: the source bytes are treated as immutable.
    return this.data.subarray(offset, end);
  }

  close(): void {
    // Nothing to release.
  }
}
