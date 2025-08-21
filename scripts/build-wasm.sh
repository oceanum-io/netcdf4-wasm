#!/bin/bash

# Enable strict error handling and debugging
set -euo pipefail

# NetCDF4 WASM Build Script
# This script builds the netcdf4 library to WebAssembly using Emscripten

# Enable verbose output for debugging
VERBOSE=${VERBOSE:-0}
if [ "$VERBOSE" = "1" ]; then
    set -x
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_ROOT/build"
DIST_DIR="$PROJECT_ROOT/dist"
DEPS_DIR="$BUILD_DIR/deps"
INSTALL_DIR="$BUILD_DIR/install"

# Versions
ZLIB_VERSION="1.3.1"
HDF5_VERSION="1.14.3"
NETCDF_VERSION="4.9.2"

# Download URLs
ZLIB_URL="https://zlib.net/zlib-${ZLIB_VERSION}.tar.gz"
HDF5_URL="https://github.com/HDFGroup/hdf5/archive/refs/tags/hdf5-${HDF5_VERSION//./_}.tar.gz"
NETCDF_URL="https://github.com/Unidata/netcdf-c/archive/refs/tags/v${NETCDF_VERSION}.tar.gz"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# Function to handle errors
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Function to check if command succeeded
check_command() {
    if ! "$@"; then
        error_exit "Command failed: $*"
    fi
}

# Function to apply config.h patches for NetCDF4 Emscripten compatibility
apply_config_patches() {
    local config_file="$1"
    
    if [ ! -f "$config_file" ]; then
        error_exit "config.h not found at $config_file"
    fi
    
    log "Patching config.h for Emscripten compatibility..."
    
    # Fix SIZEOF definitions for WebAssembly (32-bit target)
    sed -i 's|/\* #undef SIZEOF_DOUBLE \*/|#define SIZEOF_DOUBLE 8|' "$config_file"
    sed -i 's|/\* #undef SIZEOF_FLOAT \*/|#define SIZEOF_FLOAT 4|' "$config_file"
    sed -i 's|/\* #undef SIZEOF_INT \*/|#define SIZEOF_INT 4|' "$config_file"
    sed -i 's|/\* #undef SIZEOF_LONG \*/|#define SIZEOF_LONG 4|' "$config_file"
    sed -i 's|/\* #undef SIZEOF_LONG_LONG \*/|#define SIZEOF_LONG_LONG 8|' "$config_file"
    sed -i 's|/\* #undef SIZEOF_SHORT \*/|#define SIZEOF_SHORT 2|' "$config_file"
    sed -i 's|/\* #undef SIZEOF_SIZE_T \*/|#define SIZEOF_SIZE_T 4|' "$config_file"
    sed -i 's|/\* #undef SIZEOF_CHAR \*/|#define SIZEOF_CHAR 1|' "$config_file"
    sed -i 's|/\* #undef SIZEOF_UCHAR \*/|#define SIZEOF_UCHAR 1|' "$config_file"
    sed -i 's|/\* #undef SIZEOF_OFF_T \*/|#define SIZEOF_OFF_T 4|' "$config_file"
    sed -i 's|/\* #undef SIZEOF_OFF64_T \*/|#define SIZEOF_OFF64_T 8|' "$config_file"
    sed -i 's|/\* #undef SIZEOF_ULONGLONG \*/|#define SIZEOF_ULONGLONG 8|' "$config_file"
    sed -i 's|/\* #undef SIZEOF_UINT \*/|#define SIZEOF_UINT 4|' "$config_file"
    sed -i 's|/\* #undef SIZEOF_USHORT \*/|#define SIZEOF_USHORT 2|' "$config_file"
    
    # Add additional SIZEOF definitions needed by NetCDF
    sed -i 's|/\* #undef SIZEOF___INT64 \*/|#define SIZEOF___INT64 8\n#define SIZEOF_UINT64_T 8\n#define SIZEOF_UINT64 8|' "$config_file"
    
    # Fix endianness for WebAssembly (little-endian)
    sed -i 's|#define WORDS_BIGENDIAN 1|/* #undef WORDS_BIGENDIAN */|' "$config_file"
    
    # Disable Windows-specific features
    sed -i 's|#define HAVE_FILE_LENGTH_I64 1|/* #undef HAVE_FILE_LENGTH_I64 */|' "$config_file"
    
    # Add ssize_t definition guard
    sed -i '/^#define SIZEOF_SIZE_T/a\\n/* Define to 1 if you have the `ssize_t'\'' type. */\n#define HAVE_SSIZE_T 1' "$config_file"
    
    # Disable HDF5 collective metadata operations for non-parallel build
    sed -i 's|#define HDF5_HAS_COLL_METADATA_OPS 1|/* #undef HDF5_HAS_COLL_METADATA_OPS */|' "$config_file"
    
    log "✅ config.h patches applied"
}

