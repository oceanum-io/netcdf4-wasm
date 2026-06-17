// Lazy file reading - Emscripten virtual-filesystem glue
//
// Mounts a LazyReader as a read-only file in Emscripten's in-memory filesystem by
// overriding the node's `stream_ops`. When NetCDF/HDF5 open that path and issue
// reads, libc forwards them to `stream_ops.read`, which pulls only the requested
// range from the reader instead of materialising the whole file. This is the same
// technique Emscripten's own `FS.createLazyFile` and h5wasm's lazy loaders use,
// but with ranged reads (not byte-at-a-time) so it stays fast over a block cache.
//
// Requires the module to be built with the filesystem and `FS` runtime export
// available (`-sFORCE_FILESYSTEM=1` plus `FS` in EXPORTED_RUNTIME_METHODS).

import type { LazyReader } from "./types";

// Minimal shapes of the Emscripten objects we touch. Kept structural so this file
// has no build-time dependency on the generated module.
interface EmscriptenStream {
  position: number;
  node: unknown;
}

export interface LazyStreamOps {
  read(
    stream: EmscriptenStream,
    buffer: Uint8Array,
    offset: number,
    length: number,
    position: number,
  ): number;
  write(): number;
  llseek(stream: EmscriptenStream, offset: number, whence: number): number;
}

interface EmscriptenFS {
  mkdirTree?(path: string): void;
  mkdir(path: string): void;
  createFile(
    parent: string,
    name: string,
    properties: Record<string, unknown>,
    canRead: boolean,
    canWrite: boolean,
  ): any;
}

// whence values from <stdio.h>
const SEEK_CUR = 1;
const SEEK_END = 2;

/**
 * Build the read-only `stream_ops` that bridge Emscripten reads to a LazyReader.
 * Pure and self-contained so it can be unit-tested without a real WASM module.
 */
export function createLazyStreamOps(reader: LazyReader): LazyStreamOps {
  return {
    read(_stream, buffer, offset, length, position) {
      if (position >= reader.size || length <= 0) return 0;
      const bytes = reader.read(position, length);
      // Defensively cap at `length`: libc only allotted `length` bytes at
      // `offset`, so never write past it even if a reader violates its contract
      // and returns more (that would corrupt adjacent WASM heap memory).
      const n = Math.min(bytes.length, length);
      buffer.set(n === bytes.length ? bytes : bytes.subarray(0, n), offset);
      return n;
    },
    write() {
      throw new Error("Lazy NetCDF file is read-only");
    },
    llseek(stream, offset, whence) {
      let position = offset;
      if (whence === SEEK_CUR) position += stream.position;
      else if (whence === SEEK_END) position += reader.size;
      if (position < 0) throw new Error(`Invalid seek to ${position}`);
      return position;
    },
  };
}

/**
 * Create a lazily-read file at `path` in the Emscripten filesystem, backed by
 * `reader`. Returns the created FS node.
 */
export function mountLazyFile(
  FS: EmscriptenFS,
  path: string,
  reader: LazyReader,
): unknown {
  const slash = path.lastIndexOf("/");
  const dir = slash > 0 ? path.slice(0, slash) : "/";
  const name = path.slice(slash + 1);

  if (dir && dir !== "/") {
    try {
      if (FS.mkdirTree) FS.mkdirTree(dir);
      else FS.mkdir(dir);
    } catch {
      // Directory already exists - ignore.
    }
  }

  const node = FS.createFile(
    dir,
    name,
    {},
    /*canRead*/ true,
    /*canWrite*/ false,
  );
  // Report the real size so stat/seek-to-end work without loading the file.
  Object.defineProperty(node, "usedBytes", { get: () => reader.size });
  node.stream_ops = createLazyStreamOps(reader);
  return node;
}
