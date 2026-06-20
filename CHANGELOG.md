# Changelog

## [0.3.0] - 2026-06-20

### Added
- **Read an existing file's structure.** Opening a file now populates
  `dimensions`, `variables` (name, type, dimensions) and attributes (per-variable
  and global) from the file, via new `nc_inq_ndims/dim/unlimdim/nvars/var/natts/
  attname/att` and `nc_get_att_text/double` wrappers and a `Group.loadFromFile()`
  that runs on open. Previously structure was only available when writing or in
  test mode (the `dimensions`/`variables` maps came back empty for real files).
- `Variable.getValue()` now reads any numeric type (read as double via NetCDF's
  on-read conversion), not just float/double.

## [0.2.1] - 2026-06-20

### Fixed
- **Browser:** export `_malloc`/`_free` via `EXPORTED_FUNCTIONS`. They were
  mis-placed in `EXPORTED_RUNTIME_METHODS`, so Emscripten never attached them to
  the module — `Module._malloc` was `undefined` and the wrapper threw
  `_malloc is not a function` on every read. Also export the `HEAPF64` view the
  wrapper uses for bulk float64 I/O. NetCDF reads now work under bundlers
  (Vite/webpack) and in the browser.

## [0.1.0] - 2024-12-17

### Added
- Initial implementation of NetCDF4 WASM bindings
- Python netcdf4-python compatible API
- Complete TypeScript interface with proper typing
- Modular code structure for maintainability

### Features
- NetCDF4 C library compilation to WASM via Emscripten
- Support for HDF5 and zlib dependencies
- Python-like Dataset, Variable, Dimension, and Group classes
- Comprehensive build system with dependency checking
- Jest test suite foundation
- NPM packaging configuration

### API Structure
- `src/index.ts` - Main exports and convenience functions
- `src/netcdf4.ts` - Main NetCDF4 class (equivalent to Python's Dataset)
- `src/variable.ts` - Variable class with attribute support
- `src/dimension.ts` - Dimension class
- `src/group.ts` - Hierarchical group support
- `src/constants.ts` - NetCDF constants and type mappings
- `src/types.ts` - TypeScript type definitions
- `src/wasm-module.ts` - WASM module loading and wrapping

### Build System
- Automated dependency building (zlib, HDF5, NetCDF4)
- Emscripten toolchain integration
- Cross-platform build scripts
- Development dependency checking

### Documentation
- Comprehensive README with Python-like examples
- API reference documentation
- Build and development instructions
- Project structure documentation