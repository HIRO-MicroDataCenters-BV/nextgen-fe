<template>
  <div class="container-main px-4 w-4xl mx-auto max-w-full">
    <div
      class="flex flex-col gap-4 justify-center items-center w-sm max-w-full mx-auto text-center mb-8"
    >
      <div class="flex justify-center items-center w-full mb-2">
        <img src="/images/logo.svg" class="size-8" alt="cog-logo" />
      </div>
      <h1 class="text-4xl font-bold">{{ $t("app.title") }}</h1>
      <p class="text-sm text-black">
        {{ $t("app.description") }}
      </p>
    </div>
    <div>
      <Tabs default-value="for_researchers">
        <div class="flex justify-center items-center w-full mb-12">
          <TabsList
            class="flex w-[290px] mx-auto justify-center items-center mx-auto"
          >
            <TabsTrigger value="for_researchers">
              {{ $t("action.for_researchers") }}
            </TabsTrigger>
            <TabsTrigger value="for_data_providers">
              {{ $t("action.for_data_providers") }}
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="for_researchers">
          <div class="flex justify-center items-start w-full mb-12 gap-6">
            <div class="overflow-hidden rounded-xl w-[256px]">
              <div>
                <img src="/images/folder2.png" class="max-w-full" />
              </div>
              <div class="card-content p-4">
                <h4 class="text-sm mb-2">{{ $t("home.card[0].title") }}</h4>
                <p class="text-sm text-gray-500">
                  {{ $t("home.card[0].description") }}
                </p>
              </div>
            </div>
            <div class="overflow-hidden rounded-xl w-[256px]">
              <div>
                <img src="/images/shield.png" class="max-w-full" />
              </div>
              <div class="card-content p-4">
                <h4 class="text-sm mb-2">{{ $t("home.card[1].title") }}</h4>
                <p class="text-sm text-gray-500">
                  {{ $t("home.card[1].description") }}
                </p>
              </div>
            </div>
            <div class="overflow-hidden rounded-xl w-[256px]">
              <div>
                <img src="/images/processor.png" class="max-w-full" />
              </div>
              <div class="card-content p-4">
                <h4 class="text-sm mb-2">{{ $t("home.card[2].title") }}</h4>
                <p class="text-sm text-gray-500">
                  {{ $t("home.card[2].description") }}
                </p>
              </div>
            </div>
          </div>
          <div class="flex justify-center items-center w-full mb-12 px-4">
            <AppRoadmap />
          </div>
          <div class="flex justify-center items-center w-full mb-12 px-4">
            <div class="result overflow-hidden rounded-xl p-8 w-full">
              <div class="w-[400px] w-max-full">
                <h3 class="text-2xl font-semibold mb-2">
                  {{ $t("home.footer.title") }}
                </h3>
                <h4 class="text-sm font-normal text-gray-500 mb-8">
                  {{ $t("home.footer.subtitle") }}
                </h4>
                <p class="text-sm mb-4">
                  {{ $t("home.footer.description") }}
                </p>
                <p class="text-sm">
                  {{ $t("home.footer.result") }}
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="for_data_providers">
          <div class="flex justify-center items-start w-full mb-12 gap-6">
            <div class="overflow-hidden rounded-xl w-[256px]">
              <div>
                <img src="/images/folder.png" class="max-w-full" />
              </div>
              <div class="card-content p-4">
                <h4 class="text-sm mb-2">{{ $t("home.card[3].title") }}</h4>
                <p class="text-sm text-gray-500">
                  {{ $t("home.card[3].description") }}
                </p>
              </div>
            </div>
            <div class="overflow-hidden rounded-xl w-[256px]">
              <div>
                <img src="/images/lock.png" class="max-w-full" />
              </div>
              <div class="card-content p-4">
                <h4 class="text-sm mb-2">{{ $t("home.card[4].title") }}</h4>
                <p class="text-sm text-gray-500">
                  {{ $t("home.card[4].description") }}
                </p>
              </div>
            </div>
            <div class="overflow-hidden rounded-xl w-[256px]">
              <div>
                <img src="/images/glass.png" class="max-w-full" />
              </div>
              <div class="card-content p-4">
                <h4 class="text-sm mb-2">{{ $t("home.card[5].title") }}</h4>
                <p class="text-sm text-gray-500">
                  {{ $t("home.card[5].description") }}
                </p>
              </div>
            </div>
          </div>
          <div class="flex justify-center items-center w-full mb-12 px-4">
            <AppRoadmap />
          </div>
          <div class="flex justify-center items-center w-full mb-12 px-4">
            <div class="result overflow-hidden rounded-xl p-8 w-full">
              <div class="w-[400px] w-max-full">
                <h3 class="text-2xl font-semibold mb-2">
                  {{ $t("home.footer.title") }}
                </h3>
                <h4 class="text-sm font-normal text-gray-500 mb-8">
                  {{ $t("home.footer.subtitle") }}
                </h4>
                <p class="text-sm mb-4">
                  {{ $t("home.footer.description") }}
                </p>
                <p class="text-sm">
                  {{ $t("home.footer.result") }}
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
    <footer class="text-sm text-gray-500 text-center mt-12">
      {{ $t("app.copyright", { year: new Date().getFullYear() }) }}
    </footer>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n();
</script>

<style>
.container-main {
  background-image: url("/images/bg-home.png");
  background-position: center top;
  background-repeat: no-repeat;
}
.result {
  background-image: url("/images/hart.png");
  background-position: right top;
  background-repeat: no-repeat;
  background-size: contain;
}
</style>
