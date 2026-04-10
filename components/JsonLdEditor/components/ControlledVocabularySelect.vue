<script setup lang="ts">
import { computed } from 'vue';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VocabularyOption {
  value: string;      // canonical URI emitted on selection
  label: string;
  description?: string;
  chipLabel?: string;
  icon?: string;
  /** Lowercase local-name fragments that identify this option (for fuzzy matching) */
  match: string[];
}

interface Props {
  modelValue: string;
  vocabulary: import('../types/editor.types').ControlledVocabulary;
  readonly?: boolean;
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  placeholder: 'Select...',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

/**
 * Extract and normalise the local name from any URI form:
 *   http://spdx.org/rdf/terms#SHA256              → "sha256"
 *   http://spdx.org/rdf/terms#checksumAlgorithm_sha256 → "sha256"
 *   spdx:SHA256                                    → "sha256"
 *   http://data.europa.eu/r5r/AVAILABLE            → "available"
 *   http://publications.europa.eu/resource/authority/access-right/PUBLIC → "public"
 */
const normalizeUri = (uri: string): string => {
  if (!uri) return '';
  let local = uri;

  // Prefixed form  (e.g. spdx:SHA256, dcatap:AVAILABLE)
  const prefixColon = uri.indexOf(':');
  if (prefixColon !== -1 && !uri.startsWith('http') && !uri.startsWith('urn')) {
    local = uri.slice(prefixColon + 1);
  } else {
    // Full URI — take fragment or last path segment
    const hash = uri.lastIndexOf('#');
    local = hash !== -1 ? uri.slice(hash + 1) : uri.split('/').pop() ?? uri;
  }

  // Strip common SPDX-style prefixes like "checksumAlgorithm_"
  local = local.replace(/^checksumAlgorithm_/i, '');
  // Lowercase + remove separators so sha256 = SHA256 = sha_256 = SHA-256
  return local.toLowerCase().replace(/[-_\s]/g, '');
};

const vocabularies: Record<string, VocabularyOption[]> = {
  accessRights: [
    {
      value: 'http://publications.europa.eu/resource/authority/access-right/PUBLIC',
      label: 'Public', chipLabel: 'Public', icon: 'lucide:globe',
      description: 'Freely accessible to everyone',
      match: ['public'],
    },
    {
      value: 'http://publications.europa.eu/resource/authority/access-right/RESTRICTED',
      label: 'Restricted', chipLabel: 'Restricted', icon: 'lucide:lock',
      description: 'Access limited to authorised users',
      match: ['restricted'],
    },
    {
      value: 'http://publications.europa.eu/resource/authority/access-right/NON_PUBLIC',
      label: 'Non-public', chipLabel: 'Non-public', icon: 'lucide:ban',
      description: 'Not externally accessible',
      match: ['nonpublic', 'nonproblic', 'non_public'],
    },
  ],
  language: [
    { value: 'http://publications.europa.eu/resource/authority/language/ENG', label: 'English (ENG)', chipLabel: 'EN', match: ['eng', 'english', 'en'] },
    { value: 'http://publications.europa.eu/resource/authority/language/NLD', label: 'Dutch (NLD)',   chipLabel: 'NL', match: ['nld', 'dutch', 'nl'] },
    { value: 'http://publications.europa.eu/resource/authority/language/DEU', label: 'German (DEU)',  chipLabel: 'DE', match: ['deu', 'german', 'de'] },
    { value: 'http://publications.europa.eu/resource/authority/language/FRA', label: 'French (FRA)',  chipLabel: 'FR', match: ['fra', 'french', 'fr'] },
    { value: 'http://publications.europa.eu/resource/authority/language/SPA', label: 'Spanish (SPA)', chipLabel: 'ES', match: ['spa', 'spanish', 'es'] },
    { value: 'http://publications.europa.eu/resource/authority/language/ITA', label: 'Italian (ITA)', chipLabel: 'IT', match: ['ita', 'italian', 'it'] },
    { value: 'http://publications.europa.eu/resource/authority/language/RUS', label: 'Russian (RUS)', chipLabel: 'RU', match: ['rus', 'russian', 'ru'] },
  ],
  algorithm: [
    {
      value: 'http://spdx.org/rdf/terms#SHA256',
      label: 'SHA-256', chipLabel: 'SHA-256', icon: 'lucide:shield-check',
      description: 'SHA-256 (recommended)',
      match: ['sha256', 'sha2'],
    },
    {
      value: 'http://spdx.org/rdf/terms#SHA512',
      label: 'SHA-512', chipLabel: 'SHA-512', icon: 'lucide:shield',
      description: 'SHA-512',
      match: ['sha512'],
    },
    {
      value: 'http://spdx.org/rdf/terms#SHA1',
      label: 'SHA-1', chipLabel: 'SHA-1', icon: 'lucide:shield',
      description: 'SHA-1 (legacy)',
      match: ['sha1'],
    },
    {
      value: 'http://spdx.org/rdf/terms#MD5',
      label: 'MD5', chipLabel: 'MD5', icon: 'lucide:hash',
      description: 'MD5 (legacy)',
      match: ['md5'],
    },
  ],
  availability: [
    {
      value: 'http://data.europa.eu/r5r/AVAILABLE',
      label: 'Available', chipLabel: 'Available', icon: 'lucide:check-circle',
      description: 'Data is available now',
      match: ['available'],
    },
    {
      value: 'http://data.europa.eu/r5r/EXPERIMENTAL',
      label: 'Experimental', chipLabel: 'Experimental', icon: 'lucide:flask-conical',
      description: 'Available for testing purposes',
      match: ['experimental'],
    },
    {
      value: 'http://data.europa.eu/r5r/STABLE',
      label: 'Stable', chipLabel: 'Stable', icon: 'lucide:anchor',
      description: 'Stable and long-term available',
      match: ['stable'],
    },
    {
      value: 'http://data.europa.eu/r5r/TEMPORARY',
      label: 'Temporary', chipLabel: 'Temporary', icon: 'lucide:clock',
      description: 'Only temporarily available',
      match: ['temporary', 'temp'],
    },
  ],
  frequency: [
    { value: 'http://publications.europa.eu/resource/authority/frequency/ANNUAL',      label: 'Annual',      chipLabel: 'Annual',      match: ['annual'] },
    { value: 'http://publications.europa.eu/resource/authority/frequency/BIANNUAL',    label: 'Biannual',    chipLabel: 'Biannual',    match: ['biannual', 'semiannual'] },
    { value: 'http://publications.europa.eu/resource/authority/frequency/QUARTERLY',   label: 'Quarterly',   chipLabel: 'Quarterly',   match: ['quarterly'] },
    { value: 'http://publications.europa.eu/resource/authority/frequency/MONTHLY',     label: 'Monthly',     chipLabel: 'Monthly',     match: ['monthly'] },
    { value: 'http://publications.europa.eu/resource/authority/frequency/WEEKLY',      label: 'Weekly',      chipLabel: 'Weekly',      match: ['weekly'] },
    { value: 'http://publications.europa.eu/resource/authority/frequency/DAILY',       label: 'Daily',       chipLabel: 'Daily',       match: ['daily'] },
    { value: 'http://publications.europa.eu/resource/authority/frequency/IRREG',       label: 'Irregular',   chipLabel: 'Irregular',   match: ['irreg', 'irregular'] },
    { value: 'http://publications.europa.eu/resource/authority/frequency/UNKNOWN',     label: 'Unknown',     chipLabel: 'Unknown',     match: ['unknown'] },
  ],
  fileType: [
    { value: 'text/csv',               label: 'CSV',     chipLabel: 'CSV',     match: ['csv', 'textcsv'] },
    { value: 'application/json',       label: 'JSON',    chipLabel: 'JSON',    match: ['json', 'applicationjson'] },
    { value: 'application/xml',        label: 'XML',     chipLabel: 'XML',     match: ['xml', 'applicationxml'] },
    { value: 'application/zip',        label: 'ZIP',     chipLabel: 'ZIP',     match: ['zip', 'applicationzip'] },
    { value: 'application/x-tar',      label: 'TAR',     chipLabel: 'TAR',     match: ['tar', 'xtar'] },
    { value: 'application/pdf',        label: 'PDF',     chipLabel: 'PDF',     match: ['pdf', 'applicationpdf'] },
    { value: 'application/parquet',    label: 'Parquet', chipLabel: 'Parquet', match: ['parquet'] },
  ],
  theme: [
    { value: 'http://publications.europa.eu/resource/authority/data-theme/AGRI', label: 'Agriculture, fisheries, forestry and food', description: 'AGRI', match: ['agri', 'agriculture', 'fisheries', 'forestry', 'food'] },
    { value: 'http://publications.europa.eu/resource/authority/data-theme/ECON', label: 'Economy and finance', description: 'ECON', match: ['econ', 'economy', 'finance'] },
    { value: 'http://publications.europa.eu/resource/authority/data-theme/EDUC', label: 'Education, culture and sport', description: 'EDUC', match: ['educ', 'education', 'culture', 'sport'] },
    { value: 'http://publications.europa.eu/resource/authority/data-theme/ENER', label: 'Energy', description: 'ENER', match: ['ener', 'energy'] },
    { value: 'http://publications.europa.eu/resource/authority/data-theme/ENVI', label: 'Environment', description: 'ENVI', match: ['envi', 'environment', 'nature'] },
    { value: 'http://publications.europa.eu/resource/authority/data-theme/GOVE', label: 'Government and public sector', description: 'GOVE', match: ['gove', 'government', 'public', 'sector'] },
    { value: 'http://publications.europa.eu/resource/authority/data-theme/HEAL', label: 'Health', description: 'HEAL', match: ['heal', 'health', 'medical'] },
    { value: 'http://publications.europa.eu/resource/authority/data-theme/INTR', label: 'International issues', description: 'INTR', match: ['intr', 'international'] },
    { value: 'http://publications.europa.eu/resource/authority/data-theme/JUST', label: 'Justice, legal system and public safety', description: 'JUST', match: ['just', 'justice', 'legal', 'safety'] },
    { value: 'http://publications.europa.eu/resource/authority/data-theme/REGI', label: 'Regions and cities', description: 'REGI', match: ['regi', 'regions', 'cities'] },
    { value: 'http://publications.europa.eu/resource/authority/data-theme/SOCI', label: 'Population and society', description: 'SOCI', match: ['soci', 'population', 'society'] },
    { value: 'http://publications.europa.eu/resource/authority/data-theme/TECH', label: 'Science and technology', description: 'TECH', match: ['tech', 'science', 'technology'] },
    { value: 'http://publications.europa.eu/resource/authority/data-theme/TRAN', label: 'Transport', description: 'TRAN', match: ['tran', 'transport'] },
  ],
};

const options = computed(() => vocabularies[props.vocabulary] || []);

/** Fuzzy match: normalize incoming value and check against option.match keywords */
const matchesOption = (opt: VocabularyOption, incoming: string): boolean => {
  if (!incoming) return false;
  // Exact canonical URI match first
  if (opt.value === incoming) return true;
  // Normalize and compare against match keywords
  const normalised = normalizeUri(incoming);
  return opt.match.some(m => normalised === m || normalised.includes(m) || m.includes(normalised));
};

// Use chip UI when ≤ 6 options and all have chipLabel
const useChips = computed(() =>
  options.value.length <= 6 && options.value.every(o => o.chipLabel),
);

const selectedOption = computed(() =>
  options.value.find(opt => matchesOption(opt, props.modelValue)),
);

const selectedLabel = computed(() =>
  selectedOption.value?.label || props.placeholder,
);

const handleValueChange = (value: unknown) => {
  if (value && typeof value === 'string') {
    emit('update:modelValue', value);
  }
};

const selectChip = (value: string) => {
  if (props.readonly) return;
  // Toggle: clicking selected chip clears it
  const alreadySelected = selectedOption.value?.value === value;
  emit('update:modelValue', alreadySelected ? '' : value);
};
</script>

<template>
  <!-- ── Chip mode (≤ 6 options) ───────────────── -->
  <div v-if="useChips" class="chip-group" :class="{ 'chip-group--disabled': readonly }">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="chip"
      :class="{ 'chip--selected': selectedOption?.value === option.value }"
      :disabled="readonly"
      :title="option.description"
      @click="selectChip(option.value)"
    >
      <Icon v-if="option.icon" :name="option.icon" class="size-3.5 shrink-0" />
      {{ option.chipLabel }}
    </button>
  </div>

