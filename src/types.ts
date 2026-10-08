import type { LucideIcon } from 'lucide-react';

export type DataKind = 'text' | 'json' | 'csv' | 'number' | 'color' | 'none';
export type ToolCategory = 'Data' | 'Text' | 'Developer' | 'Date & Time' | 'Color' | 'Math';

export type ToolResult = {
  output: string;
  meta?: string;
  kind?: DataKind;
  error?: string;
};

export type ToolContext = {
  option?: string;
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
  privacy: 'local';
  icon: LucideIcon;
  placeholder: string;
  sample: string;
  options?: string[];
  run: (input: string, context: ToolContext) => ToolResult | Promise<ToolResult>;
};

export type SearchResult = ToolDefinition & { score: number; matchedAlias?: string };
