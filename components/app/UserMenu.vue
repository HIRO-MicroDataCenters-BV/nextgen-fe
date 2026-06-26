<script setup lang="ts">
const { t } = useI18n();
const { user, logout } = useAuthUser();

function handleUserLogout() {
  logout();
  navigateTo("/login");
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <button
        type="button"
        class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-accent data-[state=open]:bg-accent"
      >
        <div
          class="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
        >
          <img
            :src="user.avatar"
            width="32"
            height="32"
            class="size-8 rounded-md object-cover"
            alt=""
            decoding="async"
            fetchpriority="low"
          >
        </div>
        <div class="hidden min-w-0 text-left text-sm leading-tight sm:grid">
          <p class="truncate font-medium">
            {{ user.name }}
          </p>
          <p class="truncate text-xs text-muted-foreground">
            {{ user.email }}
          </p>
        </div>
        <Icon
          name="lucide:chevron-down"
          class="hidden size-4 shrink-0 text-muted-foreground sm:block"
        />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="w-56" align="end" :side-offset="8">
      <DropdownMenuItem class="cursor-pointer" @click="handleUserLogout">
        <Icon class="mr-2 size-4" name="lucide:log-out" />
        {{ t("menu.logout") }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
