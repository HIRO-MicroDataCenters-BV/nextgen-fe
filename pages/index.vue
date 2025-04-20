<template>
  <div class="flex h-screen w-full">
    <div class="w-1/2 flex items-center justify-center bg-background p-8">
      <div class="w-full max-w-md space-y-6">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold">{{ t("pages.login.login_title") }}</h1>
          <p class="text-muted-foreground mt-2">
            {{ t("pages.login.login_subtitle") }}
          </p>
        </div>

        <Form @submit="handleLogin" class="space-y-4">
          <FormItem class="space-y-2">
            <FormField v-model="email" name="email">
              <FormLabel for="email">{{ t("pages.login.email") }}</FormLabel>
              <Input
                id="email"
                type="email"
                :placeholder="t('pages.login.email_placeholder')"
                required
              />
            </FormField>
          </FormItem>

          <FormItem class="space-y-2">
            <FormField v-model="password" name="password">
              <FormLabel for="password">{{
                t("pages.login.password")
              }}</FormLabel>
              <Input
                id="password"
                type="password"
                :placeholder="t('pages.login.password_placeholder')"
                required
              />
            </FormField>
          </FormItem>

          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <Checkbox id="remember" v-model="remember" />
              <label for="remember" class="text-sm">{{
                t("pages.login.remember_me")
              }}</label>
            </div>
            <a href="#" class="text-sm text-primary hover:underline">{{
              t("pages.login.forgot_password")
            }}</a>
          </div>

          <Button type="submit" class="w-full">{{
            t("pages.login.login_button")
          }}</Button>
        </Form>
      </div>
    </div>
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
            {{ t("pages.login.welcome_message") }}
          </h2>
          <p class="text-lg">{{ t("pages.login.welcome_description") }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
definePageMeta({
  layout: "auth",
});

const { t } = useI18n();
const router = useRouter();

const email = ref("");
const password = ref("");
const remember = ref(false);

const handleLogin = () => {
  router.push("/marketplace");
};
</script>
