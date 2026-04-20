import type { z } from "zod";
import type { ApiErrorDetail } from "~/types/api.types";

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormFieldDefinition {
  name: string;
  label: string;
  type:
    | "text"
    | "select"
    | "date"
    | "textarea"
    | "checkbox"
    | "tags"
    | "file"
    | "jsonld-editor"
    | "client-selector";
  placeholder?: string;
  hint?: string | null;
  options?: FormFieldOption[];
  dataSource?: () => Promise<unknown>;
  fieldOptions?: {
    dataPath?: string;
    valueKey?: string;
    labelKey?: string;
  };
  validation?: z.ZodTypeAny;
  disabled?: boolean;
  accept?: string;
  props?: Record<string, unknown>;
  conditions?: Array<{
    field: string;
    value: unknown;
  }>;
}

export interface AppFormProps {
  fields: FormFieldDefinition[];
  initialValues?: Record<string, unknown>;
  formSchema: z.ZodTypeAny;
  title?: string;
  description?: string;
  disabled?: boolean;
  id?: string | null;
  serverErrors?: ApiErrorDetail[] | null;
  syncNameFromMetadata?: boolean;
}
