// Tests for the WASM loader's module-factory resolution (issue #3).

import { WasmModuleLoader } from "../wasm-module";

describe("WasmModuleLoader.resolveModuleFactory", () => {
  test("returns a CommonJS factory function unchanged", () => {
    const factory = () => Promise.resolve({} as any);
    expect(WasmModuleLoader.resolveModuleFactory(factory)).toBe(factory);
  });

  test("unwraps an ESM-interop default export", () => {
    const factory = () => Promise.resolve({} as any);
    expect(WasmModuleLoader.resolveModuleFactory({ default: factory })).toBe(
      factory,
    );
  });

  test("throws a clear error when the library entry point is loaded instead (issue #3)", () => {
    // Reproduces the reported failure: requiring dist/netcdf4.js yields the
    // NetCDF4 class export, not the Emscripten factory.
    class NetCDF4 {}
    expect(() => WasmModuleLoader.resolveModuleFactory({ NetCDF4 })).toThrow(
      /object with keys \[NetCDF4\]/,
    );
    expect(() => WasmModuleLoader.resolveModuleFactory({ NetCDF4 })).toThrow(
      /netcdf4-module\.js/,
    );
  });

  test("throws on null / undefined / non-factory primitives", () => {
    expect(() => WasmModuleLoader.resolveModuleFactory(null)).toThrow(/null/);
    expect(() => WasmModuleLoader.resolveModuleFactory(undefined)).toThrow(
      /undefined/,
    );
    expect(() => WasmModuleLoader.resolveModuleFactory(42)).toThrow(/number/);
  });
});
