// Lazy file reading - core types
//
// A LazyReader exposes a file as a size plus a synchronous range-read. It is the
// abstraction NetCDF/HDF5 ultimately need: their C code issues seek+read syscalls
// that, in WebAssembly, dispatch to an Emscripten virtual-filesystem `read` op.
// By backing that op with a LazyReader we only ever pull the bytes actually
// requested instead of loading the whole file into memory.
//
// `read` MUST be synchronous because libc `read()` is synchronous. In the browser
// that means a LazyReader can only do real I/O inside a Web Worker (where
// FileReaderSync / synchronous XHR are available); in Node `fs.readSync` is
// synchronous everywhere.

export interface LazyReader {
  /** Total size of the underlying file in bytes. */
  readonly size: number;

  /**
   * Read `length` bytes starting at `offset`. Reads are clamped to the file
   * bounds: a read at or past EOF returns an empty array, and a read that
   * straddles EOF returns only the available bytes. Never throws on a short
   * read.
   */
  read(offset: number, length: number): Uint8Array;

  /** Release any underlying handle (file descriptor, etc.). */
  close(): void;
}

export interface ReadStats {
  /** Block reads served from cache. */
  hits: number;
  /** Block reads that hit the underlying reader. */
  misses: number;
  /** Bytes actually fetched from the underlying reader. */
  bytesFetched: number;
  /** Blocks currently held in the cache. */
  cachedBlocks: number;
}

export interface LazyOptions {
  /** Size of each cached block in bytes (default 64 KiB). */
  blockSize?: number;
  /** Maximum number of blocks held in the LRU cache (default 256). */
  maxCacheBlocks?: number;
}
