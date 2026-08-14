import { API_BASE } from "@/lib/public-env";
import { createApiClient } from "@yenihaber/api-client";

const baseUrl =
  API_BASE;

/** Sunucu tarafı public API istemcisi */
export const publicApi = createApiClient({ baseUrl });

export {
  tarihBicimle,
  formatDate,
  formatDateShort,
  formatRelative,
} from "./format-date";

export { marketStrip } from "./live-data";
