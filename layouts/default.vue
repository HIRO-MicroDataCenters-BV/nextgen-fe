<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset class="overflow-hidden">
      <header
        class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
      >
        <div class="flex items-center gap-2 px-4 justify-between w-full">
          <div class="flex items-center gap-2 px-10 h-6">
            <SidebarTrigger class="-ml-1" />
            <Separator orientation="vertical" class="mr-2 h-12" />
            <AppBreadcrumb />
          </div>

          <div class="flex items-center gap-2 ml-auto items-center">
            <div v-if="isHome" class="flex items-end gap-2">
              <Button variant="secondary" as="a" href="/contacts">{{
                $t("action.contacts")
              }}</Button>
              <Button variant="secondary" as="a" href="https://github.com/">{{
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