log "Building NetCDF4 for WebAssembly..."
log "Script directory: $SCRIPT_DIR"
log "Project root: $PROJECT_ROOT"
log "Build directory: $BUILD_DIR"

# Source Emscripten environment if available locally
if [ -f "$BUILD_DIR/emsdk/emsdk_env.sh" ]; then
    log "Loading local Emscripten environment..."
    source "$BUILD_DIR/emsdk/emsdk_env.sh"
fi

# Check if Emscripten is available
if ! command -v emcc &> /dev/null; then
    error_exit "Emscripten not found. Please install and activate the Emscripten SDK.
Run: npm run install-emscripten
Or visit: https://emscripten.org/docs/getting_started/downloads.html"
fi

EMCC_VERSION=$(emcc --version | head -n1)
log "Using Emscripten: $EMCC_VERSION"

# Create directories
log "Creating build directories..."
mkdir -p "$BUILD_DIR" "$DIST_DIR" "$DEPS_DIR" "$INSTALL_DIR"

cd "$BUILD_DIR"
log "Working directory: $(pwd)"

# Set Emscripten environment variables
export CC=emcc
export CXX=em++
export AR=emar
export RANLIB=emranlib
export CFLAGS="-O2 -s USE_PTHREADS=0 -s ALLOW_MEMORY_GROWTH=1 -I$INSTALL_DIR/include"
export CXXFLAGS="$CFLAGS"

log "Emscripten environment variables set:"
log "  CC=$CC"
log "  CXX=$CXX"
log "  AR=$AR"
log "  RANLIB=$RANLIB"

# Build zlib
log "Starting zlib build process..."
if [ ! -f "$INSTALL_DIR/lib/libz.a" ]; then
    log "zlib not found, building from source..."
    cd "$DEPS_DIR"
    log "Changed to deps directory: $(pwd)"
    
    if [ ! -d "zlib-$ZLIB_VERSION" ]; then
        log "Downloading zlib-$ZLIB_VERSION..."
        
        # Try wget first, then curl
        if command -v wget &> /dev/null; then
            log "Using wget to download zlib..."
            check_command wget -v "$ZLIB_URL" -O "zlib-$ZLIB_VERSION.tar.gz"
        elif command -v curl &> /dev/null; then
            log "Using curl to download zlib..."
            check_command curl -L "$ZLIB_URL" -o "zlib-$ZLIB_VERSION.tar.gz"
        else
            error_exit "Neither wget nor curl available for downloading"
        fi
        
        log "Extracting zlib archive..."
        check_command tar -xzf "zlib-$ZLIB_VERSION.tar.gz"
        log "zlib extracted successfully"
    else
        log "zlib source directory already exists"
    fi
    
    cd "zlib-$ZLIB_VERSION"
    log "Configuring zlib in directory: $(pwd)"
    
    # Configure with verbose output
    log "Running emconfigure ./configure..."
    check_command emconfigure ./configure --prefix="$INSTALL_DIR" --static
    
    log "Building zlib with emmake..."
    # Use single core for initial build to avoid issues
    check_command emmake make -j1
    
    log "Installing zlib..."
    check_command emmake make install
    
    log "✅ zlib built and installed successfully"
    
    # Verify installation
    if [ -f "$INSTALL_DIR/lib/libz.a" ]; then
        log "✅ zlib library verified at $INSTALL_DIR/lib/libz.a"
    else
        error_exit "zlib library not found after installation"
    fi
else
    log "✅ zlib already built and installed"
fi

