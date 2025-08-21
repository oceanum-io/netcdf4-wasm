---
layout: page
title: Dataset Class
---

# Dataset Class

The `NetCDF4` class (aliased as `Dataset`) is the main interface for working with NetCDF files. It provides methods for creating, reading, and writing NetCDF datasets.

## Constructor

```typescript
new NetCDF4(filename?: string, mode?: string, options?: DatasetOptions)
```

### Parameters

- `filename` (optional): Path to the NetCDF file
- `mode` (optional): File access mode. Default: `'r'`
  - `'r'`: Read-only
  - `'w'`: Write (create new file, overwrite if exists)
  - `'w-'`: Write (create new file, fail if exists)
  - `'a'`: Append (read/write existing file)
  - `'r+'`: Read/write existing file
- `options` (optional): Additional options

### Options

```typescript
interface DatasetOptions {
    format?: string;           // 'NETCDF4' (default), 'NETCDF3_CLASSIC', etc.
    diskless?: boolean;        // Create diskless (in-memory) file
    persist?: boolean;         // Save diskless file on close
    keepweakref?: boolean;     // Keep weak reference to file
    memory?: ArrayBuffer;      // Initial memory for diskless file
}
```

## Static Factory Methods

### Dataset()

```typescript
static async Dataset(
    filename: string, 
    mode?: string, 
    options?: DatasetOptions
): Promise<NetCDF4>
```

Recommended factory method that handles initialization automatically.

```javascript
const dataset = await NetCDF4.Dataset('data.nc', 'r');
```

### fromBlob()

```typescript
static async fromBlob(
    blob: Blob,
    mode?: string,
    options?: DatasetOptions
): Promise<NetCDF4>
```

Create dataset from a Blob object (e.g., from file input).

```javascript
const file = event.target.files[0]; // File is a Blob
const dataset = await NetCDF4.fromBlob(file, 'r');
```

### fromArrayBuffer()

```typescript
static async fromArrayBuffer(
    buffer: ArrayBuffer,
    mode?: string,
    options?: DatasetOptions
): Promise<NetCDF4>
```

Create dataset from an ArrayBuffer.

```javascript
const response = await fetch('data.nc');
const buffer = await response.arrayBuffer();
const dataset = await NetCDF4.fromArrayBuffer(buffer, 'r');
```

### fromMemory()

```typescript
static async fromMemory(
    data: Uint8Array | ArrayBuffer,
    mode?: string,
    options?: DatasetOptions,
    filename?: string
): Promise<NetCDF4>
```

Create dataset from memory data with optional custom filename.

```javascript
const data = new Uint8Array(1024);
const dataset = await NetCDF4.fromMemory(data, 'w', {}, '/tmp/custom.nc');
```

## Properties

### File Information

```typescript
readonly file_format: string        // File format ('NETCDF4', 'NETCDF3_CLASSIC', etc.)
readonly disk_format: string        // Same as file_format
readonly filepath: string           // Path to the file
readonly isopen: boolean            // Whether file is currently open
```

### Collections

```typescript
readonly dimensions: {[name: string]: Dimension}    // Dictionary of dimensions
readonly variables: {[name: string]: Variable}      // Dictionary of variables
readonly groups: {[name: string]: Group}            // Dictionary of groups
```

## Instance Methods

### File Operations

#### initialize()

```typescript
async initialize(): Promise<void>
```

Initialize the WASM module. Called automatically by factory methods.

```javascript
const dataset = new NetCDF4('file.nc', 'r');
await dataset.initialize(); // Manual initialization required
```

#### close()

```typescript
async close(): Promise<void>
```

Close the dataset and free resources.

```javascript
await dataset.close();
```

#### sync()

```typescript
async sync(): Promise<void>
```

Flush any buffered data to disk.

```javascript
await dataset.sync();
```

### Structure Definition

#### createDimension()

```typescript
async createDimension(name: string, size: number | null): Promise<Dimension>
```

Create a new dimension. Use `null` for unlimited dimensions.

```javascript
const timeDim = await dataset.createDimension('time', null); // unlimited
const latDim = await dataset.createDimension('lat', 180);    // fixed size
```

#### createVariable()

```typescript
async createVariable(
    name: string,
    datatype: string,
    dimensions: string[],
    options?: VariableOptions
): Promise<Variable>
```

Create a new variable.

```javascript
const temp = await dataset.createVariable('temperature', 'f8', ['time', 'lat', 'lon']);
const pressure = await dataset.createVariable('pressure', 'f4', ['time', 'level']);
```

**Data Types:**
- `'f4'`: 32-bit float
- `'f8'`: 64-bit float (double)
- `'i1'`, `'i2'`, `'i4'`: Signed integers
- `'u1'`, `'u2'`, `'u4'`: Unsigned integers

**Variable Options:**
```typescript
interface VariableOptions {
    zlib?: boolean;         // Enable compression
    complevel?: number;     // Compression level (1-9)
    shuffle?: boolean;      // Enable shuffle filter
    fletcher32?: boolean;   // Enable checksum
    contiguous?: boolean;   // Contiguous storage
    chunksizes?: number[];  // Chunk sizes for each dimension
}
```

#### createGroup()

```typescript
createGroup(name: string): Group
```

Create a hierarchical group (NetCDF4 only).

```javascript
const observations = dataset.createGroup('observations');
const forecasts = dataset.createGroup('forecasts');
```

### Attribute Operations

#### setncattr()

```typescript
setncattr(name: string, value: any): void
```

Set a global attribute.

