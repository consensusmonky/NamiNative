import { NetworkId } from "@emurgo/react-native-haskell-shelley";
import { NETWORK_ID } from "../config/config";

export type Unit = string | "lovelace";
export type Asset = {
    unit: Unit,
    quantity: BigIntString,
}
export type BigIntString = string;
export type Network = {
                name: string,
                id: NETWORK_ID,
                node: string,
                mainnetSubmit: string,
                preprodSubmit: string,
                previewSubmit: string
            }

// export type NetworkAddresses = { paymentAddr: string | null, rewardAddr: string | null }

// export type NETWORK_ID = "mainnet" | "testnet" | "preview" | "preprod";
 
// interface Networks {
//     [key: string]: string
// }

// export type Networks = "MAINNET"

// export type Account = {
//     [key: NETWORK_ID]: AccountInfo
// }

export type NetworkDefaultStats = {
    lovelace: BigIntString,
    minAda: BigIntString,
    assets: Asset[],
    history: { confirmed: any[], details: {[txHash: string]: any }},
    paymentAddr: string,
    rewardAddr: string,
    collateral: {
        txHash: string,
        txId: number,
        lovelace: number,
      } | undefined,
    recentSendToAddresses: string,
    lastUpdate?: string;
    forceUpdate?: boolean;
    ft?: any[];
    nft?: any[];
}

// export type AccountSetting = {
//     [x: string]: string | number | Account | NetworkDefaultStats
// }

type NetworkOptions = {
    [NETWORK_ID.mainnet]?: NetworkDefaultStats;
    [NETWORK_ID.preprod]?: NetworkDefaultStats;
    [NETWORK_ID.preview]?: NetworkDefaultStats;
}

export type AccountInfo = {
    publicKey: string;
    paymentKeyHash: string;
    paymentKeyHashBech32: string;
    stakeKeyHash: string;
    name: string;
    avatar: string;    
} & NetworkOptions

// export type Account = NetworkDefaultStats;