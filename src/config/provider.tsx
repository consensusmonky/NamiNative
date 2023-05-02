import { NODE } from './config';
// import secrets from 'secrets';
// import { version } from '../../package.json';
import {ENV_BLOCKFROST_KEY} from '@env';
import { Network } from '../types/Network';


const networkToProjectId: {[key: string]: string} = {
  "mainnet": ENV_BLOCKFROST_KEY,
  "testnet": ENV_BLOCKFROST_KEY,
  "preprod": ENV_BLOCKFROST_KEY,
  "preview": ENV_BLOCKFROST_KEY,
};

export default {
  api: {
    ipfs: 'https://ipfs.blockfrost.dev/ipfs',
    base: (node: string = NODE.mainnet) => node,
    header: { ["Header" || 'dummy']: 0.1 },
    key: (network: Network) => ({
      project_id: networkToProjectId[network.id],
    }),
    price: async (currency: string = "usd") => 
      await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=${currency}`
      )
        .then((res) => res.json())
        .then((res) => res.cardano[currency]),
  },
};
