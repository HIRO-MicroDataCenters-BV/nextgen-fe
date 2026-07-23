<template>
  <section class="border-b border-border">
    <div class="mx-auto w-full max-w-[1200px] px-8 py-16">
      <Tabs default-value="for_researchers" class="w-full">
        <div class="mb-10 flex justify-center">
          <TabsList>
            <TabsTrigger value="for_researchers">
              {{ t("action.for_researchers") }}
            </TabsTrigger>
            <TabsTrigger value="for_data_providers">
              {{ t("action.for_data_providers") }}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          v-for="group in groups"
          :key="group.value"
          :value="group.value"
        >
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <article
              v-for="card in group.cards"
              :key="card.img"
              class="overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
            >
              <img :src="card.img" :alt="card.title" class="w-full">
              <div class="p-5">
                <h3 class="mb-1.5 text-sm font-medium">{{ card.title }}</h3>
                <p class="text-sm leading-relaxed text-muted-foreground">
                  {{ card.desc }}
                </p>
              </div>
            </article>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  </section>
</template>

<script setup lang="ts">
const { t } = useI18n();

// Value props reused verbatim from the home page's "For Researchers" /
// "For Data Providers" cards (illustrations + home.card copy).
const groups = computed(() => [
  {
    value: "for_researchers",
    cards: [
      { img: "/images/folder2.png", title: t("home.card[0].title"), desc: t("home.card[0].description") },
      { img: "/images/shield.png", title: t("home.card[1].title"), desc: t("home.card[1].description") },
      { img: "/images/processor.png", title: t("home.card[2].title"), desc: t("home.card[2].description") },
    ],
  },
  {
    value: "for_data_providers",
    cards: [
      { img: "/images/folder.png", title: t("home.card[3].title"), desc: t("home.card[3].description") },
      { img: "/images/lock.png", title: t("home.card[4].title"), desc: t("home.card[4].description") },
      { img: "/images/glass.png", title: t("home.card[5].title"), desc: t("home.card[5].description") },
    ],
  },
]);
</script>
