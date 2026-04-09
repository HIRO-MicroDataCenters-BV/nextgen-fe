export default defineNuxtPlugin((nuxtApp) => {
  const previousWarnHandler = nuxtApp.vueApp.config.warnHandler;

  nuxtApp.vueApp.config.warnHandler = (msg, instance, trace) => {
    if (msg.includes("<Suspense> is an experimental feature")) {
      return;
    }

    if (previousWarnHandler) {
      previousWarnHandler(msg, instance, trace);
      return;
    }

    // Keep default Vue warning output for all other warnings.
    console.warn(`[Vue warn]: ${msg}${trace ?? ""}`);
  };
});
