---
layout: page
title: Browser File Handling
---

# Browser File Handling with netcdf4-wasm

Learn how to handle NetCDF files in web browsers, including file inputs, drag-and-drop, and download functionality.

## Basic File Input

The simplest way to work with NetCDF files in the browser is through HTML file input elements.

### HTML File Input

```html
<!DOCTYPE html>
<html>
<head>
    <title>NetCDF File Reader</title>
    <style>
        .file-input-area {
            border: 2px dashed #ccc;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
        }
        .file-info {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
        }
        .variable-list {
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid #ddd;
            padding: 10px;
        }
    </style>
</head>
<body>
    <h1>NetCDF File Explorer</h1>
    
    <div class="file-input-area">
        <input type="file" id="netcdfFile" accept=".nc,.netcdf" />
        <p>Choose a NetCDF file to explore</p>
    </div>
    
    <div id="fileInfo" style="display: none;">
        <h2>File Information</h2>
        <div class="file-info">
            <p><strong>Filename:</strong> <span id="filename"></span></p>
            <p><strong>File Size:</strong> <span id="filesize"></span></p>
            <p><strong>Format:</strong> <span id="format"></span></p>
        </div>
        
        <h3>Dimensions</h3>
        <div id="dimensions" class="variable-list"></div>
        
        <h3>Variables</h3>
        <div id="variables" class="variable-list"></div>
        
        <h3>Global Attributes</h3>
        <div id="attributes" class="variable-list"></div>
    </div>

    <script type="module">
        import { Dataset } from 'netcdf4-wasm';

        document.getElementById('netcdfFile').addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (file) {
                await processNetCDFFile(file);
            }
        });

        async function processNetCDFFile(file) {
            try {
                // Show loading state
                document.getElementById('fileInfo').style.display = 'block';
                document.getElementById('filename').textContent = 'Loading...';
                
                // Open the NetCDF file
                const dataset = await Dataset(file, 'r');
                
                // Display file information
                document.getElementById('filename').textContent = file.name;
                document.getElementById('filesize').textContent = formatFileSize(file.size);
                document.getElementById('format').textContent = dataset.file_format;
                
                // Display dimensions
                displayDimensions(dataset.dimensions);
                
                // Display variables
                await displayVariables(dataset.variables);
                
                // Display global attributes
                displayAttributes(dataset, 'attributes');
                
                await dataset.close();
                
            } catch (error) {
                alert(`Error reading NetCDF file: ${error.message}`);
                console.error(error);
            }
        }

        function formatFileSize(bytes) {
            const sizes = ['B', 'KB', 'MB', 'GB'];
            if (bytes === 0) return '0 B';
            const i = Math.floor(Math.log(bytes) / Math.log(1024));
            return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
        }

        function displayDimensions(dimensions) {
            const container = document.getElementById('dimensions');
            container.innerHTML = '';
            
            for (const [name, dim] of Object.entries(dimensions)) {
                const div = document.createElement('div');
                div.innerHTML = `<strong>${name}:</strong> ${dim.size}${dim.isUnlimited ? ' (unlimited)' : ''}`;
                container.appendChild(div);
            }
        }

        async function displayVariables(variables) {
            const container = document.getElementById('variables');
            container.innerHTML = '';
            
            for (const [name, variable] of Object.entries(variables)) {
                const div = document.createElement('div');
                div.style.marginBottom = '10px';
                
                let html = `<strong>${name}</strong> (${variable.datatype})<br>`;
                html += `&nbsp;&nbsp;Dimensions: [${variable.dimensions.join(', ')}]<br>`;
                html += `&nbsp;&nbsp;Shape: [${variable.shape.join(', ')}]<br>`;
                
                if (variable.units) {
                    html += `&nbsp;&nbsp;Units: ${variable.units}<br>`;
                }
                if (variable.long_name) {
                    html += `&nbsp;&nbsp;Description: ${variable.long_name}<br>`;
                }
                
                // Add data preview for small variables
                if (variable.size <= 100) {
                    try {
                        const data = await variable.getValue();
                        const preview = data.length <= 10 ? 
                            Array.from(data).map(v => v.toFixed(2)).join(', ') :
                            Array.from(data.slice(0, 5)).map(v => v.toFixed(2)).join(', ') + '...';
                        html += `&nbsp;&nbsp;Data: [${preview}]<br>`;
                    } catch (e) {
                        html += `&nbsp;&nbsp;Data: (error reading)<br>`;
                    }
                }
                
                div.innerHTML = html;
                container.appendChild(div);
            }
        }

        function displayAttributes(dataset, containerId) {
            const container = document.getElementById(containerId);
            container.innerHTML = '';
            
            const attrs = dataset.attrs();
            for (const attr of attrs) {
                const div = document.createElement('div');
                const value = dataset.getAttr(attr);
                div.innerHTML = `<strong>${attr}:</strong> ${value}`;
                container.appendChild(div);
            }
        }
    </script>
</body>
</html>
```

