<template>
  <div class="grid min-h-svh lg:grid-cols-2">
    <!-- Left: branding panel (hidden on mobile) -->
    <div
      class="relative hidden flex-col overflow-hidden bg-muted p-10 lg:flex xl:p-12"
    >
      <!-- Decorative background layers -->
      <div class="aurora pointer-events-none absolute inset-0" />
      <div class="dot-grid pointer-events-none absolute inset-0" />

      <!-- Brand -->
      <div
        class="relative z-10 flex items-center gap-2.5 text-lg font-semibold tracking-tight"
      >
        <img src="/images/logo.svg" alt="NextGen" class="size-7">
        {{ t("app.title") }}
      </div>

      <!-- Feature cards -->
      <div
        class="relative z-10 flex flex-1 flex-col items-center justify-center py-6 text-center"
      >
        <div class="w-full max-w-md space-y-8">
          <p class="text-base leading-relaxed text-muted-foreground">
            {{ t("app.description") }}
          </p>

          <div class="space-y-6">
            <div
              v-for="group in imageGroups"
              :key="group.label"
              class="space-y-3"
            >
              <p
                class="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                {{ group.label }}
              </p>
              <div class="tile-grid grid grid-cols-3 gap-4">
                <div
                  v-for="item in group.items"
                  :key="item.src"
                  class="tile-in group/tile flex flex-col items-center"
                >
                  <div
                    class="size-20 overflow-hidden rounded-xl bg-background/50 shadow-sm ring-1 ring-black/5 transition-transform duration-300 group-hover/tile:-translate-y-0.5 dark:ring-white/10"
                  >
                    <img
                      :src="item.src"
                      alt=""
                      width="264"
                      height="256"
                      loading="lazy"
                      decoding="async"
                      class="size-full object-cover"
                    >
                  </div>
                  <p class="mt-3 text-sm font-medium leading-tight text-foreground">
                    {{ item.title }}
                  </p>
                  <p class="mt-1 text-[11px] leading-snug text-muted-foreground">
                    {{ item.desc }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right: form panel -->
    <div
      class="relative flex items-center justify-center overflow-hidden bg-background p-6 lg:p-8"
    >
      <div class="form-glow pointer-events-none absolute inset-0" />

      <div
        class="relative w-full max-w-md duration-700 animate-in fade-in slide-in-from-bottom-4 motion-reduce:animate-none"
      >
        <div
          class="rounded-2xl border border-border/60 bg-card/80 p-8 shadow-xl backdrop-blur-sm sm:p-10"
        >
          <div class="space-y-8">
            <!-- Brand (mobile only) -->
            <div
              class="flex items-center justify-center gap-2.5 text-lg font-semibold tracking-tight lg:hidden"
            >
              <img src="/images/logo.svg" alt="NextGen" class="size-7">
              {{ t("app.title") }}
            </div>

            <!-- Heading -->
            <div class="space-y-2 text-center">
              <h1 class="text-2xl font-semibold tracking-tight">
                {{ t("login.title") }}
              </h1>
              <p class="text-sm text-muted-foreground">
                {{ t("login.subtitle") }}
              </p>
            </div>

            <!-- Form -->
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

              <label
                class="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground select-none"
              >
                <Checkbox v-model="rememberMe" />
                {{ t("login.remember") }}
              </label>

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
            </form>

            <!-- Footer -->
            <p class="text-center text-sm text-muted-foreground">
              {{ t("login.no_account") }}
              <span class="font-medium text-foreground">
                {{ t("login.contact_admin") }}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from "lucide-vue-next";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

definePageMeta({
  layout: "auth",
});

const { t } = useI18n();
const router = useRouter();
const { setAuthUser } = useAuthUser();
const toaster = useToaster();

useSeoMeta({
  title: () => t("login.page_title"),
});

const loading = ref(false);
const showPassword = ref(false);
const rememberMe = ref(true);

// Illustrations + copy reused from the home page's "For Researchers" / "For Data Providers" cards.
const imageGroups = computed(() => [
  {
    label: t("action.for_researchers"),
    items: [
      { src: "/images/folder2.png", title: t("home.card[0].title"), desc: t("home.card[0].description") },
      { src: "/images/shield.png", title: t("home.card[1].title"), desc: t("home.card[1].description") },
      { src: "/images/processor.png", title: t("home.card[2].title"), desc: t("home.card[2].description") },
    ],
  },
  {
    label: t("action.for_data_providers"),
    items: [
      { src: "/images/folder.png", title: t("home.card[3].title"), desc: t("home.card[3].description") },
      { src: "/images/lock.png", title: t("home.card[4].title"), desc: t("home.card[4].description") },
      { src: "/images/glass.png", title: t("home.card[5].title"), desc: t("home.card[5].description") },
    ],
  },
]);

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
  // For now this keeps the existing local stub: store the profile and redirect.
  setAuthUser({
    email: values.email,
    name: values.email.split("@")[0]?.trim() || values.email,
  });
  router.push("/marketplace");
});

// TODO: no password-reset flow exists yet — placeholder feedback until it's built.
const handleForgotPassword = () => {
  toaster.show("info", t("login.forgot_hint"));
};

// Focus the email field on load — expected UX for a single-purpose sign-in page.
onMounted(() => {
  document
    .querySelector<HTMLInputElement>('input[name="email"]')
    ?.focus({ preventScroll: true });
});
</script>

<style scoped>
/* Soft aurora gradient mesh — subtle pastel wash echoing the home illustrations. */
.aurora {
  background:
    radial-gradient(
      38% 38% at 12% 18%,
      color-mix(in oklch, oklch(0.72 0.16 350) 24%, transparent),
      transparent 72%
    ),
    radial-gradient(
      42% 42% at 88% 22%,
      color-mix(in oklch, oklch(0.72 0.15 275) 22%, transparent),
      transparent 72%
    ),
    radial-gradient(
      55% 45% at 50% 108%,
      color-mix(in oklch, oklch(0.75 0.14 230) 24%, transparent),
      transparent 72%
    );
}

.dot-grid {
  background-image: radial-gradient(
    circle at 1px 1px,
    var(--border) 1px,
    transparent 0
  );
  background-size: 22px 22px;
  -webkit-mask-image: radial-gradient(
    ellipse 80% 60% at 50% 40%,
    black 30%,
    transparent 80%
  );
  mask-image: radial-gradient(
    ellipse 80% 60% at 50% 40%,
    black 30%,
    transparent 80%
  );
}

/* Faint glow behind the form so the glass card reads with depth. */
.form-glow {
  background: radial-gradient(
    45% 38% at 50% 22%,
    color-mix(in oklch, oklch(0.72 0.15 275) 9%, transparent),
    transparent 70%
  );
}

/* Staggered entrance for the illustration tiles. */
@keyframes tile-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.tile-in {
  animation: tile-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.tile-grid > *:nth-child(2) {
  animation-delay: 90ms;
}

.tile-grid > *:nth-child(3) {
  animation-delay: 180ms;
}

@media (prefers-reduced-motion: reduce) {
  .tile-in {
    animation: none;
  }
}
</style>
