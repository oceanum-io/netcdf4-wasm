// Lazy file reading - browser Blob/File backend
//
// Reads byte ranges out of a Blob/File with FileReaderSync. Because the read must
// be synchronous (libc read() is), this only works inside a Web Worker, where
// FileReaderSync exists. On the main thread there is no synchronous way to read a
// Blob, so construction throws with a clear message.

import type { LazyReader } from "./types";

// FileReaderSync is only declared in the WebWorker lib; reference it structurally
// so this file type-checks under the default DOM/Node libs.
interface FileReaderSyncLike {
  readAsArrayBuffer(blob: Blob): ArrayBuffer;
}
type FileReaderSyncCtor = new () => FileReaderSyncLike;

function getFileReaderSync(): FileReaderSyncCtor | undefined {
  return (globalThis as any).FileReaderSync as FileReaderSyncCtor | undefined;
}

export class BlobReader implements LazyReader {
  private readonly readerCtor: FileReaderSyncCtor;

  constructor(private readonly blob: Blob) {
    const ctor = getFileReaderSync();
    if (!ctor) {
      throw new Error(
        "BlobReader requires FileReaderSync, which is only available inside a Web Worker. " +
          "Run lazy Blob reading in a worker, or load the file with the default (eager) path.",
      );
    }
    this.readerCtor = ctor;
  }

  get size(): number {
    return this.blob.size;
  }

  read(offset: number, length: number): Uint8Array {
    const end = Math.min(offset + length, this.blob.size);
    if (offset < 0 || offset >= this.blob.size || end <= offset) {
      return new Uint8Array(0);
    }
    const slice = this.blob.slice(offset, end);
    const buffer = new this.readerCtor().readAsArrayBuffer(slice);
    return new Uint8Array(buffer);
  }

  close(): void {
    // Nothing to release.
  }
}
