---
layout: page
title: API Reference
---

# API Reference

Complete API documentation for netcdf4-wasm.

## Quick Navigation

- [Dataset Class](dataset) - Main interface for NetCDF files
- [Variable Class](variable) - Access and manipulate variables
- **Dimension Class** *(coming soon)* - Work with dimensions
- **Group Class** *(coming soon)* - Hierarchical data organization
- **Constants** *(coming soon)* - NetCDF constants and enumerations
- **Types** *(coming soon)* - TypeScript type definitions

## Core Concepts

### Dataset
The `Dataset` class is the main entry point for working with NetCDF files. It provides both static factory methods and instance methods for file operations.

```typescript
// Factory function (recommended)
const dataset = await Dataset('file.nc', 'r');

// Static method
const dataset = await NetCDF4.Dataset('file.nc', 'r');

// Direct instantiation
const dataset = new NetCDF4('file.nc', 'r');
await dataset.initialize();
```

### Memory-based Sources
netcdf4-wasm supports multiple input sources through polymorphic constructors:

```typescript
// File path
await Dataset('file.nc', 'r');

// Blob (browser file input)
await Dataset(blob, 'r');

// ArrayBuffer
await Dataset(arrayBuffer, 'r');

// Uint8Array
await Dataset(uint8Array, 'r');
```

### Variables and Data Access
Variables represent arrays of data with associated metadata:

```typescript
const variable = dataset.variables.temperature;
const data = await variable.getValue();        // Read all data
await variable.setValue(newData);              // Write data

// Attributes
console.log(variable.units);                   // Quick access to common attributes
variable.units = 'K';                         // Set attributes
variable.setncattr('custom_attr', 'value');   // Set any attribute
```

### Dimensions
Dimensions define the size and structure of variables:

```typescript
// Create dimensions
const timeDim = await dataset.createDimension('time', 10);      // Fixed size
const unlimitedDim = await dataset.createDimension('record', null); // Unlimited

// Access properties
console.log(timeDim.size);          // 10
console.log(timeDim.isUnlimited);   // false
console.log(unlimitedDim.isUnlimited); // true
```

### Groups (NetCDF4 only)
Groups provide hierarchical organization of data:

```typescript
const group = dataset.createGroup('measurements');
await group.createDimension('time', 100);
const temp = await group.createVariable('temperature', 'f8', ['time']);
```

## Data Types

netcdf4-wasm supports all standard NetCDF data types:

| NetCDF Type | JavaScript Type | Description |
|-------------|-----------------|-------------|
| `'f4'` | `Float32Array` | 32-bit floating point |
| `'f8'` | `Float64Array` | 64-bit floating point |
| `'i1'` | `Int8Array` | 8-bit signed integer |
| `'i2'` | `Int16Array` | 16-bit signed integer |
| `'i4'` | `Int32Array` | 32-bit signed integer |
| `'u1'` | `Uint8Array` | 8-bit unsigned integer |
| `'u2'` | `Uint16Array` | 16-bit unsigned integer |
| `'u4'` | `Uint32Array` | 32-bit unsigned integer |

## Error Handling

All async operations can throw errors. Always use try-catch blocks:

```typescript
try {
    const dataset = await Dataset('file.nc', 'r');
    // ... operations
    await dataset.close();
} catch (error) {
    console.error('NetCDF operation failed:', error.message);
}
```

Common error types:
- File not found or inaccessible
- Invalid NetCDF format
- Dimension/variable name conflicts
- Data type mismatches
- Memory allocation failures

## Best Practices

### Resource Management
Always close datasets when finished:

```typescript
const dataset = await Dataset('file.nc', 'r');
try {
    // ... work with dataset
} finally {
    await dataset.close();
}
```

### Memory Efficiency
For large datasets, consider processing in chunks:

```typescript
// Instead of loading all data at once
const allData = await variable.getValue(); // Might use too much memory

// Process in logical chunks
for (let timeStep = 0; timeStep < timeDim.size; timeStep++) {
    // Process one time step at a time
    // (Note: Slicing/indexing is planned for future versions)
}
```

### Attribute Conventions
Follow CF (Climate and Forecast) conventions for metadata:

```typescript
variable.units = 'K';
variable.standard_name = 'air_temperature';
variable.long_name = 'Air Temperature';
variable._FillValue = -9999.0;

dataset.setncattr('Conventions', 'CF-1.8');
dataset.setncattr('title', 'My Dataset');
dataset.setncattr('history', new Date().toISOString() + ' created');
```

## Version Compatibility

### Python netcdf4 Equivalents

This library aims to provide API compatibility with Python's netcdf4 library:

| Python | JavaScript |
|--------|-----------|
| `Dataset('file.nc')` | `await Dataset('file.nc')` |
| `nc.dimensions['time']` | `nc.dimensions.time` |
| `nc.variables['temp'][:]` | `await nc.variables.temp.getValue()` |
| `nc.createDimension('x', 10)` | `await nc.createDimension('x', 10)` |
| `nc.close()` | `await nc.close()` |

### Async/Await
All file I/O operations are asynchronous in JavaScript:

```python
# Python (synchronous)
nc = netCDF4.Dataset('file.nc')
data = nc.variables['temp'][:]
nc.close()
```

```javascript
// JavaScript (asynchronous)
const nc = await Dataset('file.nc');
const data = await nc.variables.temp.getValue();
await nc.close();
```