# Build HDF5
log "Starting HDF5 build process..."
if [ ! -f "$INSTALL_DIR/lib/libhdf5.a" ]; then
    log "HDF5 not found, building from source..."
    cd "$DEPS_DIR"
    log "Changed to deps directory: $(pwd)"
    
    if [ ! -d "hdf5-$HDF5_VERSION" ]; then
        log "Downloading HDF5-$HDF5_VERSION..."
        
        HDF5_DOWNLOAD_NAME="hdf5-${HDF5_VERSION//./_}.tar.gz"
        if command -v wget &> /dev/null; then
            log "Using wget to download HDF5..."
            check_command wget -v "$HDF5_URL" -O "$HDF5_DOWNLOAD_NAME"
        elif command -v curl &> /dev/null; then
            log "Using curl to download HDF5..."
            check_command curl -L "$HDF5_URL" -o "$HDF5_DOWNLOAD_NAME"
        else
            error_exit "Neither wget nor curl available for downloading"
        fi
        
        log "Extracting HDF5 archive..."
        # The downloaded file has underscores, but we extract to dots
        HDF5_DOWNLOAD_NAME="hdf5-${HDF5_VERSION//./_}.tar.gz"
        check_command tar -xzf "$HDF5_DOWNLOAD_NAME"
        check_command mv "hdf5-hdf5-${HDF5_VERSION//./_}" "hdf5-$HDF5_VERSION"
        log "HDF5 extracted successfully"
    else
        log "HDF5 source directory already exists"
    fi
    
    cd "hdf5-$HDF5_VERSION"
    log "Configuring HDF5 in directory: $(pwd)"
    mkdir -p build && cd build
    
    log "Running emcmake cmake for HDF5..."
    check_command emcmake cmake .. \
        -DCMAKE_INSTALL_PREFIX="$INSTALL_DIR" \
        -DCMAKE_BUILD_TYPE=Release \
        -DBUILD_SHARED_LIBS=OFF \
        -DHDF5_ENABLE_THREADSAFE=OFF \
        -DHDF5_ENABLE_PARALLEL=OFF \
        -DHDF5_BUILD_TOOLS=OFF \
        -DHDF5_BUILD_EXAMPLES=OFF \
        -DHDF5_BUILD_TESTS=OFF \
        -DBUILD_TESTING=OFF \
        -DHDF5_ENABLE_TESTS=OFF \
        -DCMAKE_C_BYTE_ORDER=LITTLE_ENDIAN \
        -DHDF5_DISABLE_COMPILER_WARNINGS=ON \
        -DZLIB_ROOT="$INSTALL_DIR" \
        -DZLIB_INCLUDE_DIR="$INSTALL_DIR/include" \
        -DZLIB_LIBRARY="$INSTALL_DIR/lib/libz.a"
    
    log "Building HDF5 with emmake..."
    check_command emmake make -j1
    
    log "Installing HDF5..."
    check_command emmake make install
    
    log "✅ HDF5 built and installed successfully"
    
    # Verify installation
    if [ -f "$INSTALL_DIR/lib/libhdf5.a" ]; then
        log "✅ HDF5 library verified at $INSTALL_DIR/lib/libhdf5.a"
    else
        error_exit "HDF5 library not found after installation"
    fi
else
    log "✅ HDF5 already built and installed"
fi

