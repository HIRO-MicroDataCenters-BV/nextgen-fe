<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset class="overflow-hidden">
      <header
        class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div class="flex items-center gap-2 px-4 justify-between w-full">
          <div class="flex items-center gap-2 px-10 h-6">
            <SidebarTrigger class="-ml-1" />
            <Separator orientation="vertical" class="mr-2 h-12" />
            <AppBreadcrumb />
          </div>

          <div class="flex items-center gap-2 ml-auto items-center">
            <div v-if="isHome" class="flex items-end gap-2">
              <HoverCard>
                <HoverCardTrigger as-child>
                  <Button variant="secondary">{{
                    $t("action.contacts")
                    }}</Button>
                </HoverCardTrigger>
                <HoverCardContent class="w-80">
                  <div class="flex justify-between space-x-4">
                    <img src="/images/logo.svg" class="size-10" alt="cog-logo" >
                    <div class="space-y-1">
                      <div class="mb-2">
                        <h4 class="text-sm font-semibold">
                        {{ $t("app.title")  }}
                      </h4>
                      <p class="text-sm">
                        {{ $t("subtitle.short_description")  }}
                      </p>
                      </div>
                      <div>
                        <ul class="text-gray-500 text-xs">
                          <li class="mb-1">
                            <a href="mailto:info@nextgentools.eu" class="flex gap-2 items-center justify-start">
                              <Icon name="lucide:mail" />
                              <span>{{ $t("home.contacts.email")  }}</span>
                            </a>
                          </li>
                          <li class="mb-1">
                            <a href="https://www.linkedin.com/company/nextgen-cvd-dataspace" class="flex gap-2 items-center justify-start">
                              <Icon name="lucide:linkedin" />
                              <span>{{ $t("home.contacts.linkedin")  }}</span>
                            </a>
                          </li>
                          <li class="mb-1">
                            <a href="https://www.youtube.com/@NextGenCVDDataspace" class="flex gap-2 items-center justify-start">
                              <Icon name="lucide:youtube" />
                              <span>{{ $t("home.contacts.youtube")  }}</span>
                            </a>
                          </li>
                          <li>
                            <a href="https://twitter.com/NextGenCVD" class="flex gap-2 items-center justify-start">
                              <Icon name="lucide:twitter" />
                              <span>{{ $t("home.contacts.twitter")  }}</span>
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
              <Button variant="secondary" as="a" href="https://github.com/HIRO-MicroDataCenters-BV">{{
                $t("action.github")
                }}</Button>
            </div>
            <AppColorModeSwitch />
          </div>
        </div>
      </header>
      <div class="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>

<script setup lang="ts">
const route = useRouter();
const currentRouteName = computed(() => route.currentRoute.value.name);
const isHome = computed(() => currentRouteName.value === "home");
</script>
