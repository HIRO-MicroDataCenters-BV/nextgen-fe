<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header
        class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
      >
        <div class="flex items-center gap-2 px-4 justify-between w-full">
          <div class="flex items-center gap-2 px-10">
            <SidebarTrigger class="-ml-1" />
            <Separator orientation="vertical" class="mr-2 h-4" />
            <AppBreadcrumb />
          </div>
          <div class="flex items-center gap-2 ml-auto items-center">
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
import AppBreadcrumb from '@/components/app/Breadcrumb.vue';
</script>

