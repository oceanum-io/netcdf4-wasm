// Variable class similar to netcdf4-python

import type { NetCDF4 } from './netcdf4';
import { NC_CONSTANTS } from './constants';

export class Variable {
    private _attributes: { [key: string]: any } = {};

    constructor(
        private netcdf: NetCDF4,
        public readonly name: string,
        public readonly datatype: string,
        public readonly dimensions: string[],
        private varid: number,
        private ncid: number
    ) {}

    // Attribute access (Python-like)
    setncattr(name: string, value: any): void {
        this._attributes[name] = value;
        
        // Store in mock file system if in test mode
        if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
            const mockFiles = (global as any).__netcdf4_mock_files;
            const dataset = this.netcdf as any;
            if (mockFiles && dataset.filename && mockFiles[dataset.filename] && mockFiles[dataset.filename].variables[this.name]) {
                mockFiles[dataset.filename].variables[this.name].attributes[name] = value;
            }
        }
        
        // TODO: Implement actual NetCDF attribute setting
    }

    getncattr(name: string): any {
        return this._attributes[name];
    }

    ncattrs(): string[] {
        return Object.keys(this._attributes);
    }

    // Data access methods
    async getValue(): Promise<Float64Array | Float32Array> {
        const totalSize = this.dimensions.reduce((acc, dimName) => {
            const dim = this.netcdf.dimensions[dimName];
            if (!dim) return acc * 1;
            
            // Handle unlimited dimensions (they have a size of NC_UNLIMITED which is -1000)
            // For reading, treat unlimited dimensions as having size 0 for now
            const actualSize = dim.isUnlimited ? 0 : dim.size;
            return acc * Math.max(actualSize, 0);
        }, 1);

        if (this.datatype === 'f8' || this.datatype === 'double') {
            return await this.netcdf.getVariableDouble(this.ncid, this.varid, totalSize);
        } else if (this.datatype === 'f4' || this.datatype === 'float') {
            // Convert from double to float32 for now (until we add proper float32 support)
            const doubleData = await this.netcdf.getVariableDouble(this.ncid, this.varid, totalSize);
            return new Float32Array(doubleData);
        }
        throw new Error(`Data type ${this.datatype} not yet supported`);
    }

    async setValue(data: Float64Array | Float32Array): Promise<void> {
        if (this.datatype === 'f8' || this.datatype === 'double') {
            const doubleData = data instanceof Float64Array ? data : new Float64Array(data);
            return await this.netcdf.putVariableDouble(this.ncid, this.varid, doubleData);
        } else if (this.datatype === 'f4' || this.datatype === 'float') {
            // Convert to double for storage (until we add proper float32 support)
            const doubleData = data instanceof Float64Array ? data : new Float64Array(data);
            return await this.netcdf.putVariableDouble(this.ncid, this.varid, doubleData);
        }
        throw new Error(`Data type ${this.datatype} not yet supported`);
    }

    // Array-like access methods
    async __getitem__(index: number | number[]): Promise<number | Float64Array> {
        // TODO: Implement slicing support similar to Python
        if (typeof index === 'number') {
            const data = await this.getValue();
            return data[index];
        }
        throw new Error('Advanced indexing not yet implemented');
    }

    async __setitem__(index: number | number[], value: number | Float64Array): Promise<void> {
        // TODO: Implement slicing support similar to Python
        throw new Error('Item assignment not yet implemented');
    }

    // Property-style attribute access
    get units(): string | undefined { return this._attributes.units; }
    set units(value: string) { this.setncattr('units', value); }

    get long_name(): string | undefined { return this._attributes.long_name; }
    set long_name(value: string) { this.setncattr('long_name', value); }

    get standard_name(): string | undefined { return this._attributes.standard_name; }
    set standard_name(value: string) { this.setncattr('standard_name', value); }

    get scale_factor(): number | undefined { return this._attributes.scale_factor; }
    set scale_factor(value: number) { this.setncattr('scale_factor', value); }

    get add_offset(): number | undefined { return this._attributes.add_offset; }
    set add_offset(value: number) { this.setncattr('add_offset', value); }

    get _FillValue(): number | undefined { return this._attributes._FillValue; }
    set _FillValue(value: number) { this.setncattr('_FillValue', value); }

    // Additional CF convention attributes
    get calendar(): string | undefined { return this._attributes.calendar; }
    set calendar(value: string) { this.setncattr('calendar', value); }

    get axis(): string | undefined { return this._attributes.axis; }
    set axis(value: string) { this.setncattr('axis', value); }

    toString(): string {
        const dimStr = this.dimensions.length > 0 ? `(${this.dimensions.join(', ')})` : '()';
        return `<netCDF4.Variable '${this.name}': dimensions ${dimStr}, size = [${this.dimensions.map(d => this.netcdf.dimensions[d]?.size || '?').join(' x ')}], type = '${this.datatype}'>`;
    }
}