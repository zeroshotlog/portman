export interface LiveListener {
  port: number;
  pid: number | null;
  process: string | null;
  command: string | null;
  inferred_type: string | null;
  cwd: string | null;
  cwd_short: string | null;
  url: string;
}

export interface Label {
  id: number | null;
  key_type: "Port" | "Pid" | "Pattern";
  key_value: string;
  name: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface EnrichedListener {
  listener: LiveListener;
  label: Label | null;
}

export interface SetLabelArgs {
  key_type: "Port" | "Pid" | "Pattern";
  key_value: string;
  name: string;
  note?: string | null;
}
