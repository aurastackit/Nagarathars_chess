import { z } from "zod";

// Zod 4 probes `new Function("")` to decide whether it can JIT-compile
// validators. The probe is caught, but under the site's CSP (no unsafe-eval)
// the browser still logs it as a security-policy violation. jitless skips the
// probe; it must run before any schema is created, so schema modules import z
// from here instead of from "zod".
z.config({ jitless: true });

export { z };
