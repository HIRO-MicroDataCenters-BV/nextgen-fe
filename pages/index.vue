<template>
  <div class="flex h-screen w-full bg-muted">
    <div class="w-full md:w-1/2 flex items-center justify-center bg-background p-8">
      <div class="w-full max-w-md space-y-6 bg-white/90 rounded-2xl shadow-xl p-8 border border-gray-100">
        <div class="flex flex-col items-center mb-8">
          <img src="/favicon-310x310.png" alt="Logo" class="w-20 h-20 mb-4 rounded-xl shadow-md" >
          <h1 class="text-3xl font-bold text-primary mb-2">{{ t('app.title') }}</h1>
        </div>

        <Form class="space-y-4" @submit="handleLogin">
          <FormItem class="space-y-2">
            <FormField v-model="email" name="email">
              <FormLabel for="email">{{ t('label.email') }}</FormLabel>
              <Input
                id="email"
                type="email"
                :placeholder="t('placeholder.email')"
                required
              />
            </FormField>
          </FormItem>

          <FormItem class="space-y-2">
            <FormField v-model="password" name="password">
              <FormLabel for="password">{{ t('label.password') }}</FormLabel>
              <Input
                id="password"
                type="password"
                :placeholder="t('placeholder.password')"
                required
              />
            </FormField>
          </FormItem>

          <Button type="submit" class="w-full mt-2">
            {{ t('action.login') }}
          </Button>
        </Form>
      </div>
    </div>
    <div class="hidden md:block w-1/2 bg-primary relative overflow-hidden">
      <div
        class="absolute inset-0 bg-cover bg-center"
        style="background-image: url('/images/login-background.jpg'); opacity: 0.7;"
      />
      <div
        class="relative z-10 flex flex-col justify-center items-center h-full text-white p-8"
      >
        <div class="max-w-md text-center bg-black/30 rounded-xl p-8 shadow-lg">
          <p class="text-base text-white/90">{{ t('app.description') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
definePageMeta({
  layout: "auth",
});

const { t } = useI18n();
const router = useRouter();

const email = ref("");
const password = ref("");

const handleLogin = () => {
  router.push("/marketplace");
};
</script>
