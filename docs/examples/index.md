---
layout: page
title: Examples
---

# Examples

Practical examples demonstrating netcdf4-wasm capabilities in real-world scenarios.

## Basic Operations

- **File I/O Basics** *(coming soon)* - Opening, reading, and writing NetCDF files
- **Creating Datasets** *(coming soon)* - Building NetCDF files from scratch
- **Reading Data** *(coming soon)* - Accessing variables and metadata
- **Data Manipulation** *(coming soon)* - Processing and transforming data

## Browser Integration

- [**File Input Handling**](browser-files) - Working with HTML file inputs
- **Fetch and Load** *(coming soon)* - Loading remote NetCDF files
- **Download and Export** *(coming soon)* - Exporting data as files
- **Drag and Drop** *(coming soon)* - Advanced file handling

## Data Visualization

- **Plotting with Chart.js** *(coming soon)* - Creating interactive charts
- **Leaflet Maps** *(coming soon)* - Geospatial data visualization
- **D3.js Integration** *(coming soon)* - Custom visualizations
- **Three.js 3D Plots** *(coming soon)* - 3D data visualization

## Scientific Applications

- **Climate Data Processing** *(coming soon)* - Working with meteorological data
- **Time Series Analysis** *(coming soon)* - Temporal data patterns
- **Geospatial Analysis** *(coming soon)* - Geographic data processing
- **Statistical Analysis** *(coming soon)* - Data statistics and aggregation

## Advanced Workflows

- **Data Pipeline** *(coming soon)* - Processing workflows
- **Real-time Data** *(coming soon)* - Live data streaming
- **Batch Processing** *(coming soon)* - Multiple file operations
- **Performance Optimization** *(coming soon)* - Efficient data handling

## Integration Examples

- **React Components** *(coming soon)* - React.js integration
- **Vue.js Application** *(coming soon)* - Vue.js framework
- **Node.js Server** *(coming soon)* - Server-side processing
- **Electron App** *(coming soon)* - Desktop application

---

## Quick Start Examples

### Basic File Reading

```javascript
import { Dataset } from 'netcdf4-wasm';

// Read from file
const dataset = await Dataset('temperature.nc', 'r');
console.log('Variables:', Object.keys(dataset.variables));

const temp = dataset.variables.temperature;
const data = await temp.getValue();
console.log(`Temperature range: ${Math.min(...data)} to ${Math.max(...data)} ${temp.units}`);

await dataset.close();
```

### Browser File Input

```html
<input type="file" id="fileInput" accept=".nc" />
```

```javascript
document.getElementById('fileInput').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        const dataset = await Dataset(file, 'r');
        
        // Process the dataset
        const variables = Object.keys(dataset.variables);
        console.log('Found variables:', variables);
        
        await dataset.close();
    }
});
```

### Creating and Downloading Data

```javascript
// Create dataset in memory
const dataset = await Dataset(new ArrayBuffer(0), 'w');

await dataset.createDimension('time', 12);
const temp = await dataset.createVariable('temperature', 'f4', ['time']);

// Add data
const monthlyTemps = new Float64Array([5, 8, 15, 20, 25, 30, 32, 30, 25, 18, 10, 6]);
await temp.setValue(monthlyTemps);

// Export and download
const blob = await dataset.toBlob();
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'temperature_data.nc';
link.click();
URL.revokeObjectURL(url);

await dataset.close();
```

### Fetch Remote Data

```javascript
async function loadRemoteData(url) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        
        const dataset = await Dataset(blob, 'r');
        
        // Process remote data
        return dataset;
    } catch (error) {
        console.error('Failed to load remote NetCDF:', error);
        throw error;
    }
}

const dataset = await loadRemoteData('https://example.com/ocean_temperature.nc');
```

## Example Categories

### 🔰 Beginner
Perfect for getting started with netcdf4-wasm:
- Basic file operations
- Simple data reading
- Creating small datasets

### 🔸 Intermediate  
Building more complex applications:
- Browser integration
- Data visualization
- Processing workflows

### 🔶 Advanced
Complex scenarios and optimizations:
- Performance tuning
- Large dataset handling
- Custom integrations

### 🏢 Production
Real-world application examples:
- Complete applications
- Error handling
- Security considerations

---

## Live Demos

Many examples include live, runnable demonstrations that you can try in your browser:

- **Interactive File Explorer** - Upload and explore NetCDF files
- **Climate Visualization** - Real climate data visualization
- **Data Creation Tool** - Build custom NetCDF datasets
- **Format Converter** - Convert between data formats

---

**Note**: All examples are available in the [GitHub repository](https://github.com/oceanum-io/netcdf4-wasm/tree/main/examples) with complete source code and setup instructions.