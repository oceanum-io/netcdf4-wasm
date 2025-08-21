---
layout: page
title: User Guides
---

# User Guides

Comprehensive guides for getting started and mastering netcdf4-wasm.

## Getting Started

- [**Installation & Setup**](installation.html) - Install and configure netcdf4-wasm
- [**Quick Start Guide**](getting-started.html) - Your first NetCDF operations
- [**Basic Concepts**](basic-concepts.html) - Understanding NetCDF structure and terminology

## Core Functionality

- [**File Operations**](file-operations.html) - Creating, opening, and managing NetCDF files
- [**Working with Variables**](variables.html) - Creating, reading, and writing data variables
- [**Dimensions and Coordinates**](dimensions.html) - Setting up data dimensions and coordinate systems
- [**Attributes and Metadata**](attributes.html) - Managing file and variable metadata

## Advanced Features

- [**Memory-based Operations**](memory-operations.html) - Working with Blobs and ArrayBuffers
- [**Browser Integration**](browser-integration.html) - File inputs, downloads, and web workflows
- [**Groups and Hierarchies**](groups.html) - Organizing data with NetCDF4 groups
- [**Data Types and Precision**](data-types.html) - Choosing appropriate data types

## Development

- [**Building from Source**](building.html) - Compile netcdf4-wasm from source
- [**TypeScript Integration**](typescript.html) - Using with TypeScript projects
- [**Testing and Debugging**](testing.html) - Testing strategies and troubleshooting

## Best Practices

- [**Performance Optimization**](performance.html) - Writing efficient code
- [**CF Conventions**](cf-conventions.html) - Following climate data standards
- [**Error Handling**](error-handling.html) - Robust error handling patterns
- [**Security Considerations**](security.html) - Safe practices for web applications

## Migration and Compatibility

- [**From netcdf4-python**](python-migration.html) - Migrating from Python netCDF4
- [**Browser Compatibility**](browser-compatibility.html) - Supporting different browsers
- [**Node.js vs Browser**](nodejs-vs-browser.html) - Environment-specific considerations

---

## Quick Reference

### Common Patterns

```javascript
// Read existing file
const dataset = await Dataset('data.nc', 'r');
const data = await dataset.variables.temperature.getValue();
await dataset.close();

// Create new file
const nc = await Dataset('output.nc', 'w');
await nc.createDimension('time', 10);
const temp = await nc.createVariable('temperature', 'f8', ['time']);
await temp.setValue(new Float64Array([...data]));
await nc.close();

// Work with memory/blob
const dataset = await Dataset(blob, 'r');
const exportBlob = await dataset.toBlob();
```

### Key Differences from Python

| Concept | Python netCDF4 | netcdf4-wasm |
|---------|----------------|--------------|
| File opening | `Dataset('file.nc')` | `await Dataset('file.nc')` |
| Data reading | `var[:]` | `await var.getValue()` |
| Data writing | `var[:] = data` | `await var.setValue(data)` |
| File closing | `nc.close()` | `await nc.close()` |

### Support Matrix

| Feature | Support Level | Notes |
|---------|---------------|-------|
| NetCDF4 format | ✅ Full | All features supported |
| NetCDF3 format | ✅ Full | Classic format support |
| Compression | ✅ Full | zlib, szip, etc. |
| Groups | ✅ Full | Hierarchical organization |
| Unlimited dimensions | ✅ Full | Growable dimensions |
| String variables | 🚧 Partial | Basic support |
| Parallel I/O | ❌ Not available | Single-threaded |
| Advanced indexing | 🚧 Planned | Future release |

---

**Need help?** Check our [examples](../examples/) or open an issue on [GitHub](https://github.com/yourusername/netcdf4-wasm/issues).