// Lazy file reading - public surface
//
// These primitives let NetCDF read a file without loading it entirely into
// memory. See the individual modules for details; the high-level entry point is
// `Dataset(source, 'r', { lazy: true })` in the main API.

export type { LazyReader, ReadStats, LazyOptions } from "./types";
export { CachedReader } from "./block-cache";
export { MemoryReader } from "./memory-reader";
export { NodeFileReader } from "./node-reader";
export type { NodeFsLike } from "./node-reader";
export { BlobReader } from "./blob-reader";
export { createLazyStreamOps, mountLazyFile } from "./emscripten-fs";
export type { LazyStreamOps } from "./emscripten-fs";
export { createLazyReader } from "./factory";
export type { LazySource } from "./factory";
