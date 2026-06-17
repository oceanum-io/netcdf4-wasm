// Tests for the lazy file-reading primitives (no WASM required).

import {
  CachedReader,
  MemoryReader,
  NodeFileReader,
  createLazyReader,
  createLazyStreamOps,
  mountLazyFile,
} from "../lazy";
import type { LazyReader, NodeFsLike } from "../lazy";

// Deterministic byte source: data[i] === i % 256.
function makeData(size: number): Uint8Array {
  const data = new Uint8Array(size);
  for (let i = 0; i < size; i++) data[i] = i % 256;
  return data;
}

// Wraps a reader and records every read() so cache behaviour can be asserted.
class CountingReader implements LazyReader {
  public readonly reads: Array<{ offset: number; length: number }> = [];
  public closed = false;
  constructor(private readonly inner: LazyReader) {}
  get size(): number {
    return this.inner.size;
  }
  read(offset: number, length: number): Uint8Array {
    this.reads.push({ offset, length });
    return this.inner.read(offset, length);
  }
  close(): void {
    this.closed = true;
  }
}

describe("MemoryReader", () => {
  const data = makeData(1000);
  const reader = new MemoryReader(data);

  test("reports size", () => {
    expect(reader.size).toBe(1000);
  });

  test("reads an interior range", () => {
    expect(Array.from(reader.read(100, 4))).toEqual([100, 101, 102, 103]);
  });

  test("clamps a read that straddles EOF", () => {
    const out = reader.read(998, 10);
    expect(out.length).toBe(2);
    expect(Array.from(out)).toEqual([998 % 256, 999 % 256]);
  });

  test("returns empty at or past EOF", () => {
    expect(reader.read(1000, 5).length).toBe(0);
    expect(reader.read(2000, 5).length).toBe(0);
  });

  test("returns empty for zero/negative length", () => {
    expect(reader.read(10, 0).length).toBe(0);
    expect(reader.read(10, -5).length).toBe(0);
  });
});

describe("CachedReader", () => {
  const data = makeData(10000);

  test("validates constructor arguments", () => {
    const inner = new MemoryReader(data);
    expect(() => new CachedReader(inner, 0)).toThrow(RangeError);
    expect(() => new CachedReader(inner, -1)).toThrow(RangeError);
    expect(() => new CachedReader(inner, 1024, 0)).toThrow(RangeError);
    expect(() => new CachedReader(inner, 1.5)).toThrow(RangeError);
  });

  test("returns identical bytes to the underlying reader", () => {
    const cached = new CachedReader(new MemoryReader(data), 1024);
    const cases = [
      [0, 10],
      [1020, 8], // spans a block boundary
      [0, 4096], // spans several whole blocks
      [9990, 50], // straddles EOF
      [5000, 1], // single byte
    ];
    for (const [offset, length] of cases) {
      expect(Array.from(cached.read(offset, length))).toEqual(
        Array.from(
          data.subarray(offset, Math.min(offset + length, data.length)),
        ),
      );
    }
  });

  test("serves repeated reads from cache (no extra underlying reads)", () => {
    const counter = new CountingReader(new MemoryReader(data));
    const cached = new CachedReader(counter, 1024);

    cached.read(100, 50);
    expect(counter.reads.length).toBe(1); // one block fetched
    cached.read(100, 50); // same block
    cached.read(200, 10); // still within block 0
    expect(counter.reads.length).toBe(1); // no new underlying reads

    const stats = cached.stats;
    expect(stats.misses).toBe(1);
    expect(stats.hits).toBe(2);
    expect(stats.cachedBlocks).toBe(1);
  });

  test("fetches block-aligned ranges from the underlying reader", () => {
    const counter = new CountingReader(new MemoryReader(data));
    const cached = new CachedReader(counter, 1024);
    cached.read(1500, 10); // lives in block 1 -> offset 1024
    expect(counter.reads).toEqual([{ offset: 1024, length: 1024 }]);
  });

  test("fetches one block per spanned block exactly once", () => {
    const counter = new CountingReader(new MemoryReader(data));
    const cached = new CachedReader(counter, 1024);
    cached.read(1000, 1100); // spans blocks 0, 1, 2
    expect(counter.reads.map((r) => r.offset).sort((a, b) => a - b)).toEqual([
      0, 1024, 2048,
    ]);
    expect(cached.stats.misses).toBe(3);
  });

  test("evicts the least-recently-used block past capacity", () => {
    const counter = new CountingReader(new MemoryReader(data));
    const cached = new CachedReader(counter, 1024, 2); // hold 2 blocks

    cached.read(0, 1); // block 0
    cached.read(1024, 1); // block 1
    cached.read(2048, 1); // block 2 -> evicts block 0 (LRU)
    expect(cached.stats.cachedBlocks).toBe(2);

    cached.read(0, 1); // block 0 must be re-fetched
    const block0Fetches = counter.reads.filter((r) => r.offset === 0).length;
    expect(block0Fetches).toBe(2);
  });

  test("a cache hit refreshes LRU position", () => {
    const counter = new CountingReader(new MemoryReader(data));
    const cached = new CachedReader(counter, 1024, 2);

    cached.read(0, 1); // block 0
    cached.read(1024, 1); // block 1
    cached.read(0, 1); // hit on block 0 -> now MRU; block 1 becomes LRU
    cached.read(2048, 1); // block 2 -> evicts block 1, not block 0

    cached.read(0, 1); // block 0 still cached -> hit, no re-fetch
    const block0Fetches = counter.reads.filter((r) => r.offset === 0).length;
    expect(block0Fetches).toBe(1);
  });

  test("close() clears the cache and closes the inner reader", () => {
    const counter = new CountingReader(new MemoryReader(data));
    const cached = new CachedReader(counter, 1024);
    cached.read(0, 10);
    cached.close();
    expect(counter.closed).toBe(true);
    expect(cached.stats.cachedBlocks).toBe(0);
  });

  test("rejects negative offsets", () => {
    const cached = new CachedReader(new MemoryReader(data), 1024);
    expect(() => cached.read(-1, 10)).toThrow(RangeError);
  });
});