# Build NetCDF4
log "Starting NetCDF4 build process..."
if [ ! -f "$INSTALL_DIR/lib/libnetcdf.a" ]; then
    log "NetCDF4 not found, building from source..."
    cd "$DEPS_DIR"
    log "Changed to deps directory: $(pwd)"
    
    if [ ! -d "netcdf-c-$NETCDF_VERSION" ]; then
        log "Downloading NetCDF4-$NETCDF_VERSION..."
        
        if command -v wget &> /dev/null; then
            log "Using wget to download NetCDF4..."
            check_command wget -v "$NETCDF_URL" -O "netcdf-c-$NETCDF_VERSION.tar.gz"
        elif command -v curl &> /dev/null; then
            log "Using curl to download NetCDF4..."
            check_command curl -L "$NETCDF_URL" -o "netcdf-c-$NETCDF_VERSION.tar.gz"
        else
            error_exit "Neither wget nor curl available for downloading"
        fi
        
        log "Extracting NetCDF4 archive..."
        check_command tar -xzf "netcdf-c-$NETCDF_VERSION.tar.gz"
        log "NetCDF4 extracted successfully"
    else
        log "NetCDF4 source directory already exists"
    fi
    
    cd "netcdf-c-$NETCDF_VERSION"
    log "Configuring NetCDF4 in directory: $(pwd)"
    
    # Apply CMakeLists.txt patches before CMake configuration
    log "Patching CMakeLists.txt to bypass CHECK_LIBRARY_EXISTS calls..."
    
    # Comment out all CHECK_LIBRARY_EXISTS calls that cause issues in Emscripten
    sed -i '933s/^/  # /' CMakeLists.txt || error_exit "Failed to patch CHECK_LIBRARY_EXISTS H5Pget_fapl_mpio"
    sed -i '941s/^/  # /' CMakeLists.txt || error_exit "Failed to comment CHECK_LIBRARY_EXISTS H5Pset_all_coll_metadata_ops"
    sed -i '950s/^/  # /' CMakeLists.txt || error_exit "Failed to comment CHECK_LIBRARY_EXISTS H5Dread_chunk"
    sed -i '953s/^/  # /' CMakeLists.txt || error_exit "Failed to comment CHECK_LIBRARY_EXISTS H5Pset_fapl_ros3"
    
    # Set bypass variables for the features
    sed -i '943s/SET(HDF5_HAS_COLL_METADATA_OPS ON)/SET(HDF5_HAS_COLL_METADATA_OPS OFF)/' CMakeLists.txt || error_exit "Failed to set HDF5_HAS_COLL_METADATA_OPS to OFF"
    sed -i '950a\\n  # Set HAS_READCHUNKS to OFF for Emscripten\\n  SET(HAS_READCHUNKS OFF)' CMakeLists.txt || error_exit "Failed to set HAS_READCHUNKS"
    sed -i '953a\\n  # Set HAS_HDF5_ROS3 to OFF for Emscripten\\n  SET(HAS_HDF5_ROS3 OFF)' CMakeLists.txt || error_exit "Failed to set HAS_HDF5_ROS3"
    
    log "✅ CMakeLists.txt patches applied"
    
    mkdir -p build && cd build
    
    log "Running emcmake cmake for NetCDF4..."
    check_command emcmake cmake .. \
        -DCMAKE_INSTALL_PREFIX="$INSTALL_DIR" \
        -DCMAKE_BUILD_TYPE=Release \
        -DCMAKE_BINARY_DIR="$BUILD_DIR/deps/netcdf-c-$NETCDF_VERSION/build" \
        -DBUILD_SHARED_LIBS=OFF \
        -DENABLE_NETCDF_4=ON \
        -DENABLE_HDF5=ON \
        -DENABLE_DAP=OFF \
        -DENABLE_BYTERANGE=OFF \
        -DBUILD_UTILITIES=OFF \
        -DBUILD_TESTING=OFF \
        -DENABLE_TESTS=OFF \
        -DCMAKE_C_BYTE_ORDER=LITTLE_ENDIAN \
        -DWORDS_BIGENDIAN=OFF \
        -DHDF5_USE_STATIC_LIBRARIES=ON \
        -DHDF5_PREFER_PARALLEL=OFF \
        -DHDF5_FIND_QUIETLY=ON \
        -DHDF5_INCLUDE_DIR="$INSTALL_DIR/include" \
        -DHDF5_C_INCLUDE_DIR="$INSTALL_DIR/include" \
        -DHDF5_C_LIBRARY="$INSTALL_DIR/lib/libhdf5.a;$INSTALL_DIR/lib/libz.a" \
        -DHDF5_C_LIBRARY_hdf5="$INSTALL_DIR/lib/libhdf5.a" \
        -DHDF5_HL_LIBRARY="$INSTALL_DIR/lib/libhdf5_hl.a;$INSTALL_DIR/lib/libz.a" \
        -DHDF5_VERSION="$HDF5_VERSION" \
        -DHDF5_VERSION_STRING="$HDF5_VERSION" \
        -DHAVE_HDF5_H="$INSTALL_DIR/include" \
        -DHAVE_HDF5_ZLIB=ON \
        -DHDF5_IS_PARALLEL_MPIO=OFF \
        -DHDF5_PARALLEL=OFF \
        -DUSE_HDF5_SZIP=OFF \
        -DZLIB_INCLUDE_DIR="$INSTALL_DIR/include" \
        -DZLIB_LIBRARY="$INSTALL_DIR/lib/libz.a"
    
    # Apply config.h patches after CMake configuration
    apply_config_patches "$(pwd)/config.h"
    
    log "Building NetCDF4 with emmake..."
    check_command emmake make -j1
    
    log "Installing NetCDF4..."
    check_command emmake make install
    
    log "✅ NetCDF4 built and installed successfully"
    
    # Verify installation
    if [ -f "$INSTALL_DIR/lib/libnetcdf.a" ]; then
        log "✅ NetCDF4 library verified at $INSTALL_DIR/lib/libnetcdf.a"
    else
        error_exit "NetCDF4 library not found after installation"
    fi
