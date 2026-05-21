export interface MeshDevice {
  deviceId: string;
  hasInternet: boolean;
  packetCount: number;
  packetIds: string[];
}

export interface MeshState {
  devices: MeshDevice[];
  idempotencyCacheSize: number;
}

export interface Account {
  vpa: string;
  holderName: string;
  balance: number;
}

export interface Transaction {
  id: number;
  senderVpa: string;
  receiverVpa: string;
  amount: number;
  status: 'SETTLED' | 'REJECTED' | string;
  bridgeNodeId: string;
  hopCount: number;
  settledAt: string;
}

export interface SendPacketResponse {
  packetId: string;
  ciphertextPreview: string;
  ttl: number;
  injectedAt: string;
}

export interface GossipResponse {
  transfers: number;
  deviceCounts: Record<string, number>;
}

export interface FlushResult {
  bridgeNode: string;
  packetId: string;
  outcome: string;
  reason: string;
  transactionId: number;
}

export interface FlushResponse {
  uploadsAttempted: number;
  results: FlushResult[];
}

export interface SendPacketRequest {
  senderVpa: string;
  receiverVpa: string;
  amount: number;
  pin: string;
  ttl: number;
  startDevice: string;
}
