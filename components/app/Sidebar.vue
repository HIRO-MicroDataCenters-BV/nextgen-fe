<script setup lang="ts">
import { NuxtLink } from "#components";

const { t } = useI18n();
const { menu, user } = useMenu();
const { logout } = useAuthUser();

function handleUserLogout() {
  logout();
  navigateTo("/login");
}
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader
      class="h-16 max-h-16 shrink-0 gap-0 border-b border-gray-200 p-0 px-2"
    >
      <SidebarMenu class="h-full min-h-0 gap-0">
        <SidebarMenuItem class="flex h-full min-h-0">
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton
                class="h-full min-h-0 max-h-full data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:!h-full group-data-[collapsible=icon]:!max-h-full group-data-[collapsible=icon]:!min-h-0 group-data-[collapsible=icon]:!w-full"
                size="lg"
              >
                <div
                  class="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:rounded-md"
                >
                  <img src="/images/logo.svg" alt="cog-logo" />
                </div>
                <div
                  class="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden"
                >
                  <span class="truncate font-semibold">{{
                    t("general.project_name")
                  }}</span>
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarMenu>
          <template v-for="item in menu.main" :key="item.title">
            <SidebarMenuItem v-if="item.items.length === 0">
              <SidebarMenuButton as-child>
                <NuxtLink :href="item.url" exact-active-class="bg-gray-200">
                  <span class="text-lg">
                    <Icon :name="item.icon" />
                  </span>
                  <span>{{ item.title }}</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <Collapsible
              v-else
              as-child
              :default-open="item.isActive"
              class="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger as-child>
                  <SidebarMenuButton :tooltip="item.title">
                    <div class="flex items-center justify-between w-full">
                      <div class="flex items-center">
                        <span class="text-lg mr-2">
                          <Icon :name="item.icon" />
                        </span>
                        <span>{{ item.title }}</span>
                      </div>
                      <Icon
                        class="icon-chevron shrink-0 group-data-[collapsible=icon]:hidden"
                        name="lucide:chevron-right"
                      />
                    </div>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem
                      v-for="subItem in item.items"
                      :key="subItem.title"
                    >
                      <SidebarMenuSubButton as-child>
                        <NuxtLink :href="subItem.url">
                          <span>{{ subItem.title }}</span>
                        </NuxtLink>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </template>
        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>{{ t("subtitle.data_products") }}</SidebarGroupLabel>
        <SidebarMenu>
          <template v-for="item in menu.secondary" :key="item.title">
            <SidebarMenuItem v-if="item.items.length === 0">
              <SidebarMenuButton as-child>
                <NuxtLink :href="item.url" exact-active-class="bg-gray-200">
                  <span class="text-lg">
                    <Icon :name="item.icon" />
                  </span>
                  <span>{{ item.title }}</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <Collapsible
              v-else
              as-child
              :default-open="item.isActive"
              class="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger as-child>
                  <SidebarMenuButton :tooltip="item.title">
                    <div class="flex items-center justify-between w-full">
                      <div class="flex items-center">
                        <span class="text-lg mr-2">
                          <Icon :name="item.icon" />
                        </span>
                        <span>{{ item.title }}</span>
                      </div>
                      <Icon
                        class="icon-chevron shrink-0 group-data-[collapsible=icon]:hidden"
                        name="lucide:chevron-right"
                      />
                    </div>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem
                      v-for="subItem in item.items"
                      :key="subItem.title"
                    >
                      <SidebarMenuSubButton as-child>
                        <a :href="subItem.url">
                          <span>{{ subItem.title }}</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </template>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>
      <SidebarMenu class="gap-2">
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton
                size="lg"
                class="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                :tooltip="`${user.name} — ${user.email}`"
              >
                <div
                  class="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:rounded-md"
                >
                  <img
                    :src="user.avatar"
                    width="32"
                    height="32"
                    class="size-8 rounded-md object-cover"
                    alt=""
                    decoding="async"
                    fetchpriority="low"
                  />
                </div>
                <div
                  class="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden"
                >
                  <p class="truncate font-medium">
                    {{ user.name }}
                  </p>
                  <p class="truncate text-xs text-muted-foreground">
                    {{ user.email }}
                  </p>
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              class="w-56"
              side="top"
              align="end"
              :side-offset="8"
            >
              <DropdownMenuItem
                class="cursor-pointer"
                @click="handleUserLogout"
              >
                <Icon class="mr-2 size-4" name="lucide:log-out" />
                {{ t("menu.logout") }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
        <SidebarMenuItem v-for="item in menu.footer" :key="item.key">
          <SidebarMenuButton :tooltip="item.title">
            <span class="text-lg">
              <Icon :name="item.icon" />
            </span>
            <span>{{ item.title }}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
