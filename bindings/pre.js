// Pre-run JavaScript for NetCDF4 WASM module
// This file is executed before the WASM module is initialized

Module = Module || {};

// Configure module settings
Module.preRun = Module.preRun || [];
Module.postRun = Module.postRun || [];

// Memory and filesystem setup
Module.preRun.push(function() {
    console.log('NetCDF4 WASM: Initializing...');
});

Module.postRun.push(function() {
    console.log('NetCDF4 WASM: Ready');
});

// Export for Node.js if available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Module;
}