  <!-- ── Dropdown mode (> 6 options) ──────────── -->
  <Select v-else :model-value="selectedOption?.value || modelValue" :disabled="readonly" @update:model-value="handleValueChange">
    <SelectTrigger class="w-full">
      <SelectValue :placeholder="placeholder">
        {{ selectedLabel }}
      </SelectValue>
    </SelectTrigger>
    <SelectContent>
      <SelectItem v-for="option in options" :key="option.value" :value="option.value">
        <div class="flex flex-col">
          <span>{{ option.label }}</span>
          <span v-if="option.description" class="text-xs text-muted-foreground">
            {{ option.description }}
          </span>
        </div>
      </SelectItem>
    </SelectContent>
  </Select>
</template>

<style scoped>
/* ── Chip group ──────────────────────────────────────────────── */
.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  width: 100%;
}
.chip-group--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  border: 1.5px solid hsl(var(--border));
  background: hsl(var(--background));
  color: hsl(var(--muted-foreground));
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  line-height: 1.4;
}

.chip:hover:not(:disabled) {
  border-color: hsl(var(--foreground) / 0.4);
  color: hsl(var(--foreground));
  background: hsl(var(--muted) / 0.5);
}

.chip--selected {
  background: #4f46e5 !important;
  border-color: #4f46e5 !important;
  color: #ffffff !important;
  font-weight: 600 !important;
  box-shadow: 0 1px 6px rgba(79, 70, 229, 0.4);
}

.chip--selected:hover:not(:disabled) {
  background: #4338ca !important;
  border-color: #4338ca !important;
  color: #ffffff !important;
}
</style>

