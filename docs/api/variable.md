---
layout: page
title: Variable Class
---

# Variable Class

The `Variable` class represents NetCDF variables, which are multidimensional arrays with associated metadata (attributes). Variables are the primary way to store and access data in NetCDF files.

## Properties

### Basic Properties

```typescript
readonly name: string              // Variable name
readonly datatype: string          // Data type ('f4', 'f8', 'i4', etc.)
readonly dimensions: string[]      // Array of dimension names
readonly shape: number[]          // Array of dimension sizes
readonly size: number             // Total number of elements
readonly ndims: number            // Number of dimensions
```

### Convenience Attribute Properties

Common NetCDF attributes are exposed as properties for convenience:

```typescript
units: string                     // Units attribute
long_name: string                // Long name attribute  
standard_name: string            // Standard name attribute (CF conventions)
_FillValue: number               // Fill value for missing data
scale_factor: number             // Scale factor for packed data
add_offset: number               // Offset for packed data
```

### Example

```javascript
const temp = dataset.variables.temperature;
console.log(temp.name);          // "temperature"
console.log(temp.datatype);      // "f4"
console.log(temp.dimensions);    // ["time", "lat", "lon"]
console.log(temp.shape);         // [12, 180, 360]
console.log(temp.units);         // "K"
```

## Methods

### Data Access

#### getValue()

```typescript
async getValue(): Promise<Float64Array>
```

Read all variable data. Returns data as Float64Array regardless of the underlying NetCDF data type.

```javascript
const data = await variable.getValue();
console.log('Data length:', data.length);
console.log('First value:', data[0]);
```

**Note**: Future versions will support:
- Indexing and slicing: `getValue([start], [count], [stride])`
- Type-specific arrays: `getValueTyped()` returning the appropriate TypedArray

#### setValue()

```typescript
async setValue(data: Float64Array): Promise<void>
```

Write data to the variable. Data should be provided as Float64Array with length matching the variable's total size.

```javascript
// Create data array
const data = new Float64Array(variable.size);
for (let i = 0; i < data.length; i++) {
    data[i] = Math.sin(i * 0.1); // Example data
}

// Write to variable
await variable.setValue(data);
```

**Important**: 
- Data must be provided in C-order (row-major) layout
- Array length must match `variable.size`
- Data is automatically converted to the variable's NetCDF data type

### Attribute Operations

#### setAttr()

```typescript
setAttr(name: string, value: any): void
```

Set a variable attribute.

```javascript
variable.setAttr('units', 'meters per second');
variable.setAttr('valid_range', [0, 100]);
variable.setAttr('_FillValue', -9999.0);
```

#### getAttr()

```typescript
getAttr(name: string): any
```

Get a variable attribute value.

```javascript
const units = variable.getAttr('units');
const fillValue = variable.getAttr('_FillValue');
```

#### attrs()

```typescript
attrs(): string[]
```

Get list of all attribute names for this variable.

```javascript
const attrs = variable.attrs();
console.log('Variable attributes:', attrs);
```

### Utility Methods

#### __len__()

```typescript
__len__(): number
```

Get the size of the first (slowest-varying) dimension. Mimics Python's `len()` function.

```javascript
// For variable with shape [12, 180, 360]
console.log(variable.__len__()); // 12
```

## Data Types and Conversion

netcdf4-wasm automatically handles data type conversion between JavaScript and NetCDF:

### NetCDF → JavaScript

| NetCDF Type | JavaScript Read Type | Description |
|-------------|---------------------|-------------|
| `NC_BYTE` (`'i1'`) | `Float64Array` | 8-bit signed integer |
| `NC_UBYTE` (`'u1'`) | `Float64Array` | 8-bit unsigned integer |
| `NC_SHORT` (`'i2'`) | `Float64Array` | 16-bit signed integer |
| `NC_USHORT` (`'u2'`) | `Float64Array` | 16-bit unsigned integer |
| `NC_INT` (`'i4'`) | `Float64Array` | 32-bit signed integer |
| `NC_UINT` (`'u4'`) | `Float64Array` | 32-bit unsigned integer |
| `NC_FLOAT` (`'f4'`) | `Float64Array` | 32-bit floating point |
| `NC_DOUBLE` (`'f8'`) | `Float64Array` | 64-bit floating point |

### JavaScript → NetCDF

