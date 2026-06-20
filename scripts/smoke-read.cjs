// Read smoke test: validates loadFromFile against the freshly built wasm by
// reading a real fixture file's dimensions, variables, attributes and data.
// Run by the WASM Build CI job (real wasm, NODE_ENV unset). Not part of the
// Jest suite, which runs in mock mode.
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const nc4 = require("../dist/index.js");

(async () => {
  const file = path.join(__dirname, "..", "test", "fixtures", "sample.nc");
  const buf = fs.readFileSync(file);
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const ds = await nc4.DatasetFromArrayBuffer(ab, "r");

  const dims = Object.fromEntries(
    Object.entries(ds.dimensions).map(([k, v]) => [k, v.size]),
  );
  assert.deepStrictEqual(dims, { time: 2, lat: 3, lon: 4 }, "dimensions");

  assert.deepStrictEqual(
    Object.keys(ds.variables).sort(),
    ["lat", "lon", "sst", "time"],
    "variable names",
  );

  const sst = ds.variables.sst;
  assert.deepStrictEqual(
    sst.dimensions,
    ["time", "lat", "lon"],
    "sst dimensions",
  );
  assert.strictEqual(sst.datatype, "f4", "sst datatype");
  assert.strictEqual(sst.getAttr("units"), "degC", "sst units attribute");
  assert.strictEqual(
    sst.getAttr("standard_name"),
    "sea_surface_temperature",
    "sst standard_name attribute",
  );

  const data = await sst.getValue();
  assert.strictEqual(data.length, 24, "sst data length (2*3*4)");
  assert.strictEqual(Math.round(data[5]), 5, "sst data value");

  assert.strictEqual(ds.getAttr("title"), "smoke test", "global attribute");

  await ds.close();
  console.log(
    "✅ read smoke test passed (dimensions, variables, attributes, data)",
  );
})().catch((e) => {
  console.error("❌ read smoke test FAILED:", e);
  process.exit(1);
});
