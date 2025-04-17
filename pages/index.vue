<template>
  <div class="flex h-screen w-full">
    <!-- Левая часть с формой авторизации -->
    <div class="w-1/2 flex items-center justify-center bg-background p-8">
      <div class="w-full max-w-md space-y-6">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold">{{ t("pages.home.login_title") }}</h1>
          <p class="text-muted-foreground mt-2">
            {{ t("pages.home.login_subtitle") }}
          </p>
        </div>

        <Form @submit="handleLogin" class="space-y-4">
          <FormItem class="space-y-2">
            <FormField v-model="email" name="email">
              <FormLabel for="email">{{ t("pages.home.email") }}</FormLabel>
              <Input
                id="email"
                type="email"
                :placeholder="t('pages.home.email_placeholder')"
                required
              />
            </FormField>
          </FormItem>

          <FormItem class="space-y-2">
            <FormField v-model="password" name="password">
              <FormLabel for="password">{{
                t("pages.home.password")
              }}</FormLabel>
              <Input
                id="password"
                type="password"
                :placeholder="t('pages.home.password_placeholder')"
                required
              />
            </FormField>
          </FormItem>

          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <Checkbox id="remember" v-model="remember" />
              <label for="remember" class="text-sm">{{
                t("pages.home.remember_me")
              }}</label>
            </div>
            <a href="#" class="text-sm text-primary hover:underline">{{
              t("pages.home.forgot_password")
            }}</a>
          </div>

          <Button type="submit" class="w-full">{{
            t("pages.home.login_button")
          }}</Button>
        </Form>
      </div>
    </div>

    <!-- Правая часть с фоновым изображением и комментарием -->
    <div class="w-1/2 bg-primary relative overflow-hidden">
      <div
        class="absolute inset-0 bg-cover bg-center"
        style="
          background-image: url('/images/login-background.svg');
          opacity: 0.7;
        "
      ></div>
      <div
        class="relative z-10 flex flex-col justify-center items-center h-full text-white p-8"
      >
        <div class="max-w-md text-center">
          <h2 class="text-2xl font-bold mb-4">
            {{ t("pages.home.welcome_message") }}
          </h2>
          <p class="text-lg">{{ t("pages.home.welcome_description") }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";

// Указываем использование лейаута auth
definePageMeta({
  layout: "auth",
});

const { t } = useI18n();
const router = useRouter();

// Состояние формы
const email = ref("");
const password = ref("");
const remember = ref(false);

// Обработчик входа
const handleLogin = () => {
  // Здесь будет логика аутентификации
  // Для демонстрации просто перенаправляем на страницу Marketplace
  router.push("/marketplace");
};
</script>
