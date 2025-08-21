// NetCDF4 constants (populated from NetCDF4 headers)

export const NC_CONSTANTS = {
    // Error codes
    NC_NOERR: 0,
    
    // File modes
    NC_NOWRITE: 0,
    NC_WRITE: 1,
    NC_CLOBBER: 0,
    NC_NOCLOBBER: 4,
    NC_NETCDF4: 4096,
    
    // Data types
    NC_BYTE: 1,
    NC_CHAR: 2,
    NC_SHORT: 3,
    NC_INT: 4,
    NC_FLOAT: 5,
    NC_DOUBLE: 6,
    
    // Special values
    NC_UNLIMITED: -1000, // Use special value to distinguish from 0
    NC_GLOBAL: -1,
};

// Data type mapping from string names to NetCDF constants
export const DATA_TYPE_MAP: { [key: string]: number } = {
    'f8': NC_CONSTANTS.NC_DOUBLE,
    'f4': NC_CONSTANTS.NC_FLOAT,
    'i4': NC_CONSTANTS.NC_INT,
    'i2': NC_CONSTANTS.NC_SHORT,
    'i1': NC_CONSTANTS.NC_BYTE,
    'S1': NC_CONSTANTS.NC_CHAR,
    'double': NC_CONSTANTS.NC_DOUBLE,
    'float': NC_CONSTANTS.NC_FLOAT,
    'int': NC_CONSTANTS.NC_INT,
    'short': NC_CONSTANTS.NC_SHORT,
    'byte': NC_CONSTANTS.NC_BYTE,
    'char': NC_CONSTANTS.NC_CHAR
};