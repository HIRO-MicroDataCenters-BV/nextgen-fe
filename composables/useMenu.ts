import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import type { AuthUserProfile } from "./useAuthUser";
import { useAdminAccess } from "./admin/useAdminAccess";

export type UserProfile = AuthUserProfile;

export interface MenuItem {
  id: string;
  title: string;
  icon: string;
  url: string;
  items: MenuItem[];
  isActive?: boolean;
  key?: string;
}

export interface MenuStructure {
  main: MenuItem[];
  secondary: MenuItem[];
  footer: MenuItem[];
}

export function useMenu() {
  const { t } = useI18n();
  const route = useRoute();
  const config = useRuntimeConfig();
  const { user: authUserDisplay, authUser } = useAuthUser();

  // Admins get an Admin entry. Whether someone is one is the server's call —
  // asked once per signed-in email — and hiding the link is only tidiness:
  // every admin request is checked on the server regardless.
  const { isAdmin, ensureChecked } = useAdminAccess();
  watch(() => authUser.value?.email, ensureChecked, { immediate: true });

  // App version
  const version = ref("v1.0.0");

  const catalogName = config.public.catalogName;

  // Menu structure
  const menuItems = ref<MenuStructure>({
    main: [
      {
        id: "home",
        title: t("menu.home"),
        icon: "lucide:home",
        url: "/home",
        items: [],
        isActive: route.path === "/",
      },
      {
        id: "tools",
        title: t("menu.tools"),
        icon: "lucide:blocks",
        url: "/tools",
        items: [],
        isActive: route.path === "/tools",
      },
    ],
    secondary: [
      {
        id: "marketplace",
        title: t("menu.marketplace"),
        icon: "lucide:store",
        url: "/marketplace",
        items: [],
        isActive: route.path === "/marketplace",
      },
      {
        id: "my_catalog",
        title: t(`menu.${catalogName}`),
        icon: "lucide:library-big",
        url: "/my_catalog",
        items: [],
        isActive: route.path === "/my_catalog",
      },
    ],
    footer: [],
  });

  // Update active state of menu items based on the current route
  const updateActiveState = () => {
    menuItems.value.main.forEach((item) => {
      if (item.url === "#" && item.items.length > 0) {
        item.isActive = item.items.some((subItem) =>
          route.path.startsWith(subItem.url)
        );
      } else {
        item.isActive = route.path === item.url;
      }
    });

    menuItems.value.secondary.forEach((item) => {
      if (item.url === "#" && item.items.length > 0) {
        item.isActive = item.items.some((subItem) =>
          route.path.startsWith(subItem.url)
        );
      } else {
        item.isActive = route.path === item.url;
      }
    });
  };

  // Exporting data and methods
  const adminItem = (): MenuItem => ({
    id: "admin",
    key: "admin",
    title: t("menu.admin"),
    icon: "lucide:shield-check",
    url: "/admin",
    items: [],
    isActive: route.path.startsWith("/admin"),
  });

  return {
    menu: computed(() => ({
      ...menuItems.value,
      footer: isAdmin.value ? [adminItem()] : [],
    })),
    user: authUserDisplay,
    version,
    updateActiveState,
  };
}
