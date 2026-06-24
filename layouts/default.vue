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
          <div class="w-full gap-2 border-b border-gray-200 px-0">
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

                <div class="ml-auto flex items-center justify-between gap-2">
                  <div v-if="isHome" class="flex items-end gap-2">
                    <HoverCard>
                      <HoverCardTrigger as-child>
                        <Button variant="outline" size="sm">
                          {{ $t("action.contacts") }}
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent class="w-80">
                        <div class="flex justify-between space-x-4">
                          <div class="flex justify-between space-x-4">
                            <img
                              src="/images/logo.svg"
                              class="size-10"
                              alt="cog-logo"
                            >
                            <div class="space-y-1">
                              <div class="mb-2">
                                <h4 class="text-sm font-semibold">
                                  {{ $t("app.title") }}
                                </h4>
                                <p class="text-sm">
                                  {{ $t("subtitle.short_description") }}
                                </p>
                              </div>
                              <div>
                                <ul class="text-gray-500 text-xs">
                                  <li class="mb-1">
                                    <a
                                      href="mailto:info@nextgentools.eu"
                                      class="flex gap-2 items-center justify-start"
                                    >
                                      <Icon name="lucide:mail" />
                                      <span>info@nextgentools.eu</span>
                                    </a>
                                  </li>
                                  <li class="mb-1">
                                    <a
                                      href="https://www.linkedin.com/company/nextgen-cvd-dataspace"
                                      class="flex gap-2 items-center justify-start"
                                    >
                                      <Icon name="lucide:linkedin" />
                                      <span>{{
                                        $t("home.contacts.linkedin")
                                      }}</span>
                                    </a>
                                  </li>
                                  <li class="mb-1">
                                    <a
                                      href="https://www.youtube.com/@NextGenCVDDataspace"
                                      class="flex gap-2 items-center justify-start"
                                    >
                                      <Icon name="lucide:youtube" />
                                      <span>{{
                                        $t("home.contacts.youtube")
                                      }}</span>
                                    </a>
                                  </li>
                                  <li>
                                    <a
                                      href="https://twitter.com/NextGenCVD"
                                      class="flex gap-2 items-center justify-start"
                                    >
                                      <Icon name="lucide:twitter" />
                                      <span>{{
                                        $t("home.contacts.twitter")
                                      }}</span>
                                    </a>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                    <Button
                      variant="secondary"
                      as="a"
                      href="https://github.com/HIRO-MicroDataCenters-BV"
                      >{{ $t("action.github") }}</Button
                    >
                  </div>
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
const currentRouteName = computed(() => route.name);
const isHome = computed(() => currentRouteName.value === "home");
// My Catalog and Marketplace use a full-width content column; widen the header
// to match so the breadcrumb aligns with the page content.
// i18n appends a "___<locale>" suffix to route names (e.g. "my_catalog___en"),
// so compare the base name. The catalog editor sub-routes (create + detail)
// also use the wide editor layout, so match them by path.
const isWide = computed(() => {
  const base = String(currentRouteName.value).split("___")[0] ?? "";
  if (["home", "my_catalog", "marketplace"].includes(base)) return true;
  return (
    route.path.startsWith("/my_catalog/") ||
    route.path.startsWith("/marketplace/")
  );
});
</script>
