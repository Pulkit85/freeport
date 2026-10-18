export interface PortProcess {
  port: number;
  pid: number;
  name: string;
  command?: string;
  user?: string;
  protocol: 'TCP' | 'UDP';
}

export interface KillResult {
  port: number;
  pid: number;
  name: string;
  success: boolean;
  error?: string;
}
