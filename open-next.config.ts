import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";

// ISR cache (the 60s tenant revalidation) backed by Workers KV so it is
// shared across isolates instead of per-instance memory.
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
});
