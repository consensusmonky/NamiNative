import { NETWORK_ID, NODE, STORAGE } from "../constants/Common";
import { Wallet } from "../storage/Wallet";
import { Network } from "../types/Network";

export function getInitalNetwork(networkId: NETWORK_ID = NETWORK_ID.preprod): Network {

  let network: Network;
  network = Wallet.getMap<Network>(STORAGE.selectedNetwork);

  // Set initial network.
  if (!network) {
    network =  getCorrectNetworkConfig(networkId);
    setNetwork(network);
  }

  return network
};

const getCorrectNetworkConfig = (networkId: NETWORK_ID) => {
  let id;
  let node;

  if (networkId === NETWORK_ID.mainnet) {
      id = NETWORK_ID.mainnet;
      node = NODE.mainnet;
  } else if (networkId === NETWORK_ID.preview) {
      id = NETWORK_ID.preview;
      node = NODE.preview;
  } else {
      id = NETWORK_ID.preprod;
      node = NODE.preprod;
  }

  // if (network.node)
  // {
  //     node = network.node;
  // }

  var network: Network = 
  {
    id: id,
    node: node,
    name: STORAGE.selectedNetwork,
    mainnetSubmit: "", //emptyNetwork.mainnetSubmit,
    preprodSubmit: "", //emptyNetwork.preprodSubmit,
    previewSubmit: ""  //emptyNetwork.previewSubmit
  }

  return network;
}

export const setNetwork = (network: Network) => {
    if (!network) {
      return false;
    }
    
    Wallet.setMap(STORAGE.selectedNetwork, network);
    return true;
};

export const networkNameToId: (name: string) => number = (name: string) => {
  const names: {[key: string]: number} = {
      [NETWORK_ID.mainnet]: 1,
      [NETWORK_ID.preview]: 0,
      [NETWORK_ID.preprod]: 0,
  };

  return names[name];
};