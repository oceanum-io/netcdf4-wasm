// WASM module loading and wrapping functionality

import type {
  EmscriptenModule,
  NetCDF4Module,
  NetCDF4WasmOptions,
} from "./types";

export class WasmModuleLoader {
  static async loadModule(
    options: NetCDF4WasmOptions = {},
  ): Promise<NetCDF4Module> {
    try {
      const moduleFactory = WasmModuleLoader.resolveModuleFactory(
        WasmModuleLoader.loadRawLoader(options),
      );

      const rawModule = await moduleFactory({
        locateFile: (path: string) => {
          if (options.wasmPath) {
            const wasmPath = options.wasmPath.replace(".js", ".wasm");
            return wasmPath;
          }
          // For Node.js environment, provide absolute path to WASM file
          if (typeof window === "undefined") {
            const path_module = require("path");
            return path_module.join(
              __dirname,
              "..",
              "dist",
              "netcdf4-module.wasm",
            );
          }
          return path;
        },
      });

      // A real Emscripten runtime exposes cwrap. If it does not, we loaded
      // the wrong file (see resolveModuleFactory) or a build without the
      // required runtime methods exported.
      if (typeof (rawModule as any)?.cwrap !== "function") {
        throw new Error(
          "Loaded module is not an Emscripten runtime (cwrap is missing). " +
            "Ensure dist/netcdf4-module.js was built with MODULARIZE and " +
            'EXPORTED_RUNTIME_METHODS including "cwrap"/"ccall".',
        );
      }

      // Wrap the module with high-level functions
      return WasmModuleLoader.wrapModule(rawModule);
    } catch (error) {
      throw new Error(`Failed to load NetCDF4 WASM module: ${error}`);
    }
  }

  /** Load the raw Emscripten loader export: browser global or Node require. */
  private static loadRawLoader(options: NetCDF4WasmOptions): unknown {
    if (typeof window !== "undefined") {
      // Browser: the Emscripten loader must already be on the global scope.
      if (typeof NetCDF4Module === "undefined") {
        throw new Error(
          "NetCDF4Module global not found. Load dist/netcdf4-module.js " +
            "(the Emscripten loader) before using the library in the browser.",
        );
      }
      return NetCDF4Module;
    }
    // Node.js: require the generated Emscripten loader.
    const path = require("path");
    const wasmPath =
      options.wasmPath ||
      path.join(__dirname, "..", "dist", "netcdf4-module.js");
    try {
      return require(wasmPath);
    } catch (error) {
      throw new Error(
        `Could not load the Emscripten loader from "${wasmPath}". Build it with ` +
          `\`npm run build:wasm\`, or pass options.wasmPath. (${error})`,
      );
    }
  }

  /**
   * Resolve the Emscripten module factory from a raw module export.
   *
   * Emscripten's MODULARIZE build exports the factory as `module.exports`
   * (CommonJS) or, under ESM interop, as a `default` export. Accept either.
   * Throws a clear, actionable error when the value is not a factory function
   * - most commonly because the library entry point (which exports the
   * `NetCDF4` class) was required instead of the generated loader. See issue #3.
   */
  static resolveModuleFactory(
    raw: unknown,
  ): (opts?: any) => Promise<EmscriptenModule> {
    const candidate =
      typeof raw === "function"
        ? raw
        : (raw as { default?: unknown } | null)?.default;
    if (typeof candidate !== "function") {
      const found =
        raw && typeof raw === "object"
          ? `object with keys [${Object.keys(raw as object).join(", ")}]`
          : `${raw === null ? "null" : typeof raw}`;
      throw new Error(
        `Expected the Emscripten module factory (a function) but got ${found}. ` +
          "Make sure dist/netcdf4-module.js is the MODULARIZE Emscripten loader, " +
          "not the library entry point (e.g. dist/netcdf4.js / dist/index.js).",
      );
    }
    return candidate as (opts?: any) => Promise<EmscriptenModule>;
  }

