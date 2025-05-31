/**
 * Композабл для работы с кодированием/декодированием ID
 * Предоставляет реактивные функции для Vue компонентов
 */

import { ref, computed } from "vue";
import {
  encodeId,
  decodeId,
  isValidId,
  isValidHash,
  convertId,
} from "~/utils/idEncoder";

export const useIdEncoder = () => {
  const inputValue = ref("");
  const error = ref("");
  const result = ref("");

  /**
   * Проверяет валидность входного значения
   */
  const isValidInput = computed(() => {
    if (!inputValue.value) return false;
    return isValidId(inputValue.value) || isValidHash(inputValue.value);
  });

  /**
   * Определяет тип входного значения
   */
  const inputType = computed(() => {
    if (!inputValue.value) return "unknown";
    if (isValidId(inputValue.value)) return "id";
    if (isValidHash(inputValue.value)) return "hash";
    return "invalid";
  });

  /**
   * Кодирует ID в хэш
   */
  const encode = (id?: string) => {
    try {
      error.value = "";
      const idToEncode = id || inputValue.value;
      result.value = encodeId(idToEncode);
      return result.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Ошибка кодирования";
      result.value = "";
      throw err;
    }
  };

  /**
   * Декодирует хэш в ID
   */
  const decode = (hash?: string) => {
    try {
      error.value = "";
      const hashToDecode = hash || inputValue.value;
      result.value = decodeId(hashToDecode);
      return result.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Ошибка декодирования";
      result.value = "";
      throw err;
    }
  };

  /**
   * Автоматически конвертирует входное значение
   */
  const convert = (input?: string) => {
    try {
      error.value = "";
      const inputToConvert = input || inputValue.value;
      result.value = convertId(inputToConvert);
      return result.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Ошибка конвертации";
      result.value = "";
      throw err;
    }
  };

  /**
   * Очищает все значения
   */
  const clear = () => {
    inputValue.value = "";
    result.value = "";
    error.value = "";
  };

  /**
   * Копирует результат в буфер обмена
   */
  const copyResult = async () => {
    if (!result.value) return false;

    try {
      await navigator.clipboard.writeText(result.value);
      return true;
    } catch {
      // Fallback для старых браузеров
      const textArea = document.createElement("textarea");
      textArea.value = result.value;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return true;
    }
  };

  return {
    // Реактивные данные
    inputValue,
    result,
    error,

    // Вычисляемые свойства
    isValidInput,
    inputType,

    // Методы
    encode,
    decode,
    convert,
    clear,
    copyResult,

    // Утилиты (прямой доступ к функциям)
    utils: {
      encodeId,
      decodeId,
      isValidId,
      isValidHash,
      convertId,
    },
  };
};

export type IdEncoderComposable = ReturnType<typeof useIdEncoder>;
