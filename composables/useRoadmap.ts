export const useRoadmap = () => {
  const { t } = useI18n();
  const roadmapItems = ref([
    {
      id: 1,
      deadline: "2025-06-01",
      description: t("home.roadmap.item[0].description"),
    },
    {
      id: 2,
      deadline: "2025-06-01",
      description: t("home.roadmap.item[1].description"),
    },
    {
      id: 3,
      deadline: "2025-06-01",
      description: t("home.roadmap.item[2].description"),
    },
    {
      id: 4,
      deadline: "2025-06-01",
      description: t("home.roadmap.item[3].description"),
    },
    {
      id: 5,
      deadline: "2025-06-01",
      description: t("home.roadmap.item[4].description"),
    },
    {
      id: 6,
      deadline: "2025-06-01",
      description: t("home.roadmap.item[5].description"),
    },
    {
      id: 7,
      deadline: "2025-06-01",
      description: t("home.roadmap.item[6].description"),
    },
    {
      id: 8,
      deadline: "2025-06-01",
      description: t("home.roadmap.item[7].description"),
    },
    {
      id: 9,
      deadline: "2025-06-01",
      description: t("home.roadmap.item[8].description"),
    },
    {
      id: 10,
      deadline: "2025-06-01",
      description: t("home.roadmap.item[9].description"),
    },
    {
      id: 11,
      deadline: "2025-06-01",
      description: t("home.roadmap.item[10].description"),
    },
    {
      id: 12,
      deadline: "2025-06-01",
      description: t("home.roadmap.item[11].description"),
    },
    {
      id: 13,
      deadline: "2025-06-01",
      description: t("home.roadmap.item[12].description"),
    },
    {
      id: 14,
      deadline: "2025-06-01",
      description: t("home.roadmap.item[13].description"),
    },
    {
      id: 15,
      deadline: "2025-06-01",
      description: t("home.roadmap.item[14].description"),
    },
    {
      id: 16,
      deadline: "2025-06-01",
      description: t("home.roadmap.item[15].description"),
    },
  ]);
  return {
    roadmap: computed(() => roadmapItems.value),
  };
};
