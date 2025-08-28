export interface ServerRequest {
  serverName: string;
  serverUrl: string;
}

export interface ServerResponse {
  message: string | "";
}

export interface ServerListItem {
  serverName: string;
  serverUrl: string;
  serverRole: string;
}