When writing data with `setValue()`, the Float64Array is automatically converted to the variable's NetCDF data type:

```javascript
// Variable created as 'f4' (32-bit float)
const temp = await dataset.createVariable('temperature', 'f4', ['time', 'lat', 'lon']);

// Data written as Float64Array but stored as 32-bit floats
const data = new Float64Array([273.15, 274.12, 275.33]);
await temp.setValue(data); // Automatically converted to f4 precision
```

## Usage Examples

### Creating and Writing Variables

```javascript
async function createVariables() {
    const nc = await Dataset('output.nc', 'w');
    
    try {
        // Create dimensions
        await nc.createDimension('time', 12);
        await nc.createDimension('lat', 180);
        await nc.createDimension('lon', 360);
        
        // Create temperature variable
        const temp = await nc.createVariable('temperature', 'f4', ['time', 'lat', 'lon']);
        
        // Set attributes using properties
        temp.units = 'K';
        temp.long_name = 'Air Temperature';
        temp.standard_name = 'air_temperature';
        temp._FillValue = -9999.0;
        
        // Set custom attributes
        temp.setAttr('valid_range', [200.0, 320.0]);
        temp.setAttr('coordinates', 'time lat lon');
        temp.setAttr('grid_mapping', 'crs');
        
        // Generate and write data
        const data = new Float64Array(12 * 180 * 360);
        let idx = 0;
        for (let t = 0; t < 12; t++) {
            for (let lat = 0; lat < 180; lat++) {
                for (let lon = 0; lon < 360; lon++) {
                    // Simple temperature model
                    const latDeg = -89.5 + lat;
                    const seasonal = Math.cos(t * Math.PI / 6); // Seasonal variation
                    const latitudinal = 288.15 - Math.abs(latDeg) * 0.5; // Cooler at poles
                    data[idx++] = latitudinal + seasonal * 10;
                }
            }
        }
        
        await temp.setValue(data);
        
        // Create coordinate variables
        const timeVar = await nc.createVariable('time', 'f8', ['time']);
        timeVar.units = 'months since 2023-01-01';
        timeVar.calendar = 'gregorian';
        
        const timeData = new Float64Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
        await timeVar.setValue(timeData);
        
    } finally {
        await nc.close();
    }
}
```

### Reading and Analyzing Variables

```javascript
async function analyzeVariable() {
    const nc = await Dataset('data.nc', 'r');
    
    try {
        const temp = nc.variables.temperature;
        
        // Print variable information
        console.log('Variable Info:');
        console.log(`  Name: ${temp.name}`);
        console.log(`  Type: ${temp.datatype}`);
        console.log(`  Dimensions: ${temp.dimensions.join(', ')}`);
        console.log(`  Shape: [${temp.shape.join(', ')}]`);
        console.log(`  Total elements: ${temp.size}`);
        
        // Print attributes
        console.log('\nAttributes:');
        const attrs = temp.attrs();
        attrs.forEach(attr => {
            const value = temp.getAttr(attr);
            console.log(`  ${attr}: ${value}`);
        });
        
        // Quick access to common attributes
        console.log(`\nUnits: ${temp.units}`);
        console.log(`Long name: ${temp.long_name}`);
        console.log(`Fill value: ${temp._FillValue}`);
        
        // Read and analyze data
        console.log('\nReading data...');
        const data = await temp.getValue();
        
        // Calculate statistics
        const validData = data.filter(val => val !== temp._FillValue);
        const min = Math.min(...validData);
        const max = Math.max(...validData);
        const mean = validData.reduce((sum, val) => sum + val, 0) / validData.length;
        
        console.log('Statistics:');
        console.log(`  Valid points: ${validData.length} / ${data.length}`);
        console.log(`  Min: ${min.toFixed(2)}`);
        console.log(`  Max: ${max.toFixed(2)}`);
        console.log(`  Mean: ${mean.toFixed(2)}`);
        
    } finally {
        await nc.close();
    }
}
```

### Working with Time Series Data

