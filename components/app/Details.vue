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
              <template v-else-if="item.type === 'bytes'">
                <span class="text-gray-900 font-mono">{{
                  formatByteSize(item.value)
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
import { useDetailsView } from "~/composables/useDetailsView";

interface Props {
  data: unknown;
}

const props = defineProps<Props>();
const dayjs = useDayjs();
const {
  flattenData,
  formatLabel,
  getDisplayValue,
  formatDateValue,
  formatNumberValue,
  formatByteSize,
  isUrl,
  isBooleanLike,
  toBoolean,
  booleanLabel,
  isEmptyValue,
} = useDetailsView(dayjs);

const flattenedData = computed(() => {
  if (!props.data) return [];
  return flattenData(props.data);
});
</script>