import {Core} from '@walletconnect/core';
import {ICore} from '@walletconnect/types';
import {Web3Wallet, IWeb3Wallet} from '@walletconnect/web3wallet';
export let web3wallet: IWeb3Wallet;
export let core: ICore;
export let currentETHAddress: string;

// @ts-expect-error - env is a virtualised module via Babel config.
import {ENV_PROJECT_ID, ENV_RELAY_URL} from '@env';
import { useCallback, useEffect, useState } from 'react';
// import {createOrRestoreEIP155Wallet} from './EIP155Wallet';

export async function createWeb3Wallet() {

  try {
    console.log("URL: " + ENV_RELAY_URL)
  
  // console.log('ENV_PROJECT_ID', ENV_PROJECT_ID);
  // console.log('ENV_RELAY_URL', ENV_RELAY_URL);
  core = new Core({
    // @notice: If you want the debugger / logs
    // logger: 'debug',
    projectId: ENV_PROJECT_ID,
    relayUrl: ENV_RELAY_URL,
  });

//   const {eip155Addresses} = await createOrRestoreEIP155Wallet();
//   currentETHAddress = eip155Addresses[0];
  
  web3wallet = await Web3Wallet.init({
    core,
    metadata: {
      name: 'Nami Native Cardano Wallet',
      description: 'A Cardano Web3Wallet',
      url: 'https://consensusmonky.de/',
      icons: ['https://avatars.githubusercontent.com/u/37784886'],
    },
  });
  } catch (error) {
    console.log("FEEEEEHLER:")
    console.log(error);
    console.log("FEEEEEHLER:")
  }
  
}

export async function _pair(params: {uri: string}) {
  return await core.pairing.pair({uri: params.uri});
}

export default function useInitialization() {
  const [initialized, setInitialized] = useState(false);

  const onInitialize = useCallback(async () => {
    try {
      await createWeb3Wallet();
      setInitialized(true);
    } catch (err: unknown) {
      console.log('Error for initializing', err);
    }
  }, []);

  useEffect(() => {
    if (!initialized) {
      onInitialize();
    }
  }, [initialized, onInitialize]);

  return initialized;

}