```javascript
async function timeSeriesExample() {
    const nc = await Dataset('timeseries.nc', 'w');
    
    try {
        // Create unlimited time dimension
        await nc.createDimension('time', null);
        await nc.createDimension('station', 5);
        
        // Create time coordinate
        const timeVar = await nc.createVariable('time', 'f8', ['time']);
        timeVar.units = 'hours since 2023-01-01 00:00:00';
        timeVar.calendar = 'gregorian';
        timeVar.long_name = 'time';
        
        // Create station data
        const stationVar = await nc.createVariable('station_id', 'i4', ['station']);
        stationVar.long_name = 'station identifier';
        
        // Create measurement variable
        const tempVar = await nc.createVariable('air_temperature', 'f4', ['time', 'station']);
        tempVar.units = 'degrees_Celsius';
        tempVar.standard_name = 'air_temperature';
        tempVar.long_name = 'Air Temperature';
        tempVar._FillValue = -999.0;
        tempVar.coordinates = 'time station';
        
        // Write station IDs
        const stationIds = new Float64Array([101, 102, 103, 104, 105]);
        await stationVar.setValue(stationIds);
        
        // Write 24 hours of hourly data
        const hours = 24;
        const stations = 5;
        
        // Time data (hours since start)
        const timeData = new Float64Array(hours);
        for (let h = 0; h < hours; h++) {
            timeData[h] = h;
        }
        await timeVar.setValue(timeData);
        
        // Temperature data with diurnal cycle
        const tempData = new Float64Array(hours * stations);
        let idx = 0;
        for (let h = 0; h < hours; h++) {
            const hourOfDay = h % 24;
            const diurnalTemp = 15 + 10 * Math.sin((hourOfDay - 6) * Math.PI / 12);
            
            for (let s = 0; s < stations; s++) {
                // Add station-specific offset and some noise
                const stationOffset = (s - 2) * 2; // -4 to +4 degrees
                const noise = (Math.random() - 0.5) * 2; // ±1 degree noise
                tempData[idx++] = diurnalTemp + stationOffset + noise;
            }
        }
        await tempVar.setValue(tempData);
        
        console.log(`Created time series with ${hours} time steps and ${stations} stations`);
        
    } finally {
        await nc.close();
    }
}
```

### Variable Metadata Best Practices

```javascript
async function metadataExample() {
    const nc = await Dataset('metadata_example.nc', 'w');
    
    try {
        await nc.createDimension('time', 100);
        await nc.createDimension('level', 10);
        
        // Example: Atmospheric pressure variable with comprehensive metadata
        const pressure = await nc.createVariable('air_pressure', 'f4', ['time', 'level']);
        
        // CF convention attributes
        pressure.standard_name = 'air_pressure';
        pressure.long_name = 'Atmospheric Pressure';
        pressure.units = 'Pa';
        
        // Data quality attributes
        pressure._FillValue = -9999.0;
        pressure.setAttr('valid_min', 50000.0);
        pressure.setAttr('valid_max', 110000.0);
        pressure.setAttr('accuracy', 100.0); // ±100 Pa
        
        // Grid and coordinate attributes
        pressure.setAttr('coordinates', 'time level latitude longitude');
        pressure.setAttr('grid_mapping', 'crs');
        
        // Processing attributes
        pressure.setAttr('source', 'Numerical Weather Prediction Model');
        pressure.setAttr('processing_level', '2');
        pressure.setAttr('cell_methods', 'time: mean level: point');
        
        // Custom application attributes
        pressure.setAttr('sensor_type', 'pressure_sensor_v2.1');
        pressure.setAttr('calibration_date', '2023-01-15');
        pressure.setAttr('data_version', '1.2.3');
        
        console.log('Created variable with comprehensive metadata');
        console.log('Attributes:', pressure.attrs());
        
    } finally {
        await nc.close();
    }
}
```

## Performance Considerations

### Memory Usage

- `getValue()` loads all variable data into memory
- For large variables, consider the memory requirements
- Future versions will support chunked reading for large datasets

### Data Layout

NetCDF uses C-order (row-major) layout for multidimensional arrays:

```javascript
// For a variable with dimensions [time, lat, lon] and shape [2, 3, 4]
// The data array index mapping is:
// data[t * (lat_size * lon_size) + lat * lon_size + lon]

const data = await variable.getValue();
const [timeSize, latSize, lonSize] = variable.shape;

// Access specific element [t=1, lat=2, lon=3]
const idx = 1 * (latSize * lonSize) + 2 * lonSize + 3;
const value = data[idx];
```

### Type Conversion Performance

- Reading always returns Float64Array for consistency
- Writing automatically converts to the variable's NetCDF type
- Minimal performance impact for most use cases
- Consider the precision requirements when choosing NetCDF data types