else
    log "✅ NetCDF4 already built and installed"
fi

# Create WASM module
log "Starting WASM module creation..."
cd "$BUILD_DIR"
log "Changed to build directory: $(pwd)"

# Create a simple C wrapper that exposes NetCDF functions
cat > netcdf_wrapper.c << 'EOF'
#include <netcdf.h>
#include <emscripten.h>

// Export NetCDF functions to JavaScript
EMSCRIPTEN_KEEPALIVE
int nc_open_wrapper(const char* path, int mode, int* ncidp) {
    return nc_open(path, mode, ncidp);
}

EMSCRIPTEN_KEEPALIVE
int nc_close_wrapper(int ncid) {
    return nc_close(ncid);
}

EMSCRIPTEN_KEEPALIVE
int nc_create_wrapper(const char* path, int mode, int* ncidp) {
    return nc_create(path, mode, ncidp);
}

EMSCRIPTEN_KEEPALIVE
int nc_def_dim_wrapper(int ncid, const char* name, size_t len, int* dimidp) {
    return nc_def_dim(ncid, name, len, dimidp);
}

EMSCRIPTEN_KEEPALIVE
int nc_def_var_wrapper(int ncid, const char* name, nc_type xtype, int ndims, const int* dimidsp, int* varidp) {
    return nc_def_var(ncid, name, xtype, ndims, dimidsp, varidp);
}

EMSCRIPTEN_KEEPALIVE
int nc_put_var_double_wrapper(int ncid, int varid, const double* op) {
    return nc_put_var_double(ncid, varid, op);
}

EMSCRIPTEN_KEEPALIVE
int nc_get_var_double_wrapper(int ncid, int varid, double* ip) {
    return nc_get_var_double(ncid, varid, ip);
}

EMSCRIPTEN_KEEPALIVE
int nc_enddef_wrapper(int ncid) {
    return nc_enddef(ncid);
}
EOF

# Compile to WASM
log "Creating C wrapper for NetCDF functions..."

log "Compiling WASM module with emcc..."
check_command emcc netcdf_wrapper.c \
    -I"$INSTALL_DIR/include" \
    -L"$INSTALL_DIR/lib" \
    -lnetcdf -lhdf5 -lhdf5_hl -lz \
    -s WASM=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="NetCDF4Module" \
    -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","getValue","setValue","UTF8ToString","stringToUTF8","lengthBytesUTF8","_malloc","_free"]' \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s INITIAL_MEMORY=16777216 \
    --pre-js "$PROJECT_ROOT/bindings/pre.js" \
    --post-js "$PROJECT_ROOT/bindings/post.js" \
    -O2 \
    -o "$DIST_DIR/netcdf4.js"

log "✅ WASM module created successfully!"

# Verify build outputs
if [ -f "$DIST_DIR/netcdf4.js" ] && [ -f "$DIST_DIR/netcdf4.wasm" ]; then
    log "✅ Build verification successful!"
    log "Built files:"
    log "  - $DIST_DIR/netcdf4.js ($(du -h "$DIST_DIR/netcdf4.js" | cut -f1))"
    log "  - $DIST_DIR/netcdf4.wasm ($(du -h "$DIST_DIR/netcdf4.wasm" | cut -f1))"
else
    error_exit "WASM build files not found after compilation"
fi

log "🎉 NetCDF4 WASM build completed successfully!"
log "You can now use the TypeScript interface to interact with NetCDF files."