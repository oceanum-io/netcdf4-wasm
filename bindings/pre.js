// Pre-run JavaScript for NetCDF4 WASM module
// This file is executed before the WASM module is initialized

Module = Module || {};

// Configure module settings
Module.preRun = Module.preRun || [];
Module.postRun = Module.postRun || [];

// Memory and filesystem setup
Module.preRun.push(function () {
  console.log("NetCDF4 WASM: Initializing...");
});

Module.postRun.push(function () {
  console.log("NetCDF4 WASM: Ready");
});

// NOTE: Do not set `module.exports` here. The module is built with MODULARIZE,
// so Emscripten exports the factory function (`NetCDF4Module`) itself. Assigning
// `module.exports = Module` from inside the factory clobbered that export with a
// module instance, which broke `require()` in Node.js (see issue #3).
