# Changelog

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