```javascript
dataset.setncattr('title', 'My Dataset');
dataset.setncattr('version', 1.0);
dataset.setncattr('created', new Date().toISOString());
```

#### getncattr()

```typescript
getncattr(name: string): any
```

Get a global attribute value.

```javascript
const title = dataset.getncattr('title');
const version = dataset.getncattr('version');
```

#### ncattrs()

```typescript
ncattrs(): string[]
```

Get list of all global attribute names.

```javascript
const attrs = dataset.ncattrs();
console.log('Global attributes:', attrs);
```

### Data Export

#### toArrayBuffer()

```typescript
async toArrayBuffer(): Promise<ArrayBuffer>
```

Export dataset as ArrayBuffer (for in-memory datasets).

```javascript
const buffer = await dataset.toArrayBuffer();
```

#### toBlob()

```typescript
async toBlob(type?: string): Promise<Blob>
```

Export dataset as Blob for download.

```javascript
const blob = await dataset.toBlob('application/x-netcdf');

// Create download link
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'data.nc';
link.click();
URL.revokeObjectURL(url);
```

### Utility Methods

#### isInitialized()

```typescript
isInitialized(): boolean
```

Check if the WASM module is initialized.

```javascript
if (dataset.isInitialized()) {
    // Safe to perform operations
}
```

#### toString()

```typescript
toString(): string
```

Get string representation of the dataset.

```javascript
console.log(dataset.toString());
// Output: <netCDF4.Dataset 'file.nc': mode = 'r', file format = 'NETCDF4', open>
```

## Usage Examples

### Creating a New Dataset

```javascript
import { NetCDF4 } from 'netcdf4-wasm';

async function createDataset() {
    // Create new file
    const nc = await NetCDF4.Dataset('output.nc', 'w', { format: 'NETCDF4' });
    
    try {
        // Set global attributes
        nc.setncattr('Conventions', 'CF-1.8');
        nc.setncattr('title', 'Sample Dataset');
        nc.setncattr('institution', 'Example University');
        
        // Create dimensions
        const time = await nc.createDimension('time', null);  // unlimited
        const lat = await nc.createDimension('lat', 180);
        const lon = await nc.createDimension('lon', 360);
        
        // Create coordinate variables
        const timeVar = await nc.createVariable('time', 'f8', ['time']);
        timeVar.units = 'days since 2000-01-01';
        timeVar.calendar = 'gregorian';
        
        const latVar = await nc.createVariable('latitude', 'f4', ['lat']);
        latVar.units = 'degrees_north';
        latVar.standard_name = 'latitude';
        
        const lonVar = await nc.createVariable('longitude', 'f4', ['lon']);
        lonVar.units = 'degrees_east';
        lonVar.standard_name = 'longitude';
        
        // Create data variable
        const temp = await nc.createVariable('temperature', 'f4', ['time', 'lat', 'lon'], {
            zlib: true,
            complevel: 6
        });
        temp.units = 'K';
        temp.standard_name = 'air_temperature';
        temp._FillValue = -9999.0;
        
        // Write coordinate data
        const latData = new Float32Array(180);
        for (let i = 0; i < 180; i++) {
            latData[i] = -89.5 + i; // -89.5 to 89.5
        }
        await latVar.setValue(latData);
        
        const lonData = new Float32Array(360);
        for (let i = 0; i < 360; i++) {
            lonData[i] = -179.5 + i; // -179.5 to 179.5
        }
        await lonVar.setValue(lonData);
        
        // Write some temperature data
        const tempData = new Float32Array(180 * 360);
        for (let i = 0; i < tempData.length; i++) {
            tempData[i] = 273.15 + Math.random() * 30; // Random temperature
        }
        await temp.setValue(tempData);
        
    } finally {
        await nc.close();
    }
}
```

### Reading an Existing Dataset

```javascript
async function readDataset() {
    const nc = await NetCDF4.Dataset('data.nc', 'r');
    
    try {
        // Print file information
        console.log('File format:', nc.file_format);
        console.log('Dimensions:', Object.keys(nc.dimensions));
        console.log('Variables:', Object.keys(nc.variables));
        
        // Read global attributes
        const attrs = nc.ncattrs();
        attrs.forEach(attr => {
            console.log(`${attr}: ${nc.getncattr(attr)}`);
        });
        
        // Access variables
        const temp = nc.variables.temperature;
        if (temp) {
            console.log('Temperature attributes:');
            console.log('  units:', temp.units);
            console.log('  long_name:', temp.long_name);
            console.log('  shape:', temp.dimensions);
            
            // Read data
            const data = await temp.getValue();
            console.log('Temperature data statistics:');
            console.log('  min:', Math.min(...data));
            console.log('  max:', Math.max(...data));
            console.log('  mean:', data.reduce((a, b) => a + b) / data.length);
        }
        
    } finally {
        await nc.close();
    }
}
```

### Working with Memory-based Datasets

```javascript
async function memoryDataset() {
    // Create dataset in memory
    const nc = await NetCDF4.fromMemory(new Uint8Array(0), 'w');
    
    try {
        // Add structure and data
        await nc.createDimension('x', 10);
        const variable = await nc.createVariable('data', 'f8', ['x']);
        await variable.setValue(new Float64Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
        
        // Export to blob for download
        const blob = await nc.toBlob();
        
        // In browser, create download
        if (typeof window !== 'undefined') {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'generated.nc';
            link.click();
            URL.revokeObjectURL(url);
        }
        
    } finally {
        await nc.close();
    }
}
```