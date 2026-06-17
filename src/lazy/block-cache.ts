// Lazy file reading - block-aligned LRU cache
//
// NetCDF (classic posixio) and HDF5 (sec2 driver) issue many small, often
// repeated reads: superblocks, b-tree nodes, headers, record offsets. Hitting the
// underlying reader for every one of those would mean thousands of tiny round
// trips (especially painful for remote/HTTP-range sources). CachedReader sits in
// front of any LazyReader and serves reads from fixed-size, block-aligned chunks
// kept in an LRU, so repeated and overlapping reads coalesce.

import type { LazyReader, ReadStats } from "./types";

const DEFAULT_BLOCK_SIZE = 64 * 1024;
const DEFAULT_MAX_BLOCKS = 256;

export class CachedReader implements LazyReader {
  // Map iteration order is insertion order, which we use to find the LRU entry:
  // the oldest key is the least-recently-used. A cache hit re-inserts the block
  // to move it to the most-recently-used end.
  private readonly cache = new Map<number, Uint8Array>();
  private readonly blockSize: number;
  private readonly maxBlocks: number;
  private _hits = 0;
  private _misses = 0;
  private _bytesFetched = 0;

  constructor(
    private readonly inner: LazyReader,
    blockSize: number = DEFAULT_BLOCK_SIZE,
    maxBlocks: number = DEFAULT_MAX_BLOCKS,
  ) {
    if (!Number.isInteger(blockSize) || blockSize <= 0) {
      throw new RangeError(
        `blockSize must be a positive integer, got ${blockSize}`,
      );
    }
    if (!Number.isInteger(maxBlocks) || maxBlocks <= 0) {
      throw new RangeError(
        `maxBlocks must be a positive integer, got ${maxBlocks}`,
      );
    }
    this.blockSize = blockSize;
    this.maxBlocks = maxBlocks;
  }

  get size(): number {
    return this.inner.size;
  }

  read(offset: number, length: number): Uint8Array {
    if (offset < 0 || length < 0) {
      throw new RangeError(`Invalid read(offset=${offset}, length=${length})`);
    }
    const end = Math.min(offset + length, this.size);
    if (offset >= this.size || end <= offset) {
      return new Uint8Array(0);
    }

    const out = new Uint8Array(end - offset);
    const firstBlock = Math.floor(offset / this.blockSize);
    const lastBlock = Math.floor((end - 1) / this.blockSize);

    for (let b = firstBlock; b <= lastBlock; b++) {
      const block = this.getBlock(b);
      const blockStart = b * this.blockSize;
      const copyStart = Math.max(offset, blockStart);
      const copyEnd = Math.min(end, blockStart + block.length);
      if (copyEnd <= copyStart) continue;
      out.set(
        block.subarray(copyStart - blockStart, copyEnd - blockStart),
        copyStart - offset,
      );
    }
    return out;
  }

  private getBlock(index: number): Uint8Array {
    const cached = this.cache.get(index);
    if (cached !== undefined) {
      this._hits++;
      // Refresh LRU position.
      this.cache.delete(index);
      this.cache.set(index, cached);
      return cached;
    }

    this._misses++;
    const blockStart = index * this.blockSize;
    const blockLen = Math.min(this.blockSize, this.size - blockStart);
    const bytes = this.inner.read(blockStart, blockLen);
    this._bytesFetched += bytes.length;

    this.cache.set(index, bytes);
    if (this.cache.size > this.maxBlocks) {
      const lru = this.cache.keys().next().value;
      if (lru !== undefined) this.cache.delete(lru);
    }
    return bytes;
  }

  get stats(): ReadStats {
    return {
      hits: this._hits,
      misses: this._misses,
      bytesFetched: this._bytesFetched,
      cachedBlocks: this.cache.size,
    };
  }

  close(): void {
    this.cache.clear();
    this.inner.close();
  }
}
