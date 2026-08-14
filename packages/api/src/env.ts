import { config } from "dotenv";
import { resolve } from "node:path";
import { resolveFromImportMeta } from "./lib/module-dir";

const root = resolveFromImportMeta(import.meta.url, "../../..");
config({ path: resolve(root, ".env") });
