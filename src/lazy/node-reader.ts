// Lazy file reading - Node.js backend
//
// Uses synchronous positional reads (`fs.readSync` with a position argument) so
// only the requested bytes are pulled off disk - the file is never slurped into
// memory. This is the simplest genuinely-lazy path and needs no Web Worker, since
// `readSync` is synchronous on every platform.

import type { LazyReader } from "./types";

/** Minimal subset of the Node `fs` module this reader depends on (injectable for testing). */
export interface NodeFsLike {
  openSync(path: string, flags: string): number;
  readSync(
    fd: number,
    buffer: Uint8Array,
    offset: number,
    length: number,
    position: number,
  ): number;
  fstatSync(fd: number): { size: number };
  closeSync(fd: number): void;
}

export class NodeFileReader implements LazyReader {
  private readonly fs: NodeFsLike;
  private readonly fd: number;
  private readonly _size: number;
  private closed = false;

  constructor(path: string, fsImpl?: NodeFsLike) {
    // Lazily require 'fs' only when no implementation is injected, so bundlers
    // building for the browser never need to resolve the Node builtin.
    this.fs = fsImpl ?? (require("fs") as NodeFsLike);
    this.fd = this.fs.openSync(path, "r");
    this._size = this.fs.fstatSync(this.fd).size;
  }

  get size(): number {
    return this._size;
  }

  read(offset: number, length: number): Uint8Array {
    if (this.closed) throw new Error("NodeFileReader is closed");
    const end = Math.min(offset + length, this._size);
    const want = end - offset;
    if (offset < 0 || offset >= this._size || want <= 0) {
      return new Uint8Array(0);
    }

    const buffer = new Uint8Array(want);
    let read = 0;
    // readSync may return short; loop until the range is filled or EOF.
    while (read < want) {
      const n = this.fs.readSync(
        this.fd,
        buffer,
        read,
        want - read,
        offset + read,
      );
      if (n <= 0) break;
      read += n;
    }
    return read === want ? buffer : buffer.subarray(0, read);
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.fs.closeSync(this.fd);
  }
}