## Drag and Drop Interface

Create a more user-friendly interface with drag-and-drop functionality:

```html
<!DOCTYPE html>
<html>
<head>
    <title>NetCDF Drag & Drop</title>
    <style>
        .drop-zone {
            border: 3px dashed #ccc;
            border-radius: 10px;
            padding: 50px;
            text-align: center;
            margin: 20px;
            transition: border-color 0.3s ease;
            cursor: pointer;
        }
        .drop-zone.dragover {
            border-color: #007bff;
            background-color: #f8f9fa;
        }
        .file-list {
            margin: 20px;
        }
        .file-item {
            background: white;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 15px;
            margin: 10px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .file-item h3 {
            margin: 0 0 10px 0;
            color: #333;
        }
        .download-btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
        }
        .download-btn:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <h1>NetCDF File Processor</h1>
    
    <div class="drop-zone" id="dropZone">
        <p>Drop NetCDF files here or click to select</p>
        <input type="file" id="fileInput" multiple accept=".nc,.netcdf" style="display: none;">
    </div>
    
    <div class="file-list" id="fileList"></div>

    <script type="module">
        import { Dataset } from 'netcdf4-wasm';

        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const fileList = document.getElementById('fileList');

        // Click to select files
        dropZone.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (event) => {
            handleFiles(Array.from(event.target.files));
        });

        // Drag and drop handlers
        dropZone.addEventListener('dragover', (event) => {
            event.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (event) => {
            event.preventDefault();
            dropZone.classList.remove('dragover');
            
            const files = Array.from(event.dataTransfer.files)
                .filter(file => file.name.endsWith('.nc') || file.name.endsWith('.netcdf'));
            
            if (files.length > 0) {
                handleFiles(files);
            } else {
                alert('Please drop NetCDF files (.nc or .netcdf)');
            }
        });

        async function handleFiles(files) {
            for (const file of files) {
                await processFile(file);
            }
        }

        async function processFile(file) {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <h3>${file.name}</h3>
                <p>Processing...</p>
            `;
            fileList.appendChild(fileItem);

            try {
                const dataset = await Dataset(file, 'r');
                
                // Extract file information
                const info = {
                    format: dataset.file_format,
                    dimensions: Object.keys(dataset.dimensions).length,
                    variables: Object.keys(dataset.variables).length,
                    size: file.size
                };

                // Get variable summary
                const variables = [];
                for (const [name, variable] of Object.entries(dataset.variables)) {
                    variables.push({
                        name,
                        type: variable.datatype,
                        dimensions: variable.dimensions,
                        shape: variable.shape,
                        units: variable.units || 'no units',
                        description: variable.long_name || 'no description'
                    });
                }

                await dataset.close();

                // Create enhanced info display
                fileItem.innerHTML = createFileInfoHTML(file, info, variables);

            } catch (error) {
                fileItem.innerHTML = `
                    <h3>${file.name}</h3>
                    <p style="color: red;">Error: ${error.message}</p>
                `;
            }
        }

        function createFileInfoHTML(file, info, variables) {
            const variableList = variables.map(v => `
                <li>
                    <strong>${v.name}</strong> (${v.type}): 
                    [${v.shape.join('×')}] ${v.units}
                    ${v.description !== 'no description' ? `<br>&nbsp;&nbsp;<em>${v.description}</em>` : ''}
                </li>
            `).join('');

            return `
                <h3>${file.name}</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <h4>File Info</h4>
                        <ul>
                            <li><strong>Format:</strong> ${info.format}</li>
                            <li><strong>Size:</strong> ${formatFileSize(info.size)}</li>
                            <li><strong>Dimensions:</strong> ${info.dimensions}</li>
                            <li><strong>Variables:</strong> ${info.variables}</li>
                        </ul>
                        <button class="download-btn" onclick="convertToCSV('${file.name}')">
                            Convert to CSV
                        </button>
                    </div>
                    <div>
                        <h4>Variables</h4>
                        <ul style="font-size: 14px; max-height: 200px; overflow-y: auto;">
                            ${variableList}
                        </ul>
                    </div>
                </div>
            `;
        }

        function formatFileSize(bytes) {
            const sizes = ['B', 'KB', 'MB', 'GB'];
            if (bytes === 0) return '0 B';
            const i = Math.floor(Math.log(bytes) / Math.log(1024));
            return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
        }

        // Global function for CSV conversion
        window.convertToCSV = async function(filename) {
            // Find the original file (this is a simplified example)
            // In a real app, you'd store file references
            alert(`CSV conversion for ${filename} would be implemented here`);
        };
    </script>