  private static wrapModule(module: EmscriptenModule): NetCDF4Module {
    // Create wrappers for NetCDF functions
    const nc_open_wrapper = module.cwrap("nc_open_wrapper", "number", [
      "string",
      "number",
      "number",
    ]);
    const nc_close_wrapper = module.cwrap("nc_close_wrapper", "number", [
      "number",
    ]);
    const nc_create_wrapper = module.cwrap("nc_create_wrapper", "number", [
      "string",
      "number",
      "number",
    ]);
    const nc_def_dim_wrapper = module.cwrap("nc_def_dim_wrapper", "number", [
      "number",
      "string",
      "number",
      "number",
    ]);
    const nc_def_var_wrapper = module.cwrap("nc_def_var_wrapper", "number", [
      "number",
      "string",
      "number",
      "number",
      "number",
      "number",
    ]);
    const nc_put_var_double_wrapper = module.cwrap(
      "nc_put_var_double_wrapper",
      "number",
      ["number", "number", "number"],
    );
    const nc_get_var_double_wrapper = module.cwrap(
      "nc_get_var_double_wrapper",
      "number",
      ["number", "number", "number"],
    );
    const nc_enddef_wrapper = module.cwrap("nc_enddef_wrapper", "number", [
      "number",
    ]);
    const nc_inq_ndims_wrapper = module.cwrap("nc_inq_ndims_wrapper", "number", ["number", "number"]);
    const nc_inq_unlimdim_wrapper = module.cwrap("nc_inq_unlimdim_wrapper", "number", ["number", "number"]);
    const nc_inq_dim_wrapper = module.cwrap("nc_inq_dim_wrapper", "number", ["number", "number", "number", "number"]);
    const nc_inq_nvars_wrapper = module.cwrap("nc_inq_nvars_wrapper", "number", ["number", "number"]);
    const nc_inq_var_wrapper = module.cwrap("nc_inq_var_wrapper", "number", ["number", "number", "number", "number", "number", "number", "number"]);
    const nc_inq_natts_wrapper = module.cwrap("nc_inq_natts_wrapper", "number", ["number", "number"]);
    const nc_inq_attname_wrapper = module.cwrap("nc_inq_attname_wrapper", "number", ["number", "number", "number", "number"]);
    const nc_inq_att_wrapper = module.cwrap("nc_inq_att_wrapper", "number", ["number", "number", "string", "number", "number"]);
    const nc_get_att_text_wrapper = module.cwrap("nc_get_att_text_wrapper", "number", ["number", "number", "string", "number"]);
    const nc_get_att_double_wrapper = module.cwrap("nc_get_att_double_wrapper", "number", ["number", "number", "string", "number"]);

    return {
      ...module,

      nc_open: (path: string, mode: number) => {
        const ncidPtr = module._malloc(4);
        const result = nc_open_wrapper(path, mode, ncidPtr);
        const ncid = module.getValue(ncidPtr, "i32");
        module._free(ncidPtr);
        return { result, ncid };
      },

      nc_close: (ncid: number) => {
        return nc_close_wrapper(ncid);
      },

      nc_create: (path: string, mode: number) => {
        const ncidPtr = module._malloc(4);
        const result = nc_create_wrapper(path, mode, ncidPtr);
        const ncid = module.getValue(ncidPtr, "i32");
        module._free(ncidPtr);
        return { result, ncid };
      },

      nc_def_dim: (ncid: number, name: string, len: number) => {
        const dimidPtr = module._malloc(4);
        const result = nc_def_dim_wrapper(ncid, name, len, dimidPtr);
        const dimid = module.getValue(dimidPtr, "i32");
        module._free(dimidPtr);
        return { result, dimid };
      },

      nc_def_var: (
        ncid: number,
        name: string,
        xtype: number,
        ndims: number,
        dimids: number[],
      ) => {
        const varidPtr = module._malloc(4);
        const dimidsPtr = module._malloc(dimids.length * 4);

        for (let i = 0; i < dimids.length; i++) {
          module.setValue(dimidsPtr + i * 4, dimids[i], "i32");
        }

        const result = nc_def_var_wrapper(
          ncid,
          name,
          xtype,
          ndims,
          dimidsPtr,
          varidPtr,
        );
        const varid = module.getValue(varidPtr, "i32");

        module._free(varidPtr);
        module._free(dimidsPtr);
        return { result, varid };
      },

      nc_put_var_double: (ncid: number, varid: number, data: Float64Array) => {
        const dataPtr = module._malloc(data.length * 8);
        module.HEAPF64.set(data, dataPtr / 8);
        const result = nc_put_var_double_wrapper(ncid, varid, dataPtr);
        module._free(dataPtr);
        return result;
      },

      nc_get_var_double: (ncid: number, varid: number, size: number) => {
        const dataPtr = module._malloc(size * 8);
        const result = nc_get_var_double_wrapper(ncid, varid, dataPtr);
        const data = new Float64Array(module.HEAPF64.buffer, dataPtr, size);
        const resultData = new Float64Array(data);
        module._free(dataPtr);
        return { result, data: resultData };
      },

      nc_enddef: (ncid: number) => {
        return nc_enddef_wrapper(ncid);
      },

      nc_inq_ndims: (ncid: number) => {
        const p = module._malloc(4);
        const result = nc_inq_ndims_wrapper(ncid, p);
        const ndims = module.getValue(p, "i32");
        module._free(p);
        return { result, ndims };
      },

      nc_inq_unlimdim: (ncid: number) => {
        const p = module._malloc(4);
        const result = nc_inq_unlimdim_wrapper(ncid, p);
        const unlimdimid = module.getValue(p, "i32");
        module._free(p);
        return { result, unlimdimid };
      },

      nc_inq_dim: (ncid: number, dimid: number) => {
        const namePtr = module._malloc(256);
        const lenPtr = module._malloc(4);
        const result = nc_inq_dim_wrapper(ncid, dimid, namePtr, lenPtr);
        const name = module.UTF8ToString(namePtr);
        const len = module.getValue(lenPtr, "i32");
        module._free(namePtr);
        module._free(lenPtr);
        return { result, name, len };
      },

      nc_inq_nvars: (ncid: number) => {
        const p = module._malloc(4);
        const result = nc_inq_nvars_wrapper(ncid, p);
        const nvars = module.getValue(p, "i32");
        module._free(p);
        return { result, nvars };
      },

      nc_inq_var: (ncid: number, varid: number) => {
        const namePtr = module._malloc(256);
        const xtypePtr = module._malloc(4);
        const ndimsPtr = module._malloc(4);
        const dimidsPtr = module._malloc(1024 * 4);
        const nattsPtr = module._malloc(4);
        const result = nc_inq_var_wrapper(
          ncid,
          varid,
          namePtr,
          xtypePtr,
          ndimsPtr,
          dimidsPtr,
          nattsPtr,
        );
        const name = module.UTF8ToString(namePtr);
        const xtype = module.getValue(xtypePtr, "i32");
        const ndims = module.getValue(ndimsPtr, "i32");
        const dimids: number[] = [];
        for (let i = 0; i < ndims; i++) {
          dimids.push(module.getValue(dimidsPtr + i * 4, "i32"));
        }
        const natts = module.getValue(nattsPtr, "i32");
        module._free(namePtr);
        module._free(xtypePtr);
        module._free(ndimsPtr);
        module._free(dimidsPtr);
        module._free(nattsPtr);
        return { result, name, xtype, ndims, dimids, natts };
      },

      nc_inq_natts: (ncid: number) => {
        const p = module._malloc(4);
        const result = nc_inq_natts_wrapper(ncid, p);
        const natts = module.getValue(p, "i32");
        module._free(p);
        return { result, natts };
      },

      nc_inq_attname: (ncid: number, varid: number, attnum: number) => {
        const namePtr = module._malloc(256);
        const result = nc_inq_attname_wrapper(ncid, varid, attnum, namePtr);
        const name = module.UTF8ToString(namePtr);
        module._free(namePtr);
        return { result, name };
      },

      nc_inq_att: (ncid: number, varid: number, name: string) => {
        const xtypePtr = module._malloc(4);
        const lenPtr = module._malloc(4);
        const result = nc_inq_att_wrapper(ncid, varid, name, xtypePtr, lenPtr);
        const xtype = module.getValue(xtypePtr, "i32");
        const len = module.getValue(lenPtr, "i32");
        module._free(xtypePtr);
        module._free(lenPtr);
        return { result, xtype, len };
      },

      nc_get_att_text: (
        ncid: number,
        varid: number,
        name: string,
        len: number,
      ) => {
        const valuePtr = module._malloc(len + 1);
        const result = nc_get_att_text_wrapper(ncid, varid, name, valuePtr);
        module.setValue(valuePtr + len, 0, "i8");
        const text = module.UTF8ToString(valuePtr);
        module._free(valuePtr);
        return { result, text };
      },

      nc_get_att_double: (
        ncid: number,
        varid: number,
        name: string,
        len: number,
      ) => {
        const count = Math.max(len, 1);
        const valuePtr = module._malloc(count * 8);
        const result = nc_get_att_double_wrapper(ncid, varid, name, valuePtr);
        const values = new Float64Array(
          new Float64Array(module.HEAPF64.buffer, valuePtr, len),
        );
        module._free(valuePtr);
        return { result, values };
      },
    };
  }
}
