import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default [
  // UMD build for browsers
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/netcdf4-wasm.umd.js',
      format: 'umd',
      name: 'NetCDF4WASM',
      exports: 'named',
      globals: {
        // Add any global dependencies here if needed
      }
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.rollup.json',
        sourceMap: !production
      }),
      production && terser()
    ].filter(Boolean),
    external: [] // Add external dependencies here if any
  },
  // UMD minified build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/netcdf4-wasm.umd.min.js',
      format: 'umd',
      name: 'NetCDF4WASM',
      exports: 'named',
      globals: {},
      sourcemap: false
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.rollup.json',
        sourceMap: false
      }),
      terser()
    ],
    external: []
  },
  // ESM build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/netcdf4-wasm.esm.js',
      format: 'es',
      sourcemap: !production
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.rollup.json',
        sourceMap: !production
      }),
      production && terser()
    ].filter(Boolean),
    external: []
  }
];