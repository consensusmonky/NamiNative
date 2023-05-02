import { THIRTY_DAYS, ONE_DAY, THIRTY_SECONDS } from "@walletconnect/time";
import { RelayerTypes, PairingJsonRpcTypes } from "@walletconnect/types";

// CORE
export const CORE_PROTOCOL = "wc";
export const CORE_VERSION = 2;
export const CORE_CONTEXT = "core";
export const CORE_STORAGE_PREFIX = `${CORE_PROTOCOL}@${CORE_VERSION}:${CORE_CONTEXT}:`;

// STORE
export const STORE_STORAGE_VERSION = "0.3";


// RELAYER

export const RELAYER_DEFAULT_PROTOCOL = "irn";
export const RELAYER_DEFAULT_LOGGER = "error";
export const RELAYER_DEFAULT_RELAY_URL = "wss://relay.walletconnect.com";

export const RELAYER_CONTEXT = "relayer";
export const RELAYER_EVENTS = {
  message: "relayer_message",
  connect: "relayer_connect",
  disconnect: "relayer_disconnect",
  error: "relayer_error",
  connection_stalled: "relayer_connection_stalled",
  transport_closed: "relayer_transport_closed",
  publish: "relayer_publish",
};

//EXPIRER

export const EXPIRER_CONTEXT = "expirer";

export const EXPIRER_EVENTS = {
  created: "expirer_created",
  deleted: "expirer_deleted",
  expired: "expirer_expired",
  sync: "expirer_sync",
};


export const PAIRING_CONTEXT = "pairing";

export const PAIRING_STORAGE_VERSION = "0.3";

export const PAIRING_DEFAULT_TTL = THIRTY_DAYS;

export const PAIRING_RPC_OPTS: Record<
  PairingJsonRpcTypes.WcMethod | "unregistered_method" | string,
  {
    req: RelayerTypes.PublishOptions;
    res: RelayerTypes.PublishOptions;
  }
> = {
  wc_pairingDelete: {
    req: {
      ttl: ONE_DAY,
      prompt: false,
      tag: 1000,
    },
    res: {
      ttl: ONE_DAY,
      prompt: false,
      tag: 1001,
    },
  },
  wc_pairingPing: {
    req: {
      ttl: THIRTY_SECONDS,
      prompt: false,
      tag: 1002,
    },
    res: {
      ttl: THIRTY_SECONDS,
      prompt: false,
      tag: 1003,
    },
  },
  unregistered_method: {
    req: {
      ttl: ONE_DAY,
      prompt: false,
      tag: 0,
    },
    res: {
      ttl: ONE_DAY,
      prompt: false,
      tag: 0,
    },
  },
};