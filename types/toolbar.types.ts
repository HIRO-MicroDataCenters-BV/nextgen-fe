export type ToolbarButtonVariant = "default" | "outline" | "secondary";

export interface ToolbarButton {
  id: string;
  label: string;
  variant?: ToolbarButtonVariant;
  action: {
    type: "discard" | "fileUpload" | "submit";
    onConfirm?: () => void;
  };
}

export interface ToolbarProps {
  buttons: ToolbarButton[];
}
