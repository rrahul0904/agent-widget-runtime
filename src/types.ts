import type { LucideIcon } from 'lucide-react';

export type DataKind = 'text' | 'json' | 'csv' | 'number' | 'color' | 'file' | 'image' | 'pdf' | 'audio' | 'binary' | 'none';
export type ToolCategory = 'Data' | 'Text' | 'Developer' | 'Date & Time' | 'Color' | 'Math' | 'PDF & Office' | 'Image' | 'Network' | 'Security' | 'Media' | 'Utility';
export type ExecutionClass = 'local' | 'network-assisted' | 'account-sync';
export type InputMode = 'text' | 'file' | 'files' | 'none';

export type ToolArtifact = {
  name: string;
  mime: string;
  blob: Blob;
};

export type ToolResult = {
  output: string;
  meta?: string;
  kind?: DataKind;
  artifacts?: ToolArtifact[];
  error?: string;
};

export type ToolContext = {
  option?: string;
  files?: File[];
  signal?: AbortSignal;
};

export type ToolDefinition = {
  id: string;
  name: string;
  description: string;
  aliases: string[];
  category: ToolCategory;
  tags: string[];
  inputKind: DataKind;
  outputKind: DataKind;
  privacy: ExecutionClass;
  icon: LucideIcon;
  placeholder: string;
  sample: string;
  options?: string[];
  inputMode?: InputMode;
  accept?: string;
  autoRun?: boolean;
  privacyNote?: string;
  run: (input: string, context: ToolContext) => ToolResult | Promise<ToolResult>;
};

export type SearchResult = ToolDefinition & { score: number; matchedAlias?: string };
