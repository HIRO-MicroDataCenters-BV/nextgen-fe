<template>
  <form class="space-y-5" @submit.prevent="submit">
    <Alert v-if="error" :variant="error.destructive ? 'destructive' : 'default'">
      <TriangleAlert aria-hidden="true" />
      <AlertTitle>{{ error.title }}</AlertTitle>
      <AlertDescription>{{ error.description }}</AlertDescription>
    </Alert>

    <div class="grid gap-2">
      <Label :id="labelId">{{ t("login.key.label") }}</Label>

      <div
        v-if="key"
        class="flex min-h-11 items-center justify-between gap-2 rounded-[10px] border bg-muted/50 px-3 py-2"
        :class="{ 'opacity-70': status === 'verifying' }"
      >
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <KeyRound aria-hidden="true" class="size-4 shrink-0 text-muted-foreground" />
          <span class="min-w-0 truncate text-[0.8rem] font-medium">
            {{ key.fileName }}
          </span>
          <CircleCheck
            v-if="status !== 'verifying'"
            aria-hidden="true"
            class="size-4 shrink-0 text-green-600"
          />
        </div>
        <button
          v-if="status !== 'verifying'"
          type="button"
          class="flex shrink-0 cursor-pointer items-center justify-center rounded-md p-1 text-muted-foreground outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring/50"
          :aria-label="t('login.key.remove')"
          @click="removeKey"
        >
          <X aria-hidden="true" class="size-3.5" />
        </button>
      </div>

      <label
        v-else
        class="flex min-h-11 cursor-pointer items-center gap-2 rounded-[10px] border-[1.5px] border-dashed px-3.5 py-2.5 transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50"
        :class="
          dragging
            ? 'border-primary bg-primary/[0.07]'
            : 'border-border bg-muted/30 hover:border-primary hover:bg-primary/[0.04]'
        "
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        <input
          type="file"
          class="sr-only"
          :aria-labelledby="labelId"
          :disabled="status === 'loading_file'"
          @change="onInputChange"
        >
        <LoaderCircle
          v-if="status === 'loading_file'"
          aria-hidden="true"
          class="size-5 shrink-0 animate-spin text-muted-foreground"
        />
        <component
          :is="dragging ? Download : Upload"
          v-else
          aria-hidden="true"
          class="size-5 shrink-0"
          :class="dragging ? 'text-primary' : 'text-muted-foreground'"
        />
        <span class="flex-1 text-[0.8rem] text-muted-foreground">
          <span class="font-medium text-primary underline underline-offset-2">
            {{ t("action.click_to_browse") }}
          </span>
          {{ t("label.or_drag_drop") }}
        </span>
      </label>

      <p class="flex items-center gap-1.5 px-0.5 py-1 text-xs text-muted-foreground">
        <Lock aria-hidden="true" class="size-3.5 shrink-0" />
        {{ t("login.key.privacy") }}
      </p>
    </div>

    <div
      v-if="key && status === 'ready'"
      class="grid gap-1 rounded-[10px] border bg-card p-3"
    >
      <span class="text-xs text-muted-foreground">
        {{ t("login.key.signing_in_as") }}
      </span>
      <span class="break-all font-mono text-[13px] leading-5">{{ key.aid }}</span>
    </div>

    <ol
      v-if="status === 'verifying'"
      class="grid gap-3 rounded-[10px] border bg-card p-4"
      aria-live="polite"
    >
      <li
        v-for="step in KERI_LOGIN_STEPS"
        :key="step"
        class="flex items-center gap-2.5 text-sm"
        :class="{
          'font-medium': stepState(step) === 'active',
          'text-muted-foreground': stepState(step) === 'pending',
        }"
      >
        <CircleCheck
          v-if="stepState(step) === 'done'"
          aria-hidden="true"
          class="size-4 shrink-0 text-green-600"
        />
        <LoaderCircle
          v-else-if="stepState(step) === 'active'"
          aria-hidden="true"
          class="size-4 shrink-0 animate-spin"
        />
        <Circle v-else aria-hidden="true" class="size-4 shrink-0 text-border" />
        {{ t(`login.key.steps.${step}`) }}
      </li>
    </ol>

    <!-- While verifying, aria-disabled rather than disabled: disabling the focused
         button would drop keyboard focus out of the dialog. -->
    <Button
      type="submit"
      class="group h-11 w-full text-sm font-medium shadow-sm transition-shadow hover:shadow-md aria-disabled:pointer-events-none aria-disabled:opacity-50"
      :disabled="status !== 'verifying' && !canSubmit && !canRetry"
      :aria-disabled="status === 'verifying' || undefined"
    >
      <template v-if="canRetry">
        <RefreshCw aria-hidden="true" class="size-4" />
        {{ t("action.try_again") }}
      </template>
      <template v-else>
        {{ status === "verifying" ? t("action.please_wait") : t("action.login") }}
        <ArrowRight
          v-if="status !== 'verifying'"
          aria-hidden="true"
          class="size-4 transition-transform group-hover:translate-x-0.5"
        />
      </template>
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
import {
  ArrowRight,
  Circle,
  CircleCheck,
  Download,
  KeyRound,
  LoaderCircle,
  Lock,
  RefreshCw,
  TriangleAlert,
  Upload,
  X,
} from "lucide-vue-next";
import {
  KERI_KEY_FILE_MAX_BYTES,
  KERI_LOGIN_STEPS,
  createKeriLoginFlow,
  type KeriLoginErrorCode,
} from "~/composables/auth/keriLogin";
import {
  createMockKeriAuthClient,
  unavailableKeriAuthClient,
} from "~/composables/auth/keriAuthClient";

