// Post-run JavaScript for NetCDF4 WASM module
// This file is executed after the WASM module is initialized

// Wrap NetCDF4 functions for easier JavaScript usage
if (Module && Module._malloc) {
    
    // Helper functions for memory management
    Module.allocateString = function(str) {
        var len = lengthBytesUTF8(str) + 1;
        var ptr = Module._malloc(len);
        stringToUTF8(str, ptr, len);
        return ptr;
    };

    Module.freeString = function(ptr) {
        Module._free(ptr);
    };

    // NetCDF4 wrapper functions will be added here
    // Example:
    // Module.nc_open = function(path, mode) {
    //     var pathPtr = Module.allocateString(path);
    //     var ncidPtr = Module._malloc(4);
    //     var result = Module._nc_open(pathPtr, mode, ncidPtr);
    //     var ncid = Module.getValue(ncidPtr, 'i32');
    //     Module.freeString(pathPtr);
    //     Module._free(ncidPtr);
    //     return { result: result, ncid: ncid };
    // };

    console.log('NetCDF4 WASM: JavaScript bindings loaded');
}