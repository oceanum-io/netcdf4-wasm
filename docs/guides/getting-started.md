---
layout: page
title: Getting Started
---

# Getting Started with netcdf4-wasm

This guide will help you get up and running with netcdf4-wasm in just a few minutes.

## Installation

### NPM/Yarn

```bash
# Using npm
npm install netcdf4-wasm

# Using yarn
yarn add netcdf4-wasm
```

### CDN (Browser)

```html
<!-- Include via CDN -->
<script src="https://unpkg.com/netcdf4-wasm@latest/dist/netcdf4.js"></script>
```

## Basic Concepts

NetCDF (Network Common Data Form) is a format designed for scientific data. Understanding these key concepts will help you work effectively with netcdf4-wasm:

### Datasets
A NetCDF dataset is like a container that holds:
- **Dimensions**: Define the size of data arrays (e.g., time=100, latitude=180)
- **Variables**: Multidimensional data arrays (e.g., temperature, pressure)
- **Attributes**: Metadata describing the data (e.g., units, descriptions)
- **Groups**: Hierarchical organization (NetCDF4 only)

### Example Structure
```
Dataset: weather_data.nc
├── Dimensions:
│   ├── time (unlimited)
│   ├── latitude (180)
│   └── longitude (360)
├── Variables:
│   ├── temperature [time, latitude, longitude]
│   ├── pressure [time, latitude, longitude]
│   └── time [time]
└── Global Attributes:
    ├── title: "Global Weather Data"
    └── institution: "Weather Service"
```

## Your First NetCDF File

### Reading an Existing File

```javascript
import { Dataset } from 'netcdf4-wasm';

async function readNetCDFFile() {
    // Open file for reading
    const dataset = await Dataset('weather_data.nc', 'r');
    
    try {
        // Explore the file structure
        console.log('Dimensions:', Object.keys(dataset.dimensions));
        console.log('Variables:', Object.keys(dataset.variables));
        
        // Access a variable
        const temperature = dataset.variables.temperature;
        console.log('Temperature dimensions:', temperature.dimensions);
        console.log('Temperature units:', temperature.units);
        
        // Read the data
        const tempData = await temperature.getValue();
        console.log('Temperature data length:', tempData.length);
        console.log('First 5 values:', tempData.slice(0, 5));
        
        // Read global attributes
        console.log('Title:', dataset.getncattr('title'));
        
    } finally {
        // Always close the dataset
        await dataset.close();
    }
}

readNetCDFFile().catch(console.error);
```

### Creating a New File

```javascript
import { Dataset } from 'netcdf4-wasm';

async function createNetCDFFile() {
    // Create new file
    const dataset = await Dataset('my_data.nc', 'w', { format: 'NETCDF4' });
    
    try {
        // Set global attributes
        dataset.setncattr('title', 'My First NetCDF File');
        dataset.setncattr('created', new Date().toISOString());
        
        // Create dimensions
        const timeDim = await dataset.createDimension('time', 10);
        const locationDim = await dataset.createDimension('location', 5);
        
        // Create variables
        const temperature = await dataset.createVariable('temperature', 'f8', ['time', 'location']);
        const time = await dataset.createVariable('time', 'f8', ['time']);
        
        // Set variable attributes
        temperature.units = 'degrees_Celsius';
        temperature.long_name = 'Air Temperature';
        time.units = 'hours since 2023-01-01 00:00:00';
        
        // Create some sample data
        const tempData = new Float64Array(10 * 5); // 10 times × 5 locations
        const timeData = new Float64Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        
        // Fill temperature data with realistic values
        for (let t = 0; t < 10; t++) {
            for (let loc = 0; loc < 5; loc++) {
                const index = t * 5 + loc;
                // Temperature varies by time and location
                tempData[index] = 20 + Math.sin(t * 0.5) * 10 + loc * 2;
            }
        }
        
        // Write data to variables
        await temperature.setValue(tempData);
        await time.setValue(timeData);
        
        console.log('NetCDF file created successfully!');
        
    } finally {
        await dataset.close();
    }
}

createNetCDFFile().catch(console.error);
```

## Working with Different Sources

### File System (Node.js)

```javascript
import { Dataset } from 'netcdf4-wasm';

// Read from local file system
const dataset = await Dataset('/path/to/data.nc', 'r');
```

### Browser File Input

```html
<input type="file" id="netcdfFile" accept=".nc" />
<script>
document.getElementById('netcdfFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        // File is a Blob - can be used directly
        const dataset = await Dataset(file, 'r');
        
        // Process the file...
        console.log('Variables:', Object.keys(dataset.variables));
        
        await dataset.close();
    }
});
</script>
```

### Remote Files (Fetch)

```javascript
async function loadRemoteFile() {
    const response = await fetch('https://example.com/data.nc');
    const arrayBuffer = await response.arrayBuffer();
    
    const dataset = await Dataset(arrayBuffer, 'r');
    
    // Process remote data...
    
    await dataset.close();
}
```