const emit = defineEmits<{ (e: "success"): void }>();

const { t } = useI18n();

// `useAuthUser` persists the profile through watchers. Here sign-in completes after an
// `await`, and `success` closes the dialog — unmounting this form in the same flush that
// would write the profile, which disposes a component-scoped watcher before it runs.
// A detached scope keeps the write alive; it is stopped once that flush has finished.
const authScope = effectScope(true);
const { setAuthUser } = authScope.run(useAuthUser) as ReturnType<typeof useAuthUser>;
onUnmounted(() => nextTick(() => authScope.stop()));

// TODO: replace with the real KERI backend client once it exists. The mock is
// dev-only and verifies nothing; production builds report "not available".
const {
  status,
  key,
  errorCode,
  canSubmit,
  canRetry,
  loadFile,
  signIn,
  stepState,
  removeKey,
  reset,
} = createKeriLoginFlow(
  import.meta.dev ? createMockKeriAuthClient() : unavailableKeriAuthClient,
);

const labelId = useId();
const dragging = ref(false);

const DESTRUCTIVE_ERRORS: ReadonlySet<KeriLoginErrorCode> = new Set([
  "invalid_key_file",
  "empty_key_file",
  "key_file_too_large",
  "key_replaced",
]);

const maxSize = `${KERI_KEY_FILE_MAX_BYTES / 1024} KB`;

const error = computed(() => {
  const code = errorCode.value;
  if (!code) return null;
  return {
    title: t(`login.key.errors.${code}.title`),
    description: t(`login.key.errors.${code}.description`, { maxSize }),
    destructive: DESTRUCTIVE_ERRORS.has(code),
  };
});

const onInputChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  // Clear so choosing the same file again still fires `change`.
  input.value = "";
  if (file) loadFile(file);
};

const onDrop = (event: DragEvent) => {
  dragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) loadFile(file);
};

const submit = async () => {
  if (!canSubmit.value && !canRetry.value) return;
  const profile = await signIn();
  if (!profile) return;
  setAuthUser(profile);
  emit("success");
};

// Drop the loaded key as soon as the form goes away (dialog closed or signed in).
onBeforeUnmount(reset);
</script>
