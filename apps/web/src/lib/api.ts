import { createApiClient } from "@yenihaber/api-client";

const baseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

/** Sunucu tarafı public API istemcisi */
export const publicApi = createApiClient({ baseUrl });

export {
  tarihBicimle,
  formatDate,
  formatDateShort,
  formatRelative,
} from "./format-date";

export { marketStrip } from "./live-data";
