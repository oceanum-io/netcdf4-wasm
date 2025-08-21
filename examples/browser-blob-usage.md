# Browser Blob Usage Examples

This document shows how to use netcdf4-wasm with Blobs, ArrayBuffers, and other memory sources in browser environments.

## Basic Usage with Polymorphic Constructor

The `Dataset()` function now accepts multiple source types:

```javascript
import { Dataset } from 'netcdf4-wasm';

// From file path (traditional)
const dataset1 = await Dataset('data.nc', 'r');

// From Blob
const blob = new Blob([arrayBufferData], { type: 'application/x-netcdf' });
const dataset2 = await Dataset(blob, 'r');

// From ArrayBuffer  
const arrayBuffer = await response.arrayBuffer();
const dataset3 = await Dataset(arrayBuffer, 'r');

// From Uint8Array
const uint8Array = new Uint8Array(buffer);
const dataset4 = await Dataset(uint8Array, 'r');
```

## Working with File Input

```html
<input type="file" id="fileInput" accept=".nc" />
```

```javascript
import { Dataset } from 'netcdf4-wasm';

document.getElementById('fileInput').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        try {
            // Direct Blob usage
            const dataset = await Dataset(file, 'r');
            
            console.log('Dimensions:', Object.keys(dataset.dimensions));
            console.log('Variables:', Object.keys(dataset.variables));
            
            // Read some data
            const tempVar = dataset.variables.temperature;
            if (tempVar) {
                const data = await tempVar.getValue();
                console.log('Temperature data:', data);
            }
            
            await dataset.close();
        } catch (error) {
            console.error('Error reading NetCDF file:', error);
        }
    }
});
```

## Fetch and Load Remote Files

```javascript
import { Dataset } from 'netcdf4-wasm';

async function loadRemoteNetCDF(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Option 1: Use Blob
        const blob = await response.blob();
        const dataset = await Dataset(blob, 'r');
        
        // Option 2: Use ArrayBuffer
        // const arrayBuffer = await response.arrayBuffer();
        // const dataset = await Dataset(arrayBuffer, 'r');
        
        return dataset;
    } catch (error) {
        console.error('Failed to load remote NetCDF:', error);
        throw error;
    }
}

// Usage
const dataset = await loadRemoteNetCDF('https://example.com/data.nc');
console.log('File format:', dataset.file_format);
await dataset.close();
```

## Creating In-Memory Datasets

```javascript
import { Dataset } from 'netcdf4-wasm';

async function createInMemoryDataset() {
    // Create empty in-memory dataset
    const emptyBuffer = new ArrayBuffer(0);
    const dataset = await Dataset(emptyBuffer, 'w');
    
    try {
        // Add metadata
        dataset.setncattr('title', 'In-Memory Test Dataset');
        dataset.setncattr('created', new Date().toISOString());
        
        // Create dimensions
        const timeDim = await dataset.createDimension('time', 10);
        const latDim = await dataset.createDimension('latitude', 90);
        const lonDim = await dataset.createDimension('longitude', 180);
        
        // Create variables
        const tempVar = await dataset.createVariable('temperature', 'f8', ['time', 'latitude', 'longitude']);
        tempVar.units = 'K';
        tempVar.long_name = 'Air Temperature';
        
        // Generate and write data
        const dataSize = 10 * 90 * 180;
        const data = new Float64Array(dataSize);
        for (let i = 0; i < dataSize; i++) {
            data[i] = 273.15 + Math.random() * 30; // Random temperature in K
        }
        await tempVar.setValue(data);
        
        return dataset;
    } catch (error) {
        await dataset.close();
        throw error;
    }
}

// Usage
const dataset = await createInMemoryDataset();
console.log('Created dataset with variables:', Object.keys(dataset.variables));
await dataset.close();
```

## Export to Blob for Download

```javascript
import { Dataset } from 'netcdf4-wasm';

async function createAndDownloadDataset() {
    // Create dataset in memory
    const buffer = new ArrayBuffer(0);
    const dataset = await Dataset(buffer, 'w');
    
    try {
        // Add some data
        dataset.setncattr('title', 'Generated Dataset');
        await dataset.createDimension('x', 5);
        const variable = await dataset.createVariable('data', 'f8', ['x']);
        await variable.setValue(new Float64Array([1, 2, 3, 4, 5]));
        
        // Export to Blob
        const blob = await dataset.toBlob();
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'generated_data.nc';
        link.click();
        
        // Clean up
        URL.revokeObjectURL(url);
        
    } finally {
        await dataset.close();
    }
}

// Usage
await createAndDownloadDataset();
```

