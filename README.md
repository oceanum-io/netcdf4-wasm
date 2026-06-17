# netcdf4-wasm

[![CI](https://github.com/oceanum-io/netcdf4-wasm/actions/workflows/ci.yml/badge.svg)](https://github.com/oceanum-io/netcdf4-wasm/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/netcdf4-wasm.svg)](https://www.npmjs.com/package/netcdf4-wasm)

NetCDF4 library compiled to WebAssembly with JavaScript/TypeScript bindings.

## Overview

This project provides a complete WebAssembly port of the NetCDF4 C library, enabling NetCDF file operations in browser and Node.js environments. It includes:

- Complete NetCDF4 C library compiled to WASM using Emscripten
- High-level TypeScript/JavaScript API
- Support for reading and writing NetCDF4 files
- Comprehensive test suite

## Installation

### NPM/Yarn (Node.js and bundlers)

```bash
npm install netcdf4-wasm
```

### CDN (Browser)

```html
<!-- Load WASM module first -->
<script src="https://unpkg.com/netcdf4-wasm@latest/dist/netcdf4-module.js"></script>
<!-- Then UMD build (recommended for browser) -->
<script src="https://unpkg.com/netcdf4-wasm@latest/dist/netcdf4-wasm.umd.min.js"></script>

<!-- ES Module build -->
<script type="module">
  import { Dataset } from "https://unpkg.com/netcdf4-wasm@latest/dist/netcdf4-wasm.esm.js";
</script>
```

## Prerequisites

For building from source, you'll need:

- Emscripten SDK
- CMake
- Make
- wget or curl

Check dependencies:

```bash
npm run check-deps
```

Install Emscripten locally:

```bash
npm run install-emscripten
```

## Usage

The JavaScript API is modeled closely on the [netcdf4-python](https://unidata.github.io/netcdf4-python) API.

### Basic Example

#### ES Modules (Node.js, bundlers)

```typescript
import { Dataset } from "netcdf4-wasm";
// or: import { NetCDF4 } from 'netcdf4-wasm';

async function example() {
  // Create a new NetCDF file (similar to Python netCDF4.Dataset)
  const nc = await Dataset("example.nc", "w", { format: "NETCDF4" });
  // or: const nc = await NetCDF4.Dataset('example.nc', 'w', { format: 'NETCDF4' });

  // Create dimensions
  const lat = await nc.createDimension("lat", 73);
  const lon = await nc.createDimension("lon", 144);
  const time = await nc.createDimension("time", null); // unlimited dimension

  // Create variables
  const temp = await nc.createVariable("temperature", "f4", [
    "time",
    "lat",
    "lon",
  ]);
  const times = await nc.createVariable("time", "f8", ["time"]);

  // Set variable attributes
  temp.units = "Kelvin";
  temp.long_name = "surface temperature";
  times.units = "hours since 0001-01-01 00:00:00.0";
  times.calendar = "gregorian";

  // Set global attributes
  nc.setAttr("description", "bogus example script");
  nc.setAttr("history", "Created " + new Date().toISOString());
  nc.setAttr("source", "netCDF4-wasm example");

  // Write data
  const tempData = new Float64Array(73 * 144);
  tempData.fill(288.0); // Fill with 288K
  await temp.setValue(tempData);

  // Close the file
  await nc.close();
}
```

#### Browser UMD (Global variable)

```html
<!-- Load WASM module first -->
<script src="https://unpkg.com/netcdf4-wasm@latest/dist/netcdf4-module.js"></script>
<!-- Then UMD build -->
<script src="https://unpkg.com/netcdf4-wasm@latest/dist/netcdf4-wasm.umd.min.js"></script>
<script>
async function example() {
  // Access via global NetCDF4WASM object
  const { Dataset } = NetCDF4WASM;
  
  // Create a new NetCDF file
  const nc = await Dataset(new ArrayBuffer(0), "w", { format: "NETCDF4" });

  // Create dimensions
  const lat = await nc.createDimension("lat", 73);
  const lon = await nc.createDimension("lon", 144);
  const time = await nc.createDimension("time", null); // unlimited dimension

  // Create variables
  const temp = await nc.createVariable("temperature", "f4", [
    "time",
    "lat",
    "lon",
  ]);

  // Set variable attributes
  temp.units = "Kelvin";
  temp.long_name = "surface temperature";

  // Set global attributes
  nc.setAttr("description", "Created with UMD build");

  // Write data
  const tempData = new Float64Array(73 * 144);
  tempData.fill(288.0); // Fill with 288K
  await temp.setValue(tempData);

  // Export as blob for download
  const blob = await nc.toBlob();
  await nc.close();
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'example.nc';
  a.click();
}
</script>
```

### Reading Files

```typescript
import { Dataset } from "netcdf4-wasm";

async function readExample() {
  // Open existing file for reading
  const nc = await Dataset("data.nc", "r");

  // Access dimensions
  console.log("Dimensions:", Object.keys(nc.dimensions));
  console.log("Time dimension size:", nc.dimensions.time.size);

  // Access variables
  console.log("Variables:", Object.keys(nc.variables));
  const temp = nc.variables.temperature;

  // Read variable attributes
  console.log("Temperature units:", temp.units);
  console.log("Temperature long name:", temp.long_name);

  // Read data
  const data = await temp.getValue();
  console.log("Temperature data shape:", data.length);
  console.log("First few values:", data.slice(0, 5));

  // Access global attributes
  console.log("Global attributes:", nc.attrs());
  console.log("Description:", nc.getAttr("description"));

  await nc.close();
}
```

### Alternative Constructor (Direct Instantiation)

```typescript
import { NetCDF4 } from "netcdf4-wasm";

async function directExample() {
  // Direct instantiation (requires manual initialization)
  const nc = new NetCDF4("example.nc", "w", { format: "NETCDF4" });
  await nc.initialize();

  // Use same API as above...
  const lat = await nc.createDimension("lat", 10);
  const temp = await nc.createVariable("temperature", "f8", ["lat"]);

  await nc.close();
}
```

### Working with Groups

```typescript
async function groupExample() {
  const nc = await Dataset("grouped.nc", "w", { format: "NETCDF4" });

  // Create a group
  const forecasts = nc.createGroup("forecasts");

  // Create dimensions and variables in the group
  const time = await forecasts.createDimension("time", 24);
  const temp = await forecasts.createVariable("temperature", "f4", ["time"]);

  // Set group attributes
  forecasts.setAttr("description", "Forecast data");

  await nc.close();
}
```

## API Reference

The API closely follows netcdf4-python conventions for ease of use by scientists familiar with Python.

### Classes

#### `NetCDF4`

Main class for NetCDF file operations, similar to `netCDF4.Dataset` in Python.

**Constructor**

```typescript
new NetCDF4(filename?: string, mode?: string, options?: NetCDF4WasmOptions)
```

**Static Methods**

- `NetCDF4.Dataset(filename: string, mode?: string, options?: object): Promise<NetCDF4>` - Factory method (Python-like)

**Module Functions**

- `Dataset(filename: string, mode?: string, options?: object): Promise<NetCDF4>` - Convenience function (import directly)

**Properties**

- `dimensions: {[name: string]: Dimension}` - Dictionary of dimensions
- `variables: {[name: string]: Variable}` - Dictionary of variables
- `groups: {[name: string]: Group}` - Dictionary of groups
- `file_format: string` - File format (e.g., 'NETCDF4')
- `filepath: string` - Path to the file
- `isopen: boolean` - Whether file is currently open

**Methods**

_File Operations_

- `initialize(): Promise<void>` - Initialize the WASM module
- `close(): Promise<void>` - Close the file
- `sync(): Promise<void>` - Flush data to disk

_Structure Definition_

- `createDimension(name: string, size: number): Promise<Dimension>` - Create dimension
- `createVariable(name: string, datatype: string, dimensions: string[], options?: object): Promise<Variable>` - Create variable
- `createGroup(name: string): Group` - Create hierarchical group

_Attribute Access_

- `setAttr(name: string, value: any): void` - Set global attribute
- `getAttr(name: string): any` - Get global attribute
- `attrs(): string[]` - List all global attributes

#### `Variable`

Represents a NetCDF variable, similar to Python's Variable class.

**Properties**

- `name: string` - Variable name
- `datatype: string` - Data type ('f4', 'f8', 'i4', etc.)
- `dimensions: string[]` - Dimension names
- `units: string` - Units attribute (convenience property)
- `long_name: string` - Long name attribute (convenience property)
- `standard_name: string` - Standard name attribute (convenience property)

**Methods**

- `getValue(): Promise<Float64Array>` - Read variable data
- `setValue(data: Float64Array): Promise<void>` - Write variable data
- `setAttr(name: string, value: any): void` - Set variable attribute
- `getAttr(name: string): any` - Get variable attribute
- `attrs(): string[]` - List variable attributes

#### `Dimension`

Represents a NetCDF dimension.

**Properties**

- `name: string` - Dimension name
- `size: number` - Dimension size
- `isUnlimited: boolean` - Whether dimension is unlimited

**Methods**

- `__len__(): number` - Get dimension size (Python-like)

### Constants

The `NC_CONSTANTS` object provides NetCDF constants:

```typescript
NC_CONSTANTS.NC_NOERR; // No error
NC_CONSTANTS.NC_NOWRITE; // Read-only access
NC_CONSTANTS.NC_WRITE; // Write access
NC_CONSTANTS.NC_CLOBBER; // Overwrite existing file
NC_CONSTANTS.NC_NETCDF4; // NetCDF4 format
NC_CONSTANTS.NC_DOUBLE; // Double data type
NC_CONSTANTS.NC_UNLIMITED; // Unlimited dimension
```

## Building

### Install dependencies

```bash
npm install
```

### Check build dependencies

```bash
npm run check-deps
```

### Build the project

```bash
npm run build
```

This will:

1. Download and compile zlib, HDF5, and NetCDF4 C libraries
2. Create the WASM module with Emscripten
3. Compile TypeScript bindings
4. Build multiple output formats:
   - UMD build for browsers (`dist/netcdf4-wasm.umd.js`)
   - UMD minified for production (`dist/netcdf4-wasm.umd.min.js`)
   - ES modules for bundlers (`dist/netcdf4-wasm.esm.js`)
   - CommonJS for Node.js (`dist/index.js`)

### Clean build artifacts

```bash
npm run clean
```

## Testing

Run tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

Watch mode:

```bash
npm run test:watch
```

## Development

### Project Structure

```
netcdf4-wasm/
├── src/                    # TypeScript source code
│   ├── index.ts           # Main API exports
│   ├── types.ts           # Type definitions
│   ├── constants.ts       # NetCDF constants
│   ├── netcdf4.ts         # Main NetCDF4 class
│   ├── group.ts           # Group class
│   ├── variable.ts        # Variable class
│   ├── dimension.ts       # Dimension class
│   ├── wasm-module.ts     # WASM module loader
│   └── __tests__/         # Test files
├── scripts/               # Build scripts
│   ├── build-wasm.sh     # Main WASM build script
│   ├── check-dependencies.sh
│   └── install-emscripten.sh
├── bindings/              # WASM bindings
│   ├── pre.js            # Pre-run JavaScript
│   └── post.js           # Post-run JavaScript
├── build/                 # Build artifacts (generated)
├── dist/                  # Distribution files (generated)
│   ├── index.js          # CommonJS build
│   ├── netcdf4-wasm.umd.js      # UMD build for browsers
│   ├── netcdf4-wasm.umd.min.js  # UMD minified build
│   └── netcdf4-wasm.esm.js      # ES modules build
├── rollup.config.js       # Rollup bundler configuration
├── tsconfig.rollup.json   # TypeScript config for Rollup
└── package.json
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## Continuous Integration & Releasing

GitHub Actions workflows (`.github/workflows/`):

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `ci.yml` | every push to `main` / PR to `main` | Runs the test suite (Node 18/20/22), typecheck, and the JS/UMD bundle build. No WASM needed (tests run against a mock module). |
| `wasm-build.yml` | PRs/pushes that touch the build scripts, bindings, or C wrapper; manual | Builds the full emscripten WASM module (zlib + HDF5 + netcdf-c) and uploads it as an artifact. Caches the SDK and compiled libs so it only does the heavy work when build inputs change. |
| `publish.yml` | pushing a `v*` tag | Verifies the tag matches `package.json`, runs tests, builds WASM + JS + bundles, and publishes to npm with provenance. |

### Cutting a release

1. Bump the version in `package.json` and commit.
2. Tag and push:

   ```bash
   git tag v0.1.2
   git push origin v0.1.2
   ```

The `publish.yml` workflow builds everything and publishes. It fails fast if the
tag (`v0.1.2`) does not match the `package.json` version.

> **Setup required:** add an `NPM_TOKEN` repository secret (Settings → Secrets and
> variables → Actions). Use an npm **automation** token so it bypasses 2FA on
> publish.

## License

MIT License - see LICENSE file for details.

## NetCDF4 Documentation

For more information about NetCDF4, visit: https://docs.unidata.ucar.edu/netcdf-c/current/

## Troubleshooting

### WASM Module Not Found

Make sure the WASM files are properly built and accessible:

```bash
npm run build:wasm
```

### Emscripten Not Found

Install Emscripten:

```bash
npm run install-emscripten
source build/emsdk/emsdk_env.sh
```

### Memory Issues

If you encounter memory-related errors, try increasing the initial memory:

```typescript
const netcdf = new NetCDF4({ memoryInitialPages: 512 });
```
