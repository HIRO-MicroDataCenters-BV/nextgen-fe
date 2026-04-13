<template>
  <div
    v-if="data"
    class="flex w-full min-w-0 flex-col py-6"
  >
    <div
      class="mx-auto w-full max-w-[calc(840px+16px)] min-w-0 px-8"
    >
      <Table class="w-full table-fixed">
        <TableBody>
          <TableRow
            v-for="(item, index) in flattenedData"
            :key="`content-item-${index}`"
          >
            <TableCell
              class="whitespace-normal text-left pb-4 pr-8 border-none text-gray-400 uppercase align-top break-words"
            >
              <span class="w-full whitespace-normal break-words">
                {{ formatLabel(item.key) }}
              </span>
            </TableCell>
            <TableCell
              class="whitespace-normal text-left pb-4 pr-8 border-none py-8 break-words"
            >
              <!-- String/Text -->
              <template v-if="item.type === 'string'">
                <a
                  v-if="isUrl(item.value)"
                  :href="String(item.value)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                >
                  <span>{{ getDisplayValue(item.value) }}</span>
                  <Icon name="lucide:external-link" class="size-3" />
                </a>
                <span
                  v-else
                  :class="isEmptyValue(item.value) ? 'text-muted-foreground italic' : 'text-gray-900'"
                >
                  {{ getDisplayValue(item.value) }}
                </span>
              </template>

              <!-- Date -->
              <template v-else-if="item.type === 'date'">
                <span
                  :class="formatDateValue(item.value) === '—' ? 'text-muted-foreground italic' : 'text-gray-900'"
                >
                  {{ formatDateValue(item.value) }}
                </span>
              </template>

              <!-- Boolean -->
              <template v-else-if="item.type === 'boolean'">
                <TooltipProvider :delay-duration="200">
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <span
                        class="inline-flex items-center rounded-full p-1"
                        :class="toBoolean(item.value) ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'"
                      >
                        <Icon
                          :name="toBoolean(item.value) ? 'lucide:check' : 'lucide:x'"
                          class="size-3"
                        />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {{ booleanLabel(item.value) }}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </template>

              <!-- Array -->
              <template v-else-if="item.type === 'array'">
                <div class="flex flex-wrap gap-2">
                  <Badge
                    v-for="(arrayItem, arrayIndex) in item.value"
                    :key="arrayIndex"
                    variant="secondary"
                    class="inline-flex items-center gap-1"
                  >
                    <template v-if="isBooleanLike(arrayItem)">
                      <TooltipProvider :delay-duration="200">
                        <Tooltip>
                          <TooltipTrigger as-child>
                            <span
                              class="inline-flex items-center rounded-full p-1"
                              :class="toBoolean(arrayItem) ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'"
                            >
                              <Icon
                                :name="toBoolean(arrayItem) ? 'lucide:check' : 'lucide:x'"
                                class="size-3"
                              />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            {{ booleanLabel(arrayItem) }}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </template>
                    <template v-else>
                      <a
                        v-if="isUrl(arrayItem)"
                        :href="String(arrayItem)"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                      >
                        <span>{{ getDisplayValue(arrayItem) }}</span>
                        <Icon name="lucide:external-link" class="size-3" />
                      </a>
                      <span v-else>{{ getDisplayValue(arrayItem) }}</span>
                    </template>
                  </Badge>
                </div>
              </template>

              <!-- Object -->
              <template v-else-if="item.type === 'object'">
                <div class="space-y-2">
                  <div
                    v-for="(objValue, objKey) in item.value"
                    :key="objKey"
                    class="flex items-center gap-2"
                  >
                    <span class="text-sm text-gray-500 min-w-20 overflow-hidden"
                      >{{ objKey }}:</span
                    >
                    <span
                      v-if="isBooleanLike(objValue)"
                      class="inline-flex items-center rounded-full p-1"
                      :class="toBoolean(objValue) ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'"
                    >
                      <TooltipProvider :delay-duration="200">
                        <Tooltip>
                          <TooltipTrigger as-child>
                            <Icon
                              :name="toBoolean(objValue) ? 'lucide:check' : 'lucide:x'"
                              class="size-3"
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            {{ booleanLabel(objValue) }}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                    <a
                      v-else-if="isUrl(objValue)"
                      :href="String(objValue)"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                    >
                      <span>{{ getDisplayValue(objValue) }}</span>
                      <Icon name="lucide:external-link" class="size-3" />
                    </a>
                    <span v-else class="text-gray-900">{{
                      getDisplayValue(objValue)
                    }}</span>
                  </div>
                </div>
              </template>

              <!-- Number -->
              <template v-else-if="item.type === 'number'">
                <span class="text-gray-900 font-mono">{{
                  formatNumberValue(item.value)
                }}</span>
              </template>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Badge } from "~/components/ui/badge";