describe("NodeFileReader", () => {
  const data = makeData(500);

  // Fake fs serving from `data`; `maxChunk` lets us force short reads.
  function makeFakeFs(maxChunk = Infinity) {
    const state = { opened: 0, closed: 0, lastFlags: "" };
    const fs: NodeFsLike = {
      openSync(_path: string, flags: string): number {
        state.opened++;
        state.lastFlags = flags;
        return 7;
      },
      fstatSync(_fd: number) {
        return { size: data.length };
      },
      readSync(_fd, buffer, offset, length, position) {
        const end = Math.min(
          position + Math.min(length, maxChunk),
          data.length,
        );
        let n = 0;
        for (let i = position; i < end; i++) buffer[offset + n++] = data[i];
        return n;
      },
      closeSync(_fd: number) {
        state.closed++;
      },
    };
    return { fs, state };
  }

  test("opens read-only and reports size", () => {
    const { fs, state } = makeFakeFs();
    const reader = new NodeFileReader("/x.nc", fs);
    expect(reader.size).toBe(500);
    expect(state.opened).toBe(1);
    expect(state.lastFlags).toBe("r");
  });

  test("reads a positioned range", () => {
    const { fs } = makeFakeFs();
    const reader = new NodeFileReader("/x.nc", fs);
    expect(Array.from(reader.read(100, 4))).toEqual([100, 101, 102, 103]);
  });

  test("loops over short reads to fill the range", () => {
    const { fs } = makeFakeFs(3); // 3 bytes per readSync call
    const reader = new NodeFileReader("/x.nc", fs);
    const out = reader.read(10, 10);
    expect(out.length).toBe(10);
    expect(Array.from(out)).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  });

  test("clamps reads at EOF", () => {
    const { fs } = makeFakeFs();
    const reader = new NodeFileReader("/x.nc", fs);
    expect(reader.read(498, 10).length).toBe(2);
    expect(reader.read(500, 4).length).toBe(0);
  });

  test("close() closes the descriptor and blocks further reads", () => {
    const { fs, state } = makeFakeFs();
    const reader = new NodeFileReader("/x.nc", fs);
    reader.close();
    expect(state.closed).toBe(1);
    expect(() => reader.read(0, 1)).toThrow();
    reader.close(); // idempotent
    expect(state.closed).toBe(1);
  });
});