</body>
</html>
```

## File Downloads and Export

Create downloadable files from processed NetCDF data:

```javascript
import { Dataset } from 'netcdf4-wasm';

class NetCDFProcessor {
    constructor() {
        this.datasets = new Map();
    }

    async loadFile(file) {
        const dataset = await Dataset(file, 'r');
        this.datasets.set(file.name, dataset);
        return dataset;
    }

    async exportAsNetCDF(dataset, filename) {
        // Export existing dataset as blob
        const blob = await dataset.toBlob();
        this.downloadBlob(blob, filename || 'export.nc');
    }

    async createAndExportCSV(dataset, variableName, filename) {
        const variable = dataset.variables[variableName];
        if (!variable) {
            throw new Error(`Variable ${variableName} not found`);
        }

        const data = await variable.getValue();
        
        // Convert to CSV format
        let csv = `# Variable: ${variableName}\n`;
        csv += `# Units: ${variable.units || 'unknown'}\n`;
        csv += `# Shape: [${variable.shape.join(', ')}]\n`;
        csv += `# Dimensions: [${variable.dimensions.join(', ')}]\n`;
        csv += `Index,Value\n`;
        
        data.forEach((value, index) => {
            csv += `${index},${value}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        this.downloadBlob(blob, filename || `${variableName}.csv`);
    }

    async createModifiedDataset(originalDataset, modifications) {
        // Create new dataset with modifications
        const newDataset = await Dataset(new ArrayBuffer(0), 'w');
        
        try {
            // Copy global attributes
            const attrs = originalDataset.attrs();
            attrs.forEach(attr => {
                newDataset.setAttr(attr, originalDataset.getAttr(attr));
            });
            
            // Add modification history
            newDataset.setAttr('modification_history', 
                `Modified on ${new Date().toISOString()}`);
            
            // Copy dimensions
            for (const [name, dim] of Object.entries(originalDataset.dimensions)) {
                await newDataset.createDimension(name, dim.isUnlimited ? null : dim.size);
            }
            
            // Copy and modify variables
            for (const [name, variable] of Object.entries(originalDataset.variables)) {
                const newVar = await newDataset.createVariable(
                    name, 
                    variable.datatype, 
                    variable.dimensions
                );
                
                // Copy attributes
                const varAttrs = variable.attrs();
                varAttrs.forEach(attr => {
                    newVar.setAttr(attr, variable.getAttr(attr));
                });
                
                // Apply modifications
                let data = await variable.getValue();
                if (modifications[name]) {
                    data = modifications[name](data);
                }
                
                await newVar.setValue(data);
            }
            
            return newDataset;
            
        } catch (error) {
            await newDataset.close();
            throw error;
        }
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    async close() {
        for (const dataset of this.datasets.values()) {
            await dataset.close();
        }
        this.datasets.clear();
    }
}

// Example usage
const processor = new NetCDFProcessor();

// Process temperature data
document.getElementById('processTemp').addEventListener('click', async () => {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (file) {
        try {
            const dataset = await processor.loadFile(file);
            
            // Create modified version with temperature converted to Celsius
            const modifiedDataset = await processor.createModifiedDataset(dataset, {
                temperature: (data) => {
                    // Convert Kelvin to Celsius
                    return data.map(temp => temp - 273.15);
                }
            });
            
            // Update units
            if (modifiedDataset.variables.temperature) {
                modifiedDataset.variables.temperature.units = 'degrees_Celsius';
            }
            
            // Export modified dataset
            await processor.exportAsNetCDF(modifiedDataset, 'temperature_celsius.nc');
            
            await modifiedDataset.close();
            
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }
});
```

## Progress Indicators

For large files, show progress to users:

```javascript
class ProgressTracker {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.tasks = new Map();
    }

    startTask(taskId, description) {
        const progressDiv = document.createElement('div');
        progressDiv.innerHTML = `
            <div style="margin: 10px 0;">
                <div>${description}</div>
                <div style="background: #f0f0f0; border-radius: 10px; overflow: hidden;">
                    <div id="${taskId}-bar" style="background: #007bff; height: 20px; width: 0%; transition: width 0.3s;"></div>
                </div>
                <div id="${taskId}-status">Starting...</div>
            </div>
        `;
        
        this.container.appendChild(progressDiv);
        this.tasks.set(taskId, { div: progressDiv, bar: progressDiv.querySelector(`#${taskId}-bar`), status: progressDiv.querySelector(`#${taskId}-status`) });
    }

    updateTask(taskId, progress, status) {
        const task = this.tasks.get(taskId);
        if (task) {
            task.bar.style.width = `${progress}%`;
            task.status.textContent = status;
        }
    }

    completeTask(taskId, finalStatus) {
        const task = this.tasks.get(taskId);
        if (task) {
            task.bar.style.width = '100%';
            task.bar.style.background = '#28a745';
            task.status.textContent = finalStatus || 'Complete';
            
            // Remove after delay
            setTimeout(() => {
                task.div.remove();
                this.tasks.delete(taskId);
            }, 3000);
        }
    }

    errorTask(taskId, errorMessage) {
        const task = this.tasks.get(taskId);
        if (task) {
            task.bar.style.background = '#dc3545';
            task.status.textContent = `Error: ${errorMessage}`;
        }
    }
}

// Usage with large file processing
async function processLargeFile(file, progressTracker) {
    const taskId = `process-${Date.now()}`;
    progressTracker.startTask(taskId, `Processing ${file.name}`);
    
    try {
        progressTracker.updateTask(taskId, 10, 'Opening file...');
        const dataset = await Dataset(file, 'r');
        
        progressTracker.updateTask(taskId, 30, 'Reading structure...');
        const variables = Object.keys(dataset.variables);
        
        progressTracker.updateTask(taskId, 50, 'Processing variables...');
        const results = {};
        
        for (let i = 0; i < variables.length; i++) {
            const varName = variables[i];
            const progress = 50 + (i / variables.length) * 40;
            progressTracker.updateTask(taskId, progress, `Processing ${varName}...`);
            
            const data = await dataset.variables[varName].getValue();
            results[varName] = {
                min: Math.min(...data),
                max: Math.max(...data),
                mean: data.reduce((a, b) => a + b) / data.length
            };
        }
        
        progressTracker.updateTask(taskId, 95, 'Finalizing...');
        await dataset.close();
        
        progressTracker.completeTask(taskId, 'Processing complete');
        return results;
        
    } catch (error) {
        progressTracker.errorTask(taskId, error.message);
        throw error;
    }
}
```

## Best Practices

### Memory Management

```javascript
// Always close datasets
async function safeProcessing(file) {
    let dataset = null;
    try {
        dataset = await Dataset(file, 'r');
        // ... processing
    } finally {
        if (dataset) await dataset.close();
    }
}

// For multiple files, process sequentially to manage memory
async function processMultipleFiles(files) {
    for (const file of files) {
        await safeProcessing(file);
        // Each file is closed before processing the next
    }
}
```

### Error Handling

```javascript
async function robustFileHandler(file) {
    // Validate file
    if (!file.name.match(/\.(nc|netcdf)$/i)) {
        throw new Error('Invalid file type. Please select a NetCDF file.');
    }
    
    if (file.size > 100 * 1024 * 1024) { // 100MB limit
        throw new Error('File too large. Please select a file smaller than 100MB.');
    }
    
    try {
        const dataset = await Dataset(file, 'r');
        
        // Validate NetCDF structure
        if (Object.keys(dataset.variables).length === 0) {
            throw new Error('No variables found in NetCDF file.');
        }
        
        return dataset;
        
    } catch (error) {
        if (error.message.includes('NetCDF')) {
            throw new Error('Invalid or corrupted NetCDF file.');
        }
        throw error;
    }
}
```

### Performance Optimization

```javascript
// Use Web Workers for heavy processing
class NetCDFWorkerProcessor {
    constructor() {
        this.worker = new Worker('netcdf-worker.js');
        this.taskId = 0;
        this.pendingTasks = new Map();
    }

    async processInWorker(file) {
        return new Promise((resolve, reject) => {
            const taskId = ++this.taskId;
            this.pendingTasks.set(taskId, { resolve, reject });
            
            // Transfer file to worker
            this.worker.postMessage({
                taskId,
                type: 'process',
                file
            });
        });
    }
}

// In netcdf-worker.js:
// importScripts('netcdf4-wasm.js');
// 
// self.onmessage = async function(e) {
//     const { taskId, type, file } = e.data;
//     
//     try {
//         if (type === 'process') {
//             const dataset = await Dataset(file, 'r');
//             // ... processing
//             await dataset.close();
//             
//             self.postMessage({
//                 taskId,
//                 success: true,
//                 result: processedData
//             });
//         }
//     } catch (error) {
//         self.postMessage({
//             taskId,
//             success: false,
//             error: error.message
//         });
//     }
// };
```

This comprehensive guide covers all aspects of handling NetCDF files in browser environments, from basic file inputs to advanced processing workflows with progress tracking and error handling.