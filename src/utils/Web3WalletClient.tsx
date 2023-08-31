import {Core} from '@walletconnect/core';
import {ICore} from '@walletconnect/types';
import {Web3Wallet, IWeb3Wallet} from '@walletconnect/web3wallet';
export let web3wallet: IWeb3Wallet;
export let core: ICore;
export let currentETHAddress: string;

// @ts-expect-error - env is a virtualised module via Babel config.
import {ENV_PROJECT_ID, ENV_RELAY_URL} from '@env';
import { useCallback, useEffect, useState } from 'react';

export async function createWeb3Wallet() {

  try {  
    core = new Core({
      // @notice: If you want the debugger / logs
      // logger: 'debug',
      projectId: ENV_PROJECT_ID,
      relayUrl: ENV_RELAY_URL,
    });
    
    web3wallet = await Web3Wallet.init({
      core,
      metadata: {
        name: 'Nami Native Cardano Wallet',
        description: 'A Cardano Web3Wallet',
        url: 'https://consensusmonky.de/',
        icons: ['https://avatars.githubusercontent.com/u/37784886'],
        redirect: {
          native: 'naminative://',
        }
      },
    });
  } catch (error) {
    console.log(error);
  }
  
}

export async function _pair(params: {uri: string}) {
  return await core.pairing.pair({uri: params.uri});
}

export default function useInitialization() {
  return new Promise<boolean>(async (resolve, reject) => {    
      try {
        await createWeb3Wallet();
        resolve(true);
      } catch (err: unknown) {
        console.log('Error while initializing web3wallet', err);
        reject(err);
      }
});
}