## Round-trip: Load, Modify, Save

```javascript
import { Dataset } from 'netcdf4-wasm';

async function modifyAndSaveDataset(originalBlob) {
    // Load existing dataset
    let dataset = await Dataset(originalBlob, 'r');
    
    // Read existing data
    const originalTemp = await dataset.variables.temperature.getValue();
    console.log('Original temperature range:', Math.min(...originalTemp), 'to', Math.max(...originalTemp));
    
    await dataset.close();
    
    // Reopen in append mode to modify
    dataset = await Dataset(originalBlob, 'a');
    
    try {
        // Add new global attribute
        dataset.setncattr('modified', new Date().toISOString());
        dataset.setncattr('modification_note', 'Temperature converted to Celsius');
        
        // Convert temperature from Kelvin to Celsius
        const tempVar = dataset.variables.temperature;
        const tempData = await tempVar.getValue();
        const celsiusData = tempData.map(temp => temp - 273.15);
        await tempVar.setValue(new Float64Array(celsiusData));
        
        // Update units
        tempVar.units = 'degC';
        
        // Export modified dataset
        const modifiedBlob = await dataset.toBlob();
        return modifiedBlob;
        
    } finally {
        await dataset.close();
    }
}

// Usage with file input
document.getElementById('fileInput').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        const modifiedBlob = await modifyAndSaveDataset(file);
        
        // Download modified file
        const url = URL.createObjectURL(modifiedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'modified_' + file.name;
        link.click();
        URL.revokeObjectURL(url);
    }
});
```

## Error Handling

```javascript
import { Dataset } from 'netcdf4-wasm';

async function safeDatasetOperation(source) {
    let dataset = null;
    
    try {
        dataset = await Dataset(source, 'r');
        
        // Check if it's a valid NetCDF file
        if (!dataset.isopen) {
            throw new Error('Failed to open dataset');
        }
        
        // Perform operations
        const variables = Object.keys(dataset.variables);
        console.log('Available variables:', variables);
        
        return variables;
        
    } catch (error) {
        if (error.message.includes('Invalid source type')) {
            console.error('Unsupported source type provided');
        } else if (error.message.includes('NetCDF')) {
            console.error('NetCDF format error:', error.message);
        } else {
            console.error('Unexpected error:', error);
        }
        throw error;
        
    } finally {
        // Always clean up
        if (dataset && dataset.isopen) {
            await dataset.close();
        }
    }
}

// Usage
try {
    await safeDatasetOperation(someBlob);
} catch (error) {
    // Handle error appropriately
    console.log('Operation failed, but cleanup completed');
}
```

## TypeScript Usage

```typescript
import { Dataset, DatasetSource, NetCDF4 } from 'netcdf4-wasm';

async function processDataset(source: DatasetSource): Promise<Float64Array> {
    const dataset: NetCDF4 = await Dataset(source, 'r');
    
    try {
        // Type-safe access to variables
        const tempVar = dataset.variables.temperature;
        if (!tempVar) {
            throw new Error('Temperature variable not found');
        }
        
        const data: Float64Array = await tempVar.getValue();
        return data;
        
    } finally {
        await dataset.close();
    }
}

// Can accept any supported source type
const data1 = await processDataset('file.nc');
const data2 = await processDataset(blob);
const data3 = await processDataset(arrayBuffer);
const data4 = await processDataset(uint8Array);
```

## Performance Considerations

- **Large files**: For large files, consider using streaming or chunked processing
- **Memory usage**: In-memory datasets use browser memory; monitor usage for large datasets
- **Blob creation**: Creating Blobs from large ArrayBuffers is efficient as it doesn't copy data
- **File format**: Use appropriate NetCDF format (NetCDF4 for compression, NetCDF3 for compatibility)

```javascript
// Efficient handling of large files
async function processLargeDataset(blob) {
    const dataset = await Dataset(blob, 'r');
    
    try {
        // Process variables one at a time to manage memory
        for (const varName of Object.keys(dataset.variables)) {
            const variable = dataset.variables[varName];
            console.log(`Processing ${varName}...`);
            
            // Process data in chunks if needed
            const data = await variable.getValue();
            
            // Do something with data
            console.log(`${varName}: ${data.length} values`);
            
            // Allow garbage collection
            // (data will be cleaned up when out of scope)
        }
        
    } finally {
        await dataset.close();
    }
}
```