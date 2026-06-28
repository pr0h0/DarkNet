// Shim for node:zlib in the browser. just-bash statically imports these for its
// gzip/gunzip/zcat commands, which the game never uses. Stub them so the bundle
// builds; they throw only if actually invoked.
// ponytail: stub, not a real implementation — swap for fflate if a mission ever needs gzip.
const nope = () => { throw new Error("zlib not available in browser"); };
export const gunzipSync = nope;
export const gzipSync = nope;
export const constants = {} as Record<string, number>;
export default { gunzipSync, gzipSync, constants };
