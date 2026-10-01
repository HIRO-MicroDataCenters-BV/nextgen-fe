// Who the admin API thinks is asking. The page calls this to decide whether
// to show admin features at all: 200 means yes, 401/403 means no.
export default defineEventHandler((event) => requireAdmin(event));
