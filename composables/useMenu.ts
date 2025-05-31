import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

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

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
}

export function useMenu() {
  const { t } = useI18n();
  const route = useRoute();

  // App version
  const version = ref("v1.0.0");

  // User profile
  const userProfile = ref<UserProfile>({
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: "/images/logo.svg", // Temporary avatar image
  });

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
    ],
    secondary: [
      {
        id: "marketplace",
        title: t("menu.marketplace"),
        icon: "lucide:shopping-bag",
        url: "/marketplace",
        items: [],
        isActive: route.path === "/marketplace",
      },
      {
        id: "my_catalog",
        title: t("menu.my_catalog"),
        icon: "lucide:folder",
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
  return {
    menu: computed(() => menuItems.value),
    user: computed(() => userProfile.value),
    version,
    updateActiveState,
  };
}
