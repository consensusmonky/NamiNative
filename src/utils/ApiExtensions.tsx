// import AsyncStorage from "@react-native-async-storage/async-storage";
import { NETWORK_ID, NODE, STORAGE } from "../config/config";
import provider from "../config/provider";
import { Wallet } from "../storage/Wallet";
import { Network } from "../types/Network";

export function getInitalNetwork(): Network {
    // var network = await AsyncStorage.getItem(STORAGE.network);
    var network: Network =  
    {
      id: NETWORK_ID.preprod,
      node:  NODE.preprod,
      name: STORAGE.network,
      mainnetSubmit: "",
      preprodSubmit: "",
      previewSubmit: ""
    }
    let networkSerialized = JSON.stringify(network);
    if (Wallet.contains(STORAGE.network))
    {
      networkSerialized = Wallet.getString(STORAGE.network) as string;
    }   

    return JSON.parse(networkSerialized) as Network
};

export const setNetwork = async (network: Network) => {
    const currentNetwork = await getInitalNetwork();
    let id;
    let node;
    if (network.id === NETWORK_ID.mainnet) {
        id = NETWORK_ID.mainnet;
        node = NODE.mainnet;
    } else if (network.id === NETWORK_ID.preview) {
        id = NETWORK_ID.preview;
        node = NODE.preview;
    } else {
        id = NETWORK_ID.preprod;
        node = NODE.preprod;
    }

    if (network.node)
    {
        node = network.node;
    }

    if (currentNetwork && currentNetwork.id !== id)
    {
        // emitNetworkChange(networkNameToId(id));
        // TODO: Change network hook
    }

    var networkConfig: Network = 
        {
          id: id,
          node: node,
          name: STORAGE.network,
          mainnetSubmit: network.mainnetSubmit,
          preprodSubmit: network.preprodSubmit,
          previewSubmit: network.previewSubmit
        }    

    // AsyncStorage.setItem(STORAGE.network, JSON.stringify(networkConfig))
    Wallet.set(STORAGE.network, JSON.stringify(networkConfig));

    return true;
};

export async function delay(delayInMs: number) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, delayInMs);
    });
  }

export async function blockfrostRequest(endpoint: string, headers?: any, body?: string, signal?: any): Promise<any> {
    const network = await getInitalNetwork();
  
    let result: any;    
    while (!result || result.status_code === 500) {
      if (result) {
        await delay(100);
      }
      const rawResult = await fetch(provider.api.base(network.node) + endpoint, {
        headers: {
          ...provider.api.key(network),
          ...provider.api.header,
          ...headers,
          'Cache-Control': 'no-cache',
        },
        method: body ? 'POST' : 'GET',
        body,
        signal
      });
      var res = await rawResult.json();
      result = res;
    }
  
    return result;
}