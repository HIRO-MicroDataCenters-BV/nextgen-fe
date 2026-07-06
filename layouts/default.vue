<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        class="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain"
      >
        <header
          class="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 bg-background transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-16"
        >
          <div class="w-full gap-2 border-b border-border px-0">
            <div class="flex w-full min-w-0 flex-col">
              <div
                :class="[
                  'mx-auto flex w-full min-w-0 flex-row items-center justify-between px-8',
                  isWide ? 'max-w-[1600px]' : 'max-w-[calc(840px+16px)]',
                ]"
              >
                <div class="flex h-16 items-center gap-2 py-4">
                  <SidebarTrigger class="-ml-1 sm:hidden" />
                  <Separator
                    orientation="vertical"
                    class="mr-2 h-4 sm:hidden"
                  />
                  <AppBreadcrumb />
                </div>

                <div class="ml-auto flex items-center gap-2">
                  <AppHeaderSource compact />
                </div>
              </div>
            </div>
          </div>
        </header>
        <div class="flex w-full flex-col gap-4 px-0 md:gap-8">
          <div class="flex w-full min-w-0 flex-col gap-4 md:gap-8">
            <div class="mx-auto flex w-full flex-col gap-4 md:gap-8">
              <slot />
            </div>
          </div>
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>

<script setup lang="ts">
const route = useRoute();
// nuxt-i18n appends a "___<locale>" suffix to route names (e.g. "home___en"),
// so strip it to get the base name before comparing.
const baseRouteName = computed(() => String(route.name ?? "").split("___")[0] ?? "");

// Home, My Catalog, and Marketplace use a full-width content column; widen the
// header to match so the breadcrumb aligns with the page content. The catalog
// editor sub-routes (create + detail) also use the wide editor layout, so match
// by path.
const isWide = computed(() => {
  if (["home", "my_catalog", "marketplace", "tools"].includes(baseRouteName.value)) {
    return true;
  }
  return (
    route.path.startsWith("/my_catalog/") ||
    route.path.startsWith("/marketplace/") ||
    route.path.startsWith("/tools/")
  );
});
</script>
