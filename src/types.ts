// Type definitions for NetCDF4 WASM

export interface EmscriptenModule {
    ccall: (name: string, returnType: string, argTypes: string[], args: any[]) => any;
    cwrap: (name: string, returnType: string, argTypes: string[]) => (...args: any[]) => any;
    getValue: (ptr: number, type: string) => number;
    setValue: (ptr: number, value: number, type: string) => void;
    UTF8ToString: (ptr: number) => string;
    stringToUTF8: (str: string, outPtr: number, maxBytesToWrite: number) => void;
    lengthBytesUTF8: (str: string) => number;
    _malloc: (size: number) => number;
    _free: (ptr: number) => void;
    allocateString: (str: string) => number;
    freeString: (ptr: number) => void;
    FS: any;
    ready: Promise<EmscriptenModule>;
    HEAPF64: Float64Array;
    HEAP32: Int32Array;
    HEAPU8: Uint8Array;
}

export interface NetCDF4Module extends EmscriptenModule {
    // Wrapped NetCDF4 functions
    nc_open: (path: string, mode: number) => { result: number; ncid: number };
    nc_close: (ncid: number) => number;
    nc_create: (path: string, mode: number) => { result: number; ncid: number };
    nc_def_dim: (ncid: number, name: string, len: number) => { result: number; dimid: number };
    nc_def_var: (ncid: number, name: string, xtype: number, ndims: number, dimids: number[]) => { result: number; varid: number };
    nc_put_var_double: (ncid: number, varid: number, data: Float64Array) => number;
    nc_get_var_double: (ncid: number, varid: number, size: number) => { result: number; data: Float64Array };
    nc_enddef: (ncid: number) => number;
}

export interface NetCDF4WasmOptions {
    wasmPath?: string;
    memoryInitialPages?: number;
    memoryMaximumPages?: number;
}

export interface DatasetOptions extends NetCDF4WasmOptions {
    format?: string;
    diskless?: boolean;
    persist?: boolean;
    keepweakref?: boolean;
    memory?: ArrayBuffer;
}

export interface MemoryDatasetSource {
    data: ArrayBuffer | Uint8Array;
    filename?: string;
}

// Union type for polymorphic Dataset constructor
export type DatasetSource = string | Blob | ArrayBuffer | Uint8Array;

export interface VariableOptions {
    zlib?: boolean;
    complevel?: number;
    shuffle?: boolean;
    fletcher32?: boolean;
    contiguous?: boolean;
    chunksizes?: number[];
}

declare global {
    function NetCDF4Module(options?: any): Promise<EmscriptenModule>;
}