<template>
  <section>
    <div class="mx-auto w-full max-w-[1200px] px-8 py-16">
      <div
        class="result overflow-hidden rounded-xl border border-border bg-card p-8 md:p-12"
      >
        <div class="max-w-[520px]">
          <h3 class="mb-2 text-2xl font-semibold tracking-tight">
            {{ t("home.footer.title") }}
          </h3>
          <h4 class="mb-6 text-sm font-normal text-muted-foreground">
            {{ t("home.footer.subtitle") }}
          </h4>
          <p class="mb-4 text-sm leading-relaxed">
            {{ t("home.footer.description") }}
          </p>
          <p class="text-sm font-medium">
            {{ t("home.footer.result") }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { t } = useI18n();
</script>

<style scoped>
.result {
  background-image: url("/images/hart.png");
  background-position: right top;
  background-repeat: no-repeat;
  background-size: contain;
}

/* Drop the illustration on small screens so it never collides with the copy. */
@media (max-width: 767px) {
  .result {
    background-image: none;
  }
}
</style>
