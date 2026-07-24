<template>
  <form class="space-y-5" @submit.prevent="onSubmit">
    <FormField v-slot="{ componentField }" name="email">
      <FormItem>
        <FormLabel>{{ t("label.email") }}</FormLabel>
        <FormControl>
          <div class="relative">
            <Mail
              aria-hidden="true"
              class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="email"
              autocomplete="email"
              class="h-11 pl-9"
              :placeholder="t('placeholder.email')"
              v-bind="componentField"
            />
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" name="password">
      <FormItem>
        <div class="flex items-center justify-between">
          <FormLabel>{{ t("label.password") }}</FormLabel>
          <button
            type="button"
            class="rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none transition-colors hover:text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
            @click="handleForgotPassword"
          >
            {{ t("login.forgot") }}
          </button>
        </div>
        <FormControl>
          <div class="relative">
            <Lock
              aria-hidden="true"
              class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              class="h-11 px-9"
              :placeholder="t('placeholder.password')"
              v-bind="componentField"
            />
            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
              :aria-label="
                showPassword ? t('login.hide_password') : t('login.show_password')
              "
              @click="showPassword = !showPassword"
            >
              <component
                :is="showPassword ? EyeOff : Eye"
                aria-hidden="true"
                class="size-4"
              />
            </button>
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <Button
      type="submit"
      class="group h-11 w-full text-sm font-medium shadow-sm transition-shadow hover:shadow-md"
      :disabled="loading"
    >
      {{ loading ? t("action.please_wait") : t("action.login") }}
      <ArrowRight
        v-if="!loading"
        aria-hidden="true"
        class="size-4 transition-transform group-hover:translate-x-0.5"
      />
    </Button>

    <p class="text-center text-sm text-muted-foreground">
      {{ t("login.no_account") }}
      <span class="font-medium text-foreground">
        {{ t("login.contact_admin") }}
      </span>
    </p>
  </form>
</template>

<script setup lang="ts">
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-vue-next";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const emit = defineEmits<{ (e: "success"): void }>();

const { t } = useI18n();
const { setAuthUser } = useAuthUser();
const toaster = useToaster();

const loading = ref(false);
const showPassword = ref(false);

const formSchema = toTypedSchema(
  z.object({
    email: z.string().min(1).email(),
    password: z.string().min(1),
  }),
);

const { handleSubmit } = useForm({
  validationSchema: formSchema,
  initialValues: {
    email: "",
    password: "",
  },
});

const onSubmit = handleSubmit((values) => {
  loading.value = true;
  // TODO: wire real authentication (Dex/OIDC via server/utils/dex-auth.ts).
  // For now this keeps the existing local stub: store the profile and let the
  // host (dialog / shell) react — signing in flips `isSignedIn`, which swaps the
  // guest shell for the authenticated sidebar in place.
  setAuthUser({
    email: values.email,
    name: values.email.split("@")[0]?.trim() || values.email,
  });
  emit("success");
});

// TODO: no password-reset flow exists yet — placeholder feedback until it's built.
const handleForgotPassword = () => {
  toaster.show("info", t("login.forgot_hint"));
};
</script>