import { Table, TableBody, TableCell, TableRow } from "~/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

interface Props {
  data: unknown;
}

type FlatItem = {
  key: string;
  value: unknown;
  type: "string" | "date" | "boolean" | "array" | "object" | "number";
};

const props = defineProps<Props>();
const dayjs = useDayjs();

const flattenedData = computed(() => {
  if (!props.data) return [];
  return flattenData(props.data);
});

// Helper function to determine data type
function getDataType(value: unknown): FlatItem["type"] {
  if (value === null || value === undefined) return "string";
  if (isBooleanLike(value)) return "boolean";
  if (typeof value === "number") return "number";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  if (typeof value === "string") {
    // Check if it's a date string
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    if (dateRegex.test(value)) return "date";
    return "string";
  }
  return "string";
}

// Helper function to format labels
function formatLabel(key: string): string {
  if (key.includes(".")) {
    const parts = key.split(".");
    const end = parts[parts.length - 1] ?? "";

    let result = parts[0] ?? "";
    if (end.includes("/")) {
      const endParts = end.split("/");
      if (endParts.length > 1) {
        result += ` / ${endParts[endParts.length - 1]}`;
      }
    } else {
      result += ` / ${end}`;
    }
    return result;
  }
  return key;
}

// Helper function to get display value for complex objects
function getDisplayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (isBooleanLike(value)) return toBoolean(value) ? "True" : "False";
  if (typeof value === "string" && looksLikeDate(value)) {
    return formatDateValue(value);
  }
  if (typeof value === "number") return formatNumberValue(value);
  if (Array.isArray(value)) return value.length === 0 ? "—" : `${value.length} items`;
  if (typeof value === "object") {
    const v = value as Record<string, unknown>;
    if (typeof v.label === "string") return v.label;
    if (typeof v.name === "string") return v.name;
    if (typeof v.title === "string") return v.title;
    if (typeof v.id === "string") return v.id;
    return JSON.stringify(value, null, 0);
  }
  
  const stringValue = String(value);
  
  // Check if the string looks like a URL and contains slashes
  if (stringValue.includes('/') && (stringValue.startsWith('http') || stringValue.includes('://'))) {
    const parts = stringValue.split('/');
    return parts[parts.length - 1] || stringValue;
  }
  
  return stringValue;
}

function formatDateValue(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "—";
  const parsed = dayjs(value);
  if (!parsed.isValid()) return "—";
  return parsed.format("DD MMM YYYY, HH:mm");
}

function formatNumberValue(value: unknown): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 6,
  }).format(value);
}

function isUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return /^https?:\/\//.test(value);
}

function looksLikeDate(value: string): boolean {
  if (!value.trim()) return false;
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return true;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return true;
  return dayjs(value).isValid();
}

function isBooleanLike(value: unknown): boolean {
  if (typeof value === "boolean") return true;
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "false";
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.trim().toLowerCase() === "true";
  return Boolean(value);
}

function booleanLabel(value: unknown): string {
  return toBoolean(value) ? "True" : "False";
}

function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || value === "";
}

// Function to flatten nested data into a flat structure
function flattenData(data: unknown, prefix = ""): FlatItem[] {
  const result: FlatItem[] = [];
  if (!data || typeof data !== "object" || Array.isArray(data)) return result;
  const dataObj = data as Record<string, unknown>;

  for (const [key, value] of Object.entries(dataObj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const type = getDataType(value);

    // Skip certain system keys
    if (key.startsWith("@") || key === "type") continue;

    if (type === "object" && value && !Array.isArray(value)) {
      // For simple objects, show as object type
      const objectValue = value as Record<string, unknown>;
      if (Object.keys(objectValue).length <= 5) {
        result.push({
          key: fullKey,
          value: objectValue,
          type: "object",
        });
      } else {
        // For complex objects, flatten them
        result.push(...flattenData(objectValue, fullKey));
      }
    } else {
      result.push({
        key: fullKey,
        value,
        type,
      });
    }
  }

  return result;
}
</script>