describe("createLazyStreamOps", () => {
  const data = makeData(1000);
  const reader = new MemoryReader(data);
  const ops = createLazyStreamOps(reader);
  const stream = { position: 0, node: {} };

  test("read copies the requested range into the buffer at offset", () => {
    const buffer = new Uint8Array(20);
    const n = ops.read(stream, buffer, 5, 10, 100);
    expect(n).toBe(10);
    expect(Array.from(buffer.subarray(5, 15))).toEqual(
      Array.from(data.subarray(100, 110)),
    );
    // Bytes outside the written window stay zero.
    expect(buffer[4]).toBe(0);
    expect(buffer[15]).toBe(0);
  });

  test("read past EOF returns 0", () => {
    const buffer = new Uint8Array(10);
    expect(ops.read(stream, buffer, 0, 10, 1000)).toBe(0);
    expect(ops.read(stream, buffer, 0, 0, 10)).toBe(0);
  });

  test("read straddling EOF returns the available count", () => {
    const buffer = new Uint8Array(10);
    expect(ops.read(stream, buffer, 0, 10, 995)).toBe(5);
  });

  test("write is rejected (read-only)", () => {
    expect(() => ops.write()).toThrow(/read-only/);
  });

  test("llseek handles SEEK_SET, SEEK_CUR and SEEK_END", () => {
    expect(ops.llseek({ position: 0, node: {} }, 42, 0)).toBe(42); // SEEK_SET
    expect(ops.llseek({ position: 100, node: {} }, 5, 1)).toBe(105); // SEEK_CUR
    expect(ops.llseek({ position: 0, node: {} }, 0, 2)).toBe(1000); // SEEK_END
    expect(ops.llseek({ position: 0, node: {} }, -10, 2)).toBe(990);
    expect(() => ops.llseek({ position: 0, node: {} }, -1, 0)).toThrow();
  });
});

describe("mountLazyFile", () => {
  const data = makeData(2048);
  const reader = new MemoryReader(data);

  function makeFakeFS() {
    const calls = { dirs: [] as string[], files: [] as string[] };
    const FS = {
      mkdirTree(path: string) {
        calls.dirs.push(path);
      },
      mkdir(path: string) {
        calls.dirs.push(path);
      },
      createFile(
        parent: string,
        name: string,
        _props: Record<string, unknown>,
        canRead: boolean,
        canWrite: boolean,
      ) {
        calls.files.push(`${parent}/${name}`);
        return { parent, name, canRead, canWrite } as any;
      },
    };
    return { FS, calls };
  }

  test("creates the parent dir and a read-only file with lazy stream_ops", () => {
    const { FS, calls } = makeFakeFS();
    const node: any = mountLazyFile(FS, "/tmp/data.nc", reader);

    expect(calls.dirs).toContain("/tmp");
    expect(calls.files).toContain("/tmp/data.nc");
    expect(node.canRead).toBe(true);
    expect(node.canWrite).toBe(false);
    expect(node.usedBytes).toBe(2048); // size getter, no file load
    expect(typeof node.stream_ops.read).toBe("function");
  });

  test("the mounted node reads through to the reader", () => {
    const { FS } = makeFakeFS();
    const node: any = mountLazyFile(FS, "/tmp/data.nc", reader);
    const buffer = new Uint8Array(8);
    const n = node.stream_ops.read({ position: 0, node }, buffer, 0, 8, 16);
    expect(n).toBe(8);
    expect(Array.from(buffer)).toEqual(Array.from(data.subarray(16, 24)));
  });
});

describe("createLazyReader", () => {
  test("passes a LazyReader through unchanged", () => {
    const reader = new MemoryReader(makeData(10));
    expect(createLazyReader(reader)).toBe(reader);
  });

  test("throws on an unsupported source", () => {
    expect(() => createLazyReader(123 as any)).toThrow(
      /Unsupported lazy source/,
    );
  });
});
