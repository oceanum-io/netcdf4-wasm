// WASM module loading and wrapping functionality

import type { EmscriptenModule, NetCDF4Module, NetCDF4WasmOptions } from './types';

export class WasmModuleLoader {
    static async loadModule(options: NetCDF4WasmOptions = {}): Promise<NetCDF4Module> {
        try {
            // Load the WASM module
            let moduleFactory: any;
            
            if (typeof window !== 'undefined') {
                // Browser environment
                if (typeof NetCDF4Module === 'undefined') {
                    throw new Error('NetCDF4Module not found. Make sure netcdf4.js is loaded.');
                }
                moduleFactory = NetCDF4Module;
            } else {
                // Node.js environment
                const path = require('path');
                const wasmPath = options.wasmPath || path.join(__dirname, '..', 'dist', 'netcdf4.js');
                moduleFactory = require(wasmPath);
            }

            const rawModule = await moduleFactory({
                locateFile: (path: string) => {
                    if (options.wasmPath) {
                        const wasmPath = options.wasmPath.replace('.js', '.wasm');
                        return wasmPath;
                    }
                    // For Node.js environment, provide absolute path to WASM file
                    if (typeof window === 'undefined') {
                        const path_module = require('path');
                        return path_module.join(__dirname, '..', 'dist', 'netcdf4.wasm');
                    }
                    return path;
                }
            });

            // Wrap the module with high-level functions
            return WasmModuleLoader.wrapModule(rawModule);
        } catch (error) {
            throw new Error(`Failed to load NetCDF4 WASM module: ${error}`);
        }
    }

    private static wrapModule(module: EmscriptenModule): NetCDF4Module {
        // Create wrappers for NetCDF functions
        const nc_open_wrapper = module.cwrap('nc_open_wrapper', 'number', ['string', 'number', 'number']);
        const nc_close_wrapper = module.cwrap('nc_close_wrapper', 'number', ['number']);
        const nc_create_wrapper = module.cwrap('nc_create_wrapper', 'number', ['string', 'number', 'number']);
        const nc_def_dim_wrapper = module.cwrap('nc_def_dim_wrapper', 'number', ['number', 'string', 'number', 'number']);
        const nc_def_var_wrapper = module.cwrap('nc_def_var_wrapper', 'number', ['number', 'string', 'number', 'number', 'number', 'number']);
        const nc_put_var_double_wrapper = module.cwrap('nc_put_var_double_wrapper', 'number', ['number', 'number', 'number']);
        const nc_get_var_double_wrapper = module.cwrap('nc_get_var_double_wrapper', 'number', ['number', 'number', 'number']);
        const nc_enddef_wrapper = module.cwrap('nc_enddef_wrapper', 'number', ['number']);

        return {
            ...module,
            
            nc_open: (path: string, mode: number) => {
                const ncidPtr = module._malloc(4);
                const result = nc_open_wrapper(path, mode, ncidPtr);
                const ncid = module.getValue(ncidPtr, 'i32');
                module._free(ncidPtr);
                return { result, ncid };
            },

            nc_close: (ncid: number) => {
                return nc_close_wrapper(ncid);
            },

            nc_create: (path: string, mode: number) => {
                const ncidPtr = module._malloc(4);
                const result = nc_create_wrapper(path, mode, ncidPtr);
                const ncid = module.getValue(ncidPtr, 'i32');
                module._free(ncidPtr);
                return { result, ncid };
            },

            nc_def_dim: (ncid: number, name: string, len: number) => {
                const dimidPtr = module._malloc(4);
                const result = nc_def_dim_wrapper(ncid, name, len, dimidPtr);
                const dimid = module.getValue(dimidPtr, 'i32');
                module._free(dimidPtr);
                return { result, dimid };
            },

            nc_def_var: (ncid: number, name: string, xtype: number, ndims: number, dimids: number[]) => {
                const varidPtr = module._malloc(4);
                const dimidsPtr = module._malloc(dimids.length * 4);
                
                for (let i = 0; i < dimids.length; i++) {
                    module.setValue(dimidsPtr + i * 4, dimids[i], 'i32');
                }
                
                const result = nc_def_var_wrapper(ncid, name, xtype, ndims, dimidsPtr, varidPtr);
                const varid = module.getValue(varidPtr, 'i32');
                
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
            }
        };
    }
}