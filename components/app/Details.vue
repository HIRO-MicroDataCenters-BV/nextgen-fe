<template>
  <div v-if="data" class="px-10">
    <Table class="w-full table-fixed">
      <TableBody>
        <TableRow
          v-for="(item, index) in flattenedData"
          :key="`content-item-${index}`"
        >
          <TableCell
            class="text-left pb-4 pr-8 border-none text-gray-400 uppercase align-top overflow-hidden"
          >
            <span class="w-full overflow-elipsis overflow-hidden">
              {{ formatLabel(item.key) }}
            </span>
          </TableCell>
          <TableCell class="text-left pb-4 pr-8 border-none py-8">
            <!-- String/Text -->
            <template v-if="item.type === 'string'">
              <span class="text-gray-900">{{ item.value }}</span>
            </template>

            <!-- Date -->
            <template v-if="item.type === 'date'">
              <span class="text-gray-900">
                {{ dayjs(item.value).format("YYYY-MM-DD HH:mm:ss") }}
              </span>
            </template>

            <!-- Boolean -->
            <template v-if="item.type === 'boolean'">
              <Icon name="lucide:check" />
            </template>

            <!-- Array -->
            <template v-if="item.type === 'array'">
              <div class="flex flex-wrap gap-2">
                <Badge
                  v-for="(arrayItem, arrayIndex) in item.value"
                  :key="arrayIndex"
                  variant="secondary"
                >
                  {{ getDisplayValue(arrayItem) }}
                </Badge>
              </div>
            </template>

            <!-- Object -->
            <template v-if="item.type === 'object'">
              <div class="space-y-2">
                <div
                  v-for="(objValue, objKey) in item.value"
                  :key="objKey"
                  class="flex items-center gap-2"
                >
                  <span class="text-sm text-gray-500 min-w-20 overflow-hidden"
                    >{{ objKey }}:</span
                  >
                  <span class="text-gray-900">{{
                    getDisplayValue(objValue)
                  }}</span>
                </div>
              </div>
            </template>

            <!-- Number -->
            <template v-if="item.type === 'number'">
              <span class="text-gray-900 font-mono">{{ item.value }}</span>
            </template>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>

<script lang="ts" setup>
import { Badge } from "~/components/ui/badge";
import { Table, TableBody, TableCell, TableRow } from "~/components/ui/table";

interface Props {
  data: unknown;
}

const props = defineProps<Props>();
const dayjs = useDayjs();

const flattenedData = computed(() => {
  if (!props.data) return [];
  return flattenData(props.data);
});

// Helper function to determine data type
function getDataType(value: unknown): string {
  if (value === null || value === undefined) return "string";
  if (typeof value === "boolean") return "boolean";
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
  if(key.includes('.')){
    const parts = key.split('.');
    const end = parts[parts.length - 1];

    let result = parts[0]
    if(end.includes('/')){
      const endParts = end.split('/');
      if(endParts.length > 1){
        result += ` / ${endParts[endParts.length - 1]}`;
      } 
    } else {
      result += ` / ${end}`;
    }
    return result;
  }
  return key
}

// Helper function to get display value for complex objects
function getDisplayValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if (value.label) return value.label;
    if (value.name) return value.name;
    if (value.title) return value.title;
    if (value.id) return value.id;
    return JSON.stringify(value);
  }
  
  const stringValue = String(value);
  
  // Check if the string looks like a URL and contains slashes
  if (stringValue.includes('/') && (stringValue.startsWith('http') || stringValue.includes('://'))) {
    const parts = stringValue.split('/');
    return parts[parts.length - 1] || stringValue;
  }
  
  return stringValue;
}

// Function to flatten nested data into a flat structure
function flattenData(data: unknown, prefix = ""): unknown[] {
  const result = [];

  for (const [key, value] of Object.entries(data)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const type = getDataType(value);

    // Skip certain system keys
    if (key.startsWith("@") || key === "type") continue;

    if (type === "object" && value && !Array.isArray(value)) {
      // For simple objects, show as object type
      if (Object.keys(value).length <= 5) {
        result.push({
          key: fullKey,
          value,
          type: "object",
        });
      } else {
        // For complex objects, flatten them
        result.push(...flattenData(value, fullKey));
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