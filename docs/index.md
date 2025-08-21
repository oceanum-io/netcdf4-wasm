---
layout: default
title: netcdf4-wasm Documentation
description: NetCDF4 library compiled to WebAssembly with JavaScript/TypeScript bindings
---

# netcdf4-wasm

NetCDF4 library compiled to WebAssembly with JavaScript/TypeScript bindings.

## Overview

This library provides a complete implementation of NetCDF4 functionality with a familiar JavaScript/TypeScript API inspired by the netcdf4-python library.

### Key Features

- **Complete NetCDF4 Support**: Full NetCDF4 C library compiled to WASM
- **Memory-based Operations**: Work with Blobs, ArrayBuffers, and file systems
- **Python-like API**: Familiar interface for scientists coming from netcdf4-python
- **TypeScript Support**: Full type definitions for enhanced developer experience
- **Browser & Node.js**: Works in both environments
- **Comprehensive Testing**: Extensive test suite ensuring reliability

## Quick Start

### Installation

```bash
npm install netcdf4-wasm
```

### Basic Usage

```javascript
import { Dataset } from "netcdf4-wasm";

// Open from file path
const dataset = await Dataset("data.nc", "r");

// Or from a Blob (browser file input)
const file = event.target.files[0]; // File is a Blob
const dataset = await Dataset(file, "r");

// Or from ArrayBuffer
const response = await fetch("data.nc");
const buffer = await response.arrayBuffer();
const dataset = await Dataset(buffer, "r");

// Read data
console.log("Variables:", Object.keys(dataset.variables));
const temp = await dataset.variables.temperature.getValue();
console.log("Temperature data:", temp);

await dataset.close();
```

### Creating Data

```javascript
import { Dataset } from "netcdf4-wasm";

// Create new dataset in memory
const dataset = await Dataset(new ArrayBuffer(0), "w");

// Add dimensions
await dataset.createDimension("time", 10);
await dataset.createDimension("lat", 180);
await dataset.createDimension("lon", 360);

// Add variables
const temp = await dataset.createVariable("temperature", "f8", [
  "time",
  "lat",
  "lon",
]);
temp.units = "K";
temp.long_name = "Air Temperature";

// Write data
const data = new Float64Array(10 * 180 * 360);
data.fill(288.15); // Fill with 288K
await temp.setValue(data);

// Export as Blob for download
const blob = await dataset.toBlob();
await dataset.close();
```

## Documentation Sections

### [📖 User Guides](guides/)

Step-by-step guides for common tasks and workflows:

- [Getting Started](guides/getting-started/)
- [Installation & Setup](guides/installation/)
- [Working with Files](guides/file-operations/)
- [Memory-based Operations](guides/memory-operations/)
- [Browser Integration](guides/browser-integration/)
- [Building from Source](guides/building/)

### [🔧 API Reference](api/)

Complete API documentation:

- [Dataset Class](api/dataset/)
- [Variable Class](api/variable/)
- [Dimension Class](api/dimension/)
- [Group Class](api/group/)
- [Constants](api/constants/)
- [Types](api/types/)

### [💡 Examples](examples/)

Practical examples and use cases:

- [Basic File Operations](examples/basic-operations/)
- [Browser File Handling](examples/browser-files/)
- [Data Visualization](examples/data-visualization/)
- [Climate Data Processing](examples/climate-data/)
- [Advanced Workflows](examples/advanced-workflows/)

## Compatibility

### NetCDF Version Support

- NetCDF4 (HDF5-based) ✅
- NetCDF3 (classic format) ✅
- Groups and hierarchies ✅
- Unlimited dimensions ✅
- Compression ✅

### Browser Support

- Chrome 57+ ✅
- Firefox 52+ ✅
- Safari 11+ ✅
- Edge 16+ ✅

### Node.js Support

- Node.js 14+ ✅
- ES Modules ✅
- CommonJS ✅

## Performance

netcdf4-wasm is optimized for performance:

- **Memory Efficient**: Virtual file system minimizes memory copies
- **Streaming Support**: Process large files without loading entirely into memory
- **Compression**: Built-in zlib compression support
- **Typed Arrays**: Efficient data transfer using TypedArrays

## Community & Support

- **GitHub**: [Issues and discussions](https://github.com/yourusername/netcdf4-wasm)
- **Documentation**: This site (updated with each release)
- **Examples**: Complete example code in the repository

## License

MIT License - see [LICENSE](https://github.com/yourusername/netcdf4-wasm/blob/main/LICENSE) for details.

## Contributing

We welcome contributions! Please see our [contributing guidelines](https://github.com/yourusername/netcdf4-wasm/blob/main/CONTRIBUTING.md) for details on how to get started.

---

_netcdf4-wasm is built on the NetCDF4 C library. For more information about NetCDF, visit [Unidata's NetCDF documentation](https://docs.unidata.ucar.edu/netcdf-c/current/)._
