// Lazy file reading - reader factory
//
// Picks the right LazyReader backend for a given source: a Blob/File in the
// browser, a path string in Node, or an already-constructed LazyReader passed
// through unchanged.

import type { LazyReader } from "./types";
import { BlobReader } from "./blob-reader";
import { NodeFileReader } from "./node-reader";

export type LazySource = LazyReader | Blob | string;

function isLazyReader(value: unknown): value is LazyReader {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as LazyReader).read === "function" &&
    typeof (value as LazyReader).size === "number"
  );
}

export function createLazyReader(source: LazySource): LazyReader {
  if (isLazyReader(source)) {
    return source;
  }
  if (typeof Blob !== "undefined" && source instanceof Blob) {
    return new BlobReader(source);
  }
  if (typeof source === "string") {
    return new NodeFileReader(source);
  }
  throw new Error(
    "Unsupported lazy source: expected a LazyReader, Blob, or file path string",
  );
}
