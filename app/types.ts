export interface RelayConfig {
  host: string;
  port: number;
  path: string;
}

export enum NetEvents {
  SetConnections,
  UpdatePeerId,
  MsgReceived,
  Error,
}
