<script setup lang="ts">
const { t } = useI18n();
const { menu, version, user } = useMenu();
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton
                class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                size="lg"
              >
                <div
                  class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
                >
                  <img src="/images/logo.svg" class="size-10" alt="cog-logo" />
                </div>
                <div class="grid flex-1 text-left text-sm leading-tight">
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
                <a :href="item.url">
                  <span class="text-lg">
                    <Icon :name="item.icon" />
                  </span>
                  <span>{{ item.title }}</span>
                </a>
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
                      <Icon class="icon-chevron" name="lucide:chevron-right" />
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

      <SidebarGroup>
        <SidebarGroupLabel>{{ t("subtitle.data_products") }}</SidebarGroupLabel>
        <SidebarMenu>
          <template v-for="item in menu.secondary" :key="item.title">
            <SidebarMenuItem v-if="item.items.length === 0">
              <SidebarMenuButton as-child>
                <a :href="item.url">
                  <span class="text-lg">
                    <Icon :name="item.icon" />
                  </span>
                  <span>{{ item.title }}</span>
                </a>
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
                      <Icon class="icon-chevron" name="lucide:chevron-right" />
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
      <!-- Пользовательский блок -->
      <div class="p-3 mb-2 border-b border-sidebar-border">
        <div class="flex items-center space-x-3">
          <div class="flex-shrink-0">
            <img
              :src="user.avatar"
              class="size-10 rounded-full"
              alt="User avatar"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ user.name }}</p>
            <p class="text-xs text-muted-foreground truncate">
              {{ user.email }}
            </p>
          </div>
        </div>
      </div>

      <!-- Меню футера -->
      <SidebarMenu>
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
