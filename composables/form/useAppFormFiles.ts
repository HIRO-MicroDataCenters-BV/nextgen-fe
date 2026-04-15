import { ref } from "vue";

export const useAppFormFiles = ({
  uploadMmioFile,
  deleteMmioFile,
  processMmioFile,
  setFieldValue,
  validateField,
  emitClearServerErrors,
}: {
  uploadMmioFile: (file: File) => Promise<string | null>;
  deleteMmioFile: (filename: string) => Promise<boolean>;
  processMmioFile: (
    file: File,
  ) => Promise<{ extraMetadata: Record<string, unknown> | Array<Record<string, unknown>> } | null>;
  setFieldValue: (field: string, value: unknown) => void;
  validateField: (field: string) => Promise<unknown>;
  emitClearServerErrors: () => void;
}) => {
  const uploadedFiles = ref<Record<string, { filename: string; file: File | null }>>(
    {},
  );
  const uploadingFiles = ref<Record<string, boolean>>({});
  const fileInputKeys = ref<Record<string, number>>({});
  const mmioExtraMetadata = ref<Array<Record<string, unknown>> | null>(null);
  const displayedMmioFileName = ref<string | null>(null);

  const getFileFieldFile = (values: Record<string, unknown>): File | undefined => {
    const uploaded = uploadedFiles.value.file;
    if (uploaded?.file) return uploaded.file;
    const v = values.file;
    return v instanceof File ? v : undefined;
  };

  const getFileFieldFilename = (values: Record<string, unknown>): string | undefined => {
    const uploaded = uploadedFiles.value.file;
    if (uploaded?.filename) return uploaded.filename;
    const f = getFileFieldFile(values);
    if (f) return f.name;
    return displayedMmioFileName.value ?? undefined;
  };

  const hydrateExistingFile = (fieldName: string, initialValue: unknown) => {
    if (typeof initialValue !== "string") return;
    uploadedFiles.value[fieldName] = {
      filename: initialValue,
      file: null,
    };
    if (fieldName === "file") displayedMmioFileName.value = initialValue;
  };

  const clearFileField = (fieldName: string) => {
    uploadedFiles.value = Object.fromEntries(
      Object.entries(uploadedFiles.value).filter(([key]) => key !== fieldName),
    );
    setFieldValue(fieldName, undefined);
    fileInputKeys.value[fieldName] = (fileInputKeys.value[fieldName] || 0) + 1;
    if (fieldName === "file") {
      mmioExtraMetadata.value = null;
      displayedMmioFileName.value = null;
    }
  };

  const handleFileChange = async (fieldName: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files.item(0);
    if (!file) return;
    uploadingFiles.value[fieldName] = true;
    try {
      const location = await uploadMmioFile(file);
      if (!location) return;
      const filename = location.split("/").pop() || file.name;
      uploadedFiles.value[fieldName] = { filename, file };
      displayedMmioFileName.value = filename;
      setFieldValue(fieldName, file);
      await validateField(fieldName);
      emitClearServerErrors();

      if (fieldName === "file") {
        mmioExtraMetadata.value = null;
        if (file.name.endsWith(".tar") || file.name.endsWith(".json")) {
          const mmioMetadata = await processMmioFile(file);
          if (mmioMetadata) {
            const extra = mmioMetadata.extraMetadata;
            mmioExtraMetadata.value = Array.isArray(extra)
              ? extra
              : [extra as Record<string, unknown>];
          }
        }
      }
    } catch {
      clearFileField(fieldName);
    } finally {
      uploadingFiles.value[fieldName] = false;
    }
  };

  const handleFileDelete = async (fieldName: string) => {
    const uploaded = uploadedFiles.value[fieldName];
    if (!uploaded) return;
    if (uploaded.file) {
      const success = await deleteMmioFile(uploaded.filename);
      if (success) clearFileField(fieldName);
      return;
    }
    clearFileField(fieldName);
  };

  const fileToFileList = (file: File): FileList => {
    const dt = new DataTransfer();
    dt.items.add(file);
    return dt.files;
  };

  return {
    uploadedFiles,
    uploadingFiles,
    fileInputKeys,
    mmioExtraMetadata,
    displayedMmioFileName,
    getFileFieldFilename,
    hydrateExistingFile,
    handleFileChange,
    handleFileDelete,
    fileToFileList,
  };
};
