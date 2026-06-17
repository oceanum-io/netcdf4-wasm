---
layout: page
title: Lazy File Reading
---

# Lazy File Reading

By default, opening a file from a Blob, ArrayBuffer, or Uint8Array copies the
**entire file into memory** (once in JavaScript, once again inside the WASM
filesystem). For large files that is wasteful — or impossible if the file is
bigger than available RAM.

Lazy reading instead pulls **only the byte ranges NetCDF actually touches**,
on demand, through a small in-memory LRU cache. Listing dimensions, variables,
and attributes reads just the header; reading a small variable from a huge file
reads just that variable's bytes.

## How it works

NetCDF-3 (via `posixio`) and NetCDF-4 (via HDF5's `sec2` driver) both read files
through ordinary `seek`/`read` syscalls. In WebAssembly those dispatch to
Emscripten's virtual-filesystem layer. Lazy reading installs a custom read
handler on the virtual file that fetches ranges from a `LazyReader` instead of
returning bytes from a fully-loaded copy. Because it intercepts at the syscall
layer, **it works for both NetCDF-3 and NetCDF-4**.

## Usage

```javascript
import { Dataset } from 'netcdf4-wasm';

// Browser: a File/Blob from an <input> — MUST run inside a Web Worker
const dataset = await Dataset(file, 'r', { lazy: true });

const temp = await dataset.variables.temperature.getValue();
await dataset.close();
```

Lazy datasets are **read-only** (`mode: 'r'`).

### Source support

| Source | Backend | Where it runs |
|--------|---------|---------------|
| `File` / `Blob` | `BlobReader` (`FileReaderSync`) | **Web Worker only** |
| File path (string) | `NodeFileReader` (`fs.readSync`) | Node.js |
| Custom | any `LazyReader` you implement | anywhere |

### Why a Web Worker (browser)?

`read()` is synchronous, but reading a `Blob` on the main thread is async. The
only synchronous way to read a `Blob` is `FileReaderSync`, which exists **only in
Workers**. Running the import in a Worker is good practice anyway — it keeps the
UI responsive. In Node, `fs.readSync` is synchronous everywhere, so no Worker is
needed.

## Tuning the cache

```javascript
const dataset = await Dataset(file, 'r', {
  lazy: true,
  blockSize: 64 * 1024,   // bytes per cached block (default 64 KiB)
  maxCacheBlocks: 256,    // max blocks held (default 256 → ~16 MiB cap)
});
```

## Custom readers

Implement the `LazyReader` interface to read from any source (e.g. HTTP range
requests):

```typescript
import { LazyReader, NetCDF4 } from 'netcdf4-wasm';

class RangeReader implements LazyReader {
  constructor(public readonly size: number, private url: string) {}
  read(offset: number, length: number): Uint8Array {
    // Must be synchronous — e.g. a synchronous XHR Range request in a Worker.
    const xhr = new XMLHttpRequest();
    xhr.open('GET', this.url, /* async */ false);
    xhr.setRequestHeader('Range', `bytes=${offset}-${offset + length - 1}`);
    xhr.responseType = 'arraybuffer';
    xhr.send();
    return new Uint8Array(xhr.response);
  }
  close() {}
}

const dataset = await NetCDF4.fromLazy(new RangeReader(fileSize, url), 'r');
```

## Caveats

- **Browser → Worker only.** The Blob path needs `FileReaderSync`.
- **NetCDF-4 compressed chunks.** Reading any slice forces HDF5 to decompress
  every internal chunk it overlaps, so transient memory is bounded by the
  *chunk* size, not the file size — but a file written with very large chunks
  still sets a floor. NetCDF-3 has no chunking/compression and is not affected.
- **NetCDF-3 record variables** are interleaved record-by-record, so reading one
  across all records produces many scattered range reads; the block cache
  absorbs most of the cost.
- **Whole-variable reads.** `getValue()` still reads an entire variable. Reading
  arbitrary hyperslabs (`var[start:count]`) without touching the rest of the
  variable is planned (requires `nc_get_vara` bindings).
- **Requires a WASM build with the filesystem exported** (`-sFORCE_FILESYSTEM=1`
  and `FS` in `EXPORTED_RUNTIME_METHODS`), which the bundled build provides.
