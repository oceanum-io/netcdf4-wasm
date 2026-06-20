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

// Reverse map: NetCDF type code -> datatype token (for reading existing files).
export const NC_TYPE_TO_STR: { [code: number]: string } = {
    1: 'i1',   // NC_BYTE
    2: 'S1',   // NC_CHAR
    3: 'i2',   // NC_SHORT
    4: 'i4',   // NC_INT
    5: 'f4',   // NC_FLOAT
    6: 'f8',   // NC_DOUBLE
    7: 'u1',   // NC_UBYTE
    8: 'u2',   // NC_USHORT
    9: 'u4',   // NC_UINT
    10: 'i8',  // NC_INT64
    11: 'u8',  // NC_UINT64
    12: 'S1',  // NC_STRING
};