### In-Memory Data

```javascript
// Create dataset entirely in memory
const dataset = await Dataset(new ArrayBuffer(0), 'w');

// ... add dimensions, variables, data ...

// Export as blob for download
const blob = await dataset.toBlob();
const url = URL.createObjectURL(blob);

// Create download link
const link = document.createElement('a');
link.href = url;
link.download = 'generated_data.nc';
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url);

await dataset.close();
```

## Common Patterns

### Error Handling

```javascript
async function safeNetCDFOperation() {
    let dataset = null;
    
    try {
        dataset = await Dataset('data.nc', 'r');
        
        // Your operations here...
        const data = await dataset.variables.temperature.getValue();
        
        return data;
        
    } catch (error) {
        console.error('NetCDF operation failed:', error.message);
        throw error;
        
    } finally {
        // Always clean up resources
        if (dataset && dataset.isopen) {
            await dataset.close();
        }
    }
}
```

### Exploring Unknown Files

```javascript
async function exploreNetCDFFile(source) {
    const dataset = await Dataset(source, 'r');
    
    try {
        console.log('=== File Information ===');
        console.log('Format:', dataset.file_format);
        console.log('Global attributes:', dataset.ncattrs());
        
        console.log('\n=== Dimensions ===');
        for (const [name, dim] of Object.entries(dataset.dimensions)) {
            console.log(`${name}: ${dim.size}${dim.isUnlimited ? ' (unlimited)' : ''}`);
        }
        
        console.log('\n=== Variables ===');
        for (const [name, variable] of Object.entries(dataset.variables)) {
            console.log(`${name}:`);
            console.log(`  Type: ${variable.datatype}`);
            console.log(`  Dimensions: [${variable.dimensions.join(', ')}]`);
            console.log(`  Shape: [${variable.shape.join(', ')}]`);
            
            // Common attributes
            if (variable.units) console.log(`  Units: ${variable.units}`);
            if (variable.long_name) console.log(`  Description: ${variable.long_name}`);
        }
        
    } finally {
        await dataset.close();
    }
}
```

### Data Processing Pipeline

```javascript
async function processTemperatureData(inputSource) {
    const input = await Dataset(inputSource, 'r');
    const output = await Dataset(new ArrayBuffer(0), 'w');
    
    try {
        // Copy structure
        for (const [name, dim] of Object.entries(input.dimensions)) {
            await output.createDimension(name, dim.isUnlimited ? null : dim.size);
        }
        
        // Process temperature variable
        if (input.variables.temperature) {
            const inputTemp = input.variables.temperature;
            const outputTemp = await output.createVariable(
                'temperature_celsius', 
                'f4', 
                inputTemp.dimensions
            );
            
            // Convert Kelvin to Celsius
            const tempK = await inputTemp.getValue();
            const tempC = tempK.map(t => t - 273.15);
            
            await outputTemp.setValue(new Float64Array(tempC));
            
            // Update metadata
            outputTemp.units = 'degrees_Celsius';
            outputTemp.long_name = 'Air Temperature in Celsius';
            outputTemp.setncattr('conversion', 'Converted from Kelvin');
        }
        
        // Export processed data
        return await output.toBlob();
        
    } finally {
        await input.close();
        await output.close();
    }
}
```

## Next Steps

Now that you've mastered the basics, explore these topics:

1. **[File Operations](file-operations.html)** - Advanced file handling techniques
2. **[Variables](variables.html)** - Working with multidimensional data
3. **[Browser Integration](browser-integration.html)** - Building web applications
4. **[Examples](../examples/)** - Real-world use cases and patterns

## TypeScript Support

netcdf4-wasm includes full TypeScript definitions:

```typescript
import { Dataset, NetCDF4, Variable, Dimension } from 'netcdf4-wasm';

async function typedExample() {
    const dataset: NetCDF4 = await Dataset('data.nc', 'r');
    const variable: Variable = dataset.variables.temperature;
    const dimension: Dimension = dataset.dimensions.time;
    
    const data: Float64Array = await variable.getValue();
    
    await dataset.close();
}
```

## Troubleshooting

### Common Issues

**"NetCDF4Module not found"**
- Make sure the WASM files are properly loaded
- Check network connectivity for CDN usage
- Verify build process completed successfully

**"Failed to open NetCDF file"**
- Verify file exists and is accessible
- Check file permissions
- Ensure file is valid NetCDF format

**Memory errors**
- Large files may exceed browser memory limits
- Consider processing data in chunks
- Use appropriate data types to minimize memory usage

### Getting Help

- Check the [API documentation](../api/)
- Browse [examples](../examples/) for similar use cases
- Open an issue on [GitHub](https://github.com/yourusername/netcdf4-wasm/issues)

---

**Ready to build something amazing?** Check out our [examples](../examples/) for inspiration and complete code samples.