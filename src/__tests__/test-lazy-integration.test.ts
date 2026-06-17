// Integration tests for the lazy open path on NetCDF4 (mock-mode WASM).

import { Dataset, NetCDF4 } from "../index";
import { MemoryReader } from "../lazy";
import { TestSetup } from "../test-setup";

function makeData(size: number): Uint8Array {
  const data = new Uint8Array(size);
  for (let i = 0; i < size; i++) data[i] = i % 256;
  return data;
}

describe("NetCDF4 lazy open path", () => {
  beforeAll(() => {
    TestSetup.setupTestEnvironment();
    TestSetup.mockWasmModule();
  });

  afterAll(() => {
    TestSetup.cleanupTestEnvironment();
  });

  test("fromLazy rejects non-read modes", async () => {
    const reader = new MemoryReader(makeData(64));
    await expect(NetCDF4.fromLazy(reader, "w")).rejects.toThrow("read-only");
    await expect(NetCDF4.fromLazy(reader, "a")).rejects.toThrow("read-only");
  });

  test("fromLazy opens read-only from a custom LazyReader", async () => {
    const reader = new MemoryReader(makeData(128));
    const nc = await NetCDF4.fromLazy(reader, "r");
    try {
      expect(nc.isopen).toBe(true);
      expect(nc.toString()).toContain("(lazy)");
    } finally {
      await nc.close();
    }
    expect(nc.isopen).toBe(false);
  });

  test("lazy Blob open never reads the whole file via arrayBuffer()", async () => {
    if (typeof Blob === "undefined") {
      return; // environment without Blob; routing is covered by fromLazy tests
    }
    const blob = new Blob(["x".repeat(256)]);
    const arrayBufferSpy = jest.fn(async () => {
      throw new Error("arrayBuffer() should not be called in lazy mode");
    });
    (blob as any).arrayBuffer = arrayBufferSpy;

    // In Node (no Web Worker) the lazy Blob path reaches BlobReader, which
    // requires FileReaderSync. The point is it routes there instead of eagerly
    // loading the Blob into memory.
    await expect(Dataset(blob, "r", { lazy: true })).rejects.toThrow(
      /FileReaderSync|Worker/i,
    );
    expect(arrayBufferSpy).not.toHaveBeenCalled();
  });
});
