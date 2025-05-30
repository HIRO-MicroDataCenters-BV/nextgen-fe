<template>
  <div class="container mx-auto p-6 max-w-4xl">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">ID Encoder/Decoder</h1>
      <p class="text-muted-foreground">
        Утилита для кодирования ID в формате URL в стабильный хэш и обратного
        декодирования
      </p>
    </div>

    <div class="grid gap-6 md:grid-cols-2">
      <!-- Ввод данных -->
      <Card>
        <CardHeader>
          <CardTitle>Ввод данных</CardTitle>
          <CardDescription>
            Введите ID в формате URL или закодированный хэш
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="input">ID или хэш</Label>
            <Textarea
              id="input"
              v-model="inputValue"
              placeholder="http://neo4j.com/base/e7814d5a-150a-4e5f-b1ca-b2f98beffc81"
              class="min-h-[100px]"
            />
          </div>

          <div class="flex items-center space-x-2">
            <Badge
              :variant="
                inputType === 'id'
                  ? 'default'
                  : inputType === 'hash'
                  ? 'secondary'
                  : 'destructive'
              "
            >
              {{ inputTypeLabel }}
            </Badge>
            <Badge v-if="isValidInput" variant="outline" class="text-green-600">
              ✓ Валидный
            </Badge>
            <Badge
              v-else-if="inputValue"
              variant="outline"
              class="text-red-600"
            >
              ✗ Невалидный
            </Badge>
          </div>

          <div class="flex flex-wrap gap-2">
            <Button
              @click="encode"
              :disabled="inputType !== 'id'"
              variant="default"
            >
              Кодировать в хэш
            </Button>
            <Button
              @click="decode"
              :disabled="inputType !== 'hash'"
              variant="secondary"
            >
              Декодировать в ID
            </Button>
            <Button
              @click="convert"
              :disabled="!isValidInput"
              variant="outline"
            >
              Авто-конвертация
            </Button>
            <Button @click="clear" variant="ghost"> Очистить </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Результат -->
      <Card>
        <CardHeader>
          <CardTitle>Результат</CardTitle>
          <CardDescription>
            Результат кодирования/декодирования
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="result">Результат</Label>
            <Textarea
              id="result"
              v-model="result"
              readonly
              class="min-h-[100px] bg-muted"
              placeholder="Результат появится здесь..."
            />
          </div>

          <div class="flex items-center justify-between">
            <Button
              @click="copyResult"
              :disabled="!result"
              variant="outline"
              size="sm"
            >
              <Icon name="lucide:copy" class="w-4 h-4 mr-2" />
              Копировать
            </Button>

            <div v-if="result" class="text-sm text-muted-foreground">
              Длина: {{ result.length }} символов
            </div>
          </div>

          <!-- Ошибка -->
          <div
            v-if="error"
            class="p-3 bg-destructive/10 border border-destructive/20 rounded-md"
          >
            <p class="text-sm text-destructive font-medium">Ошибка:</p>
            <p class="text-sm text-destructive">{{ error }}</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Примеры -->
    <Card class="mt-6">
      <CardHeader>
        <CardTitle>Примеры использования</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid gap-4 md:grid-cols-2">
          <div v-for="example in examples" :key="example.id" class="space-y-2">
            <div class="flex items-center justify-between">
              <h4 class="font-medium">{{ example.title }}</h4>
              <Button
                @click="loadExample(example.id)"
                variant="ghost"
                size="sm"
              >
                Загрузить
              </Button>
            </div>
            <div class="text-sm text-muted-foreground break-all">
              {{ example.id }}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Документация -->
    <Card class="mt-6">
      <CardHeader>
        <CardTitle>Как использовать в коде</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div>
            <h4 class="font-medium mb-2">Импорт утилит:</h4>
            <pre
              class="bg-muted p-3 rounded-md text-sm overflow-x-auto"
            ><code>import { encodeId, decodeId, convertId } from '~/utils';</code></pre>
          </div>

          <div>
            <h4 class="font-medium mb-2">Использование композабла:</h4>
            <pre
              class="bg-muted p-3 rounded-md text-sm overflow-x-auto"
            ><code>const { encode, decode, convert } = useIdEncoder();</code></pre>
          </div>

          <div>
            <h4 class="font-medium mb-2">Примеры кода:</h4>
            <pre
              class="bg-muted p-3 rounded-md text-sm overflow-x-auto"
            ><code>// Кодирование
const hash = encodeId('http://neo4j.com/base/123');

// Декодирование
const id = decodeId(hash);

// Автоматическая конвертация
const result = convertId(input);</code></pre>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useIdEncoder } from "~/composables/useIdEncoder";
import { useToaster } from "~/composables/useToaster";

// Композаблы
const {
  inputValue,
  result,
  error,
  isValidInput,
  inputType,
  encode: encodeId,
  decode: decodeId,
  convert: convertId,
  clear,
  copyResult: copyToClipboard,
} = useIdEncoder();

const { showToast } = useToaster();

// Вычисляемые свойства
const inputTypeLabel = computed(() => {
  switch (inputType.value) {
    case "id":
      return "URL ID";
    case "hash":
      return "Хэш";
    case "invalid":
      return "Невалидный";
    default:
      return "Неизвестно";
  }
});

// Примеры для тестирования
const examples = [
  {
    title: "Neo4j ID",
    id: "http://neo4j.com/base/e7814d5a-150a-4e5f-b1ca-b2f98beffc81",
  },
  {
    title: "API Resource",
    id: "https://api.example.com/v1/resources/12345",
  },
  {
    title: "Local Resource",
    id: "http://localhost:3000/api/users/user-123-456",
  },
  {
    title: "Complex URL",
    id: "https://example.org/path/to/resource?param=value&id=123",
  },
];

// Методы
const encode = async () => {
  try {
    encodeId();
    showToast("ID успешно закодирован", "success");
  } catch (err) {
    showToast("Ошибка кодирования", "error");
  }
};

const decode = async () => {
  try {
    decodeId();
    showToast("Хэш успешно декодирован", "success");
  } catch (err) {
    showToast("Ошибка декодирования", "error");
  }
};

const convert = async () => {
  try {
    convertId();
    showToast("Конвертация выполнена", "success");
  } catch (err) {
    showToast("Ошибка конвертации", "error");
  }
};

const copyResult = async () => {
  const success = await copyToClipboard();
  if (success) {
    showToast("Результат скопирован в буфер обмена", "success");
  } else {
    showToast("Ошибка копирования", "error");
  }
};

const loadExample = (exampleId: string) => {
  inputValue.value = exampleId;
  showToast("Пример загружен", "info");
};

// Мета-данные страницы
useHead({
  title: "ID Encoder/Decoder",
  meta: [
    {
      name: "description",
      content:
        "Утилита для кодирования ID в формате URL в стабильный хэш и обратного декодирования",
    },
  ],
});
</script>
