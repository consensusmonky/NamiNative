import { milkomedaNetworks } from "@dcspark/milkomeda-constants";
import AssetFingerprint from "@emurgo/cip14-js";
import { Address, AssetName, Assets, BigNum, ByronAddress, min_ada_required, MultiAsset, ScriptHash, TransactionOutput, TransactionUnspentOutput, Value } from "@emurgo/react-native-haskell-shelley";
import { ADA_HANDLE, APIError, ERROR, NETWORK_ID, STORAGE, TxSendError } from "../config/config";
import { AccountInfo, Asset, NetworkDefaultStats, Unit } from "../types/Network";
import { Network } from "../types/Network";
import { blockfrostRequest, setNetwork } from "../utils/ApiExtensions";
import { hexToAscii, utxoFromJson } from "../utils/extensions";
import { Buffer } from "buffer";
import crc from 'crc';
import { Wallet } from "../storage/Wallet";
import { getInitalNetwork } from "../utils/ApiExtensions"

export const getBalance = async () => {
    const currentAccount = await getCurrentAccount() as AccountInfo;
    
    const result = await blockfrostRequest(
      `/addresses/${currentAccount.paymentKeyHashBech32}`
    );
    if (result.error) {
      if (result.status_code === 400) throw APIError.InvalidRequest;
      else if (result.status_code === 500) throw APIError.InternalError;
      else return await Value.new((await BigNum.from_str('0')) as BigNum);
    }
    
    const value = await assetsToValue(result.amount);
    return value;
  };

  export const getDelegation = async () => {
    const currentAccount = getCurrentAccount() as AccountInfo;
    const currentNetwork = getNetwork();

    const stake = await blockfrostRequest(
      `/accounts/${currentAccount[currentNetwork.id]?.rewardAddr}`
    );
    if (!stake || stake.error || !stake.pool_id) return {};
    const delegation = await blockfrostRequest(
      `/pools/${stake.pool_id}/metadata`
    );
    if (!delegation || delegation.error) return {};
    return {
      active: stake.active,
      rewards: stake.withdrawable_amount,
      homepage: delegation.homepage,
      poolId: stake.pool_id,
      ticker: delegation.ticker,
      description: delegation.description,
      name: delegation.name,
    };
  };


/**
 *
 * @param {string} amount - cbor value
 * @param {Object} paginate
 * @param {number} paginate.page
 * @param {number} paginate.limit
 * @returns
 */
export const getUtxos = async (amount?: any, paginate?: any) => {
  const currentAccount = getCurrentAccount() as AccountInfo;
  const currentNetwork = getNetwork();

  let result = new Array<any>();
  let page = paginate && paginate.page ? paginate.page + 1 : 1;
  const limit = paginate && paginate.limit ? `&count=${paginate.limit}` : '';
  while (true) {
    let pageResult = await blockfrostRequest(
      `/addresses/${currentAccount.paymentKeyHashBech32}/utxos?page=${page}${limit}`
    );
    if (pageResult.error) {
      if (pageResult.status_code === 400) throw APIError.InvalidRequest;
      else if (pageResult.status_code === 500) throw APIError.InternalError;
      else {
        pageResult = [];
      }
    }
    result = result?.concat(pageResult);
    
    if (pageResult.length <= 0 || paginate) break;
    page++;
  }
  
  // exclude collateral input from overall utxo set
  if (currentAccount[currentNetwork.id]?.collateral) {
    result = result?.filter(
      (utxo: any) => {        
        !(
          utxo.tx_hash === currentAccount[currentNetwork.id]?.collateral?.txHash &&
          utxo.output_index === currentAccount[currentNetwork.id]?.collateral?.txId
        )
      }
    );
  }
  const address = await getAddress();

  let converted = await Promise.all(
    result?.map(async (utxo: any) => await utxoFromJson(utxo, address))
  );
  
  // filter utxos
  if (amount) {
    let filterValue: Value;
    try {
      
      filterValue = (await Value.from_bytes(Buffer.from(amount, 'hex'))) as Value;
      
    } catch (e) {
      throw APIError.InvalidRequest;
    }
    
    converted = converted?.filter(
      async (unspent) =>
        !await (await (await unspent.output()).amount()).compare(filterValue) ||
        await (await (await unspent.output()).amount()).compare(filterValue) !== -1
    );
  }
  if ((amount || paginate) && converted.length <= 0) {
    return null;
   }
   
  return converted;
};

export const getAddress = async () => {
  const currentAccount = getCurrentAccount() as AccountInfo;
  const currentNetwork = getNetwork();

  const adr = await ((await Address.from_bech32(currentAccount[currentNetwork.id]?.paymentAddr as string)) as Address).to_bytes();
  const paymentAddr = Buffer.from(adr).toString('hex');
  return paymentAddr;
};

/**
 *
 * @param {string} tx - cbor hex string
 * @returns
 */

export const submitTx = async (tx: any) => {
  const network = await getNetwork();
  
  var submitUrl: string | undefined = undefined;
  if (network.id === NETWORK_ID.mainnet) {
    submitUrl = network.mainnetSubmit;
  } else if (network.id === NETWORK_ID.preprod) {
    submitUrl = network.preprodSubmit;
  } else if (network.id === NETWORK_ID.preview) {
    submitUrl = network.previewSubmit;
  }
  if (submitUrl) {
    const result = await fetch(submitUrl as string, {
      method: 'POST',
      headers: { 'Content-Type': 'application/cbor' },
      body: Buffer.from(tx, 'hex'),
    });
    
    if (result.ok) {
      return await result.json();
    }
    throw APIError.InvalidRequest;
  }
  
  const result = await blockfrostRequest(
    `/tx/submit`,
    { 'Content-Type': 'application/cbor' },
    Buffer.from(tx, 'hex') as any
  );

  if (result.error) {
    if (result.status_code === 400)
      throw { ...TxSendError.Failure, message: result.message };
    else if (result.status_code === 500) throw APIError.InternalError;
    else if (result.status_code === 429) throw TxSendError.Refused;
    else if (result.status_code === 425) throw ERROR.fullMempool;
    else throw APIError.InvalidRequest;
  }
  return result;
};

  export const getBalanceExtended: (acc: AccountInfo) => Promise<Asset[]> = async (acc) => {
    const currentAccount = acc ?? await getCurrentAccount() as AccountInfo;
    try {
      const result = await blockfrostRequest(
        `/addresses/${currentAccount.paymentKeyHashBech32}/extended`
      );
      if (result?.error) {
        if (result.status_code === 400) throw APIError.InvalidRequest;
        else if (result.status_code === 500) throw APIError.InternalError;
        else return [];
      }
      return result?.amount;
    } catch (error) {
      
    }
    
  };

  export const getFullBalance = async () => {
    const currentAccount = getCurrentAccount() as AccountInfo;
    const currentNetwork = getNetwork();
    const result = await blockfrostRequest(
      `/accounts/${currentAccount[currentNetwork.id]?.rewardAddr}`
    );
    if (result.error) return '0';
    return (
      BigInt(result.controlled_amount) - BigInt(result.withdrawable_amount)
    ).toString();
  };
  
  export const setBalanceWarning = async () => {
    const currentAccount = getCurrentAccount() as AccountInfo;
    const currentNetwork = getNetwork();
    let warning = { active: false, fullBalance: '0' };
  
    const result = await blockfrostRequest(
      `/accounts/${currentAccount[currentNetwork.id]?.rewardAddr}/addresses?count=2`
    );
  
    if (result.length > 1) {
      const fullBalance = await getFullBalance();
      if (fullBalance !== currentAccount[currentNetwork.id]?.lovelace) {
        warning.active = true;
        warning.fullBalance = fullBalance;
      }
    }
  
    return warning;
  };

  export const updateTxInfo = async (txHash: any, offlineMode = false) => {
    const currentAccount = getCurrentAccount() as AccountInfo;
    const currentNetwork = getNetwork();
    
    let detail = currentAccount[currentNetwork.id]?.history?.details[txHash];
  
    if (typeof detail !== 'object' || Object.keys(detail).length < 4 && !offlineMode) {
      detail = {};
      const info = await getTxInfo(txHash);
      const uTxOs = await getTxUTxOs(txHash);
      const metadata = await getTxMetadata(txHash);
  
      detail.info = await info;
      if (info) detail.block = await getBlock(detail.info.block_height);
      detail.utxos = await uTxOs;
      detail.metadata = await metadata;
    }
  
    return detail;
  };

  export const getBlock = async (blockHashOrNumb: any) => {
    const result = await blockfrostRequest(`/blocks/${blockHashOrNumb}`);
    if (!result || result.error) return null;
    return result;
  };

  export const getTxInfo = async (txHash: any) => {
    const result = await blockfrostRequest(`/txs/${txHash}`);
    if (!result || result.error) return null;
    return result;
  };

  export const getTxUTxOs = async (txHash: any) => {
    const result = await blockfrostRequest(`/txs/${txHash}/utxos`);
    if (!result || result.error) return null;
    return result;
  };
  
  export const getTxMetadata = async (txHash: any) => {
    const result = await blockfrostRequest(`/txs/${txHash}/metadata`);
    if (!result || result.error) return null;
    return result;
  };

  export const setTxDetail = (txHash: string, txDetail: any) => {
    if (!Wallet.getMap<AccountInfo>(STORAGE.accounts))
    {
      return;
    }

    const account =  Wallet.getMap<AccountInfo>(STORAGE.accounts);
    // const currentIndex = await getCurrentAccountIndex();
    // const network = await getNetwork();
    // const accounts = await JSON.parse(((await AsyncStorage.getItem(STORAGE.accounts)) as string)) as AccountSetting;
    // let firstAccount = accounts[0] as Account;
    const currentNetwork = getNetwork();
    
    let detail = account[currentNetwork.id]?.history?.details[txHash];
    // for (const txHash of Object.keys(txObject)) {
      // const txDetail = txObject[txHash];
      if (account[currentNetwork.id]?.history?.details !== undefined) {
        (account[currentNetwork.id]?.history?.details as {[txHash: string]: any})[txHash] = txDetail;
      }
      // test = txDetail;
      
      var serializedAccount = JSON.stringify(account)        
      // await AsyncStorage.setItem(STORAGE.accounts, serializedAccount);
      Wallet.setMap(STORAGE.accounts, account);
      // delete txObject[txHash];
    // }
    return account;
  };

  export const getSpecificUtxo = async (txHash: string, txId: number) => {
    const result = await blockfrostRequest(`/txs/${txHash}/utxos`);
    if (!result || result.error) return null;
    return result.outputs[txId];
  };

  export const updateBalance = async (currentAccount: AccountInfo) => {
    const assets = await getBalanceExtended(currentAccount);
     const amount = await assetsToValue(assets);
     const currentNetwork = getNetwork();
     
     await checkCollateral(currentAccount, false) as boolean;
     
    if (assets.length > 0) {
      (currentAccount[currentNetwork.id] as NetworkDefaultStats).lovelace = assets.find(
        (am: Asset) => am.unit === 'lovelace'
      )?.quantity ?? "0";
      (currentAccount[currentNetwork.id] as NetworkDefaultStats).assets = assets?.filter(
        (am: Asset) => am.unit !== 'lovelace'
      );
      if ((currentAccount[currentNetwork.id] as NetworkDefaultStats).assets.length > 0) {        
        const protocolParameters = await initTx();
        const checkOutput = await TransactionOutput.new((await 
          Address.from_bech32(
            (currentAccount[currentNetwork.id] as NetworkDefaultStats).paymentAddr
          )) as Address,
          amount
        );
        // const minAda = ((await min_ada_required(
        //   (await checkOutput.amount()), false,
        //   (await BigNum.from_str(protocolParameters.coinsPerUtxoWord)) as BigNum
        // )) as BigNum).to_str();
        const minAda = await minAdaRequired(checkOutput, (await BigNum.from_str(protocolParameters.coinsPerUtxoWord)) as BigNum);
        (currentAccount[currentNetwork.id] as NetworkDefaultStats).minAda = minAda;
      } else {
        (currentAccount[currentNetwork.id] as NetworkDefaultStats).minAda = "0";
      }
    } else {
      (currentAccount[currentNetwork.id] as NetworkDefaultStats).lovelace = "0";
      (currentAccount[currentNetwork.id] as NetworkDefaultStats).assets = [];
      (currentAccount[currentNetwork.id] as NetworkDefaultStats).minAda = "0";
    }

    Wallet.setMap(STORAGE.accounts, currentAccount);
    
    return true;
  };

  export const getTransactions = async (paginate = 1, count = 10) => {
    const currentAccount = await getCurrentAccount() as AccountInfo;
    try {
      const result = await blockfrostRequest(
        `/addresses/${currentAccount.paymentKeyHashBech32}/transactions?page=${paginate}&order=desc&count=${count}`
      );
      if (!result || result.error) return [];
      return result?.map((tx: any) => ({
        txHash: tx.tx_hash,
        txIndex: tx.tx_index,
        blockHeight: tx.block_height,
      }));
    } catch (error) {
      
    }
    
  };
 
  export const toUnit = (amount: any, decimals = 6) => {
    if (!amount) return '0';
    let result = parseFloat(
      amount.toString().replace(/[,\s]/g, '')
    ).toLocaleString('en-US', { minimumFractionDigits: decimals });    
    const split = result.split('.');
    const front = split[0].replace(/[,\s]/g, '');
    result = (front == '0' ? '' : front) + (split[1] ? split[1].slice(0, decimals) : '');
    if (!result) return '0';
    else if (result == 'NaN') return '0';
    return result;
  };

  export const displayUnit = (quantity: any, decimals = 6) => {
    return parseInt(quantity) / 10 ** decimals;
  };  

  export const isValidAddress = async (address: any) => {
    const network = await getNetwork();
    try {
      const addr = (await Address.from_bech32(address)) as Address;
      if (
        ((await addr.network_id()) === 1 && network.id === NETWORK_ID.mainnet) ||
        ((await addr.network_id()) === 0 &&
          ( network.id === NETWORK_ID.preview ||
            network.id === NETWORK_ID.preprod))
      )
        return addr.to_bytes();
      return false;
    } catch (e) {}
    try {
      const addr = (await ByronAddress.from_base58(address)) as ByronAddress;
      if (
        ((await addr.network_id()) === 1 && network.id === NETWORK_ID.mainnet) ||
        ((await addr.network_id()) === 0 &&
          ( network.id === NETWORK_ID.preview ||
            network.id === NETWORK_ID.preprod))
      )
        return (await (await addr.to_address()).to_bytes()) as Uint8Array;
      return false;
    } catch (e) {}
    return false;
  };
  
  export const isValidEthAddress = function (address: any) {
    return new Error("ETH/Milkomeda Addresses not supported at the moment.");
    // return Web3Utils.isAddress(address);
  };

  export const initTx = async () => {
    const latest_block = await blockfrostRequest('/blocks/latest');
    const p = await blockfrostRequest(`/epochs/latest/parameters`);
  
    return {
      linearFee: {
        minFeeA: p.min_fee_a.toString(),
        minFeeB: p.min_fee_b.toString(),
      },
      minUtxo: '1000000', //p.min_utxo, minUTxOValue protocol parameter has been removed since Alonzo HF. Calulation of minADA works differently now, but 1 minADA still sufficient for now
      poolDeposit: p.pool_deposit,
      keyDeposit: p.key_deposit,
      coinsPerUtxoWord: p.coins_per_utxo_size.toString(),
      maxValSize: parseInt(p.max_val_size),
      priceMem: parseInt(p.price_mem),
      priceStep: parseInt(p.price_step),
      maxTxSize: parseInt(p.max_tx_size),
      slot: parseInt(latest_block.slot),
      collateralPercentage: parseInt(p.collateral_percent),
      maxCollateralInputs: parseInt(p.max_collateral_inputs),
    };
  };

  const checkCollateral = async (currentAccount: AccountInfo, checkTx: any) => {
    const currentNetwork = getNetwork();
    if (checkTx) {
      const transactions = await getTransactions();
      if (
        transactions?.length <= 0 ||
        currentAccount[currentNetwork.id]?.history?.confirmed.includes(
          transactions[0].txHash
        )
      )
        return false;
    }
   
    let result: any = [];
    let page = 1;
    while (true) {
      try {
        let pageResult = await blockfrostRequest(
          `/addresses/${currentAccount.paymentKeyHashBech32}/utxos?page=${page}`
        );
        if (pageResult.error) {
          if (result.status_code === 400) throw APIError.InvalidRequest;
          else if (result.status_code === 500) throw APIError.InternalError;
          else {
            pageResult = [];
          }
        }
        result = result?.concat(pageResult);
        if (pageResult.length <= 0) break;
        page++;
      } catch (error) {
        
      }
      
    }
   
    // exclude collateral input from overall utxo set
    if (currentAccount[currentNetwork.id]?.collateral) {
      const initialSize = result.length;
      result = result?.filter(
        (utxo: any) =>
          !(
            utxo.tx_hash === currentAccount[currentNetwork.id]?.collateral?.txHash &&
            utxo.output_index === currentAccount[currentNetwork.id]?.collateral?.txId
          )
      );
  
      if (initialSize == result.length) {
        delete currentAccount[currentNetwork.id]?.collateral;
        return true;
      }
    }

    return false;
  };


  /** Returns account with network specific settings (e.g. address, reward address, etc.) */
  export const getCurrentAccount: () => AccountInfo | undefined = () => {
    if (!Wallet.getMap<AccountInfo>(STORAGE.accounts)) {
      return;
    }
    
    //  const accounts = JSON.parse(await AsyncStorage.getItem(STORAGE.accounts) as string) as AccountSetting;
    const account = Wallet.getMap<AccountInfo>(STORAGE.accounts);
    const network = getNetwork();
    
  return account ? accountToNetworkSpecific(account as AccountInfo, network) : undefined;
  };

  // NamiNative always uses the first index of the wallet account path.
  export const getCurrentAccountIndex = () => 0;

  export const getNetwork = () => getInitalNetwork();

  export const assetsToValue = async (assets: Asset[]) => {
    const multiAsset = await MultiAsset.new();
    const lovelace = assets?.find((asset) => asset.unit === 'lovelace');
    
    const policies = [
      ...new Set(
        assets
          ?.filter((asset) => asset.unit !== 'lovelace')
          ?.map((asset) => asset.unit.slice(0, 56))
      ),
    ];
    policies.forEach(async (policy) => {
      const policyAssets = assets?.filter(
        (asset) => asset.unit.slice(0, 56) === policy
      );
      const assetsValue = await Assets.new();
      policyAssets.forEach(async (asset) => {
        assetsValue.insert(
          (await AssetName.new(await Buffer.from(asset.unit.slice(56), 'hex')) as AssetName),
          (await BigNum.from_str(asset.quantity)) as BigNum
        );
      });
      await multiAsset.insert(
        (await ScriptHash.from_bytes(await Buffer.from(policy, 'hex'))) as ScriptHash,
        assetsValue
      );
    });
    
    const value = await Value.new(
      (await BigNum.from_str(lovelace ? lovelace.quantity : '0')) as BigNum
    );
    if (assets?.length > 1 || !lovelace) await value.set_multiasset(multiAsset);
    return value;
  };

  /**
 *
 * @param {Value} value
 */
export const valueToAssets = async (value: any) => {
  const assets = [];
  
  assets.push({ unit: 'lovelace', quantity: await (await value.coin()).to_str() });  
  if (value?.multiasset !== undefined && (await value.multiasset())?.keys !== undefined) {    
    const multiAssets = value.multiasset()?.keys();    
    for (let j = 0; j < multiAssets.len(); j++) {
      const policy = multiAssets.get(j);
      const policyAssets = value.multiasset().get(policy);
      const assetNames = policyAssets?.keys();
      
      for (let k = 0; k < assetNames.len(); k++) {
        const policyAsset = assetNames.get(k);
        const quantity = policyAssets.get(policyAsset);
        const asset =
          Buffer.from(await policy.to_bytes(), 'hex').toString('hex') +
          Buffer.from(await policyAsset.name(), 'hex').toString('hex');
        const _policy = asset.slice(0, 56);
        const _name = asset.slice(56);
        const lovelace = {};        
        const fingerprint = AssetFingerprint.fromParts(
          Buffer.from(_policy, 'hex'),
          Buffer.from(_name, 'hex')
        ).fingerprint();
        assets.push({
          unit: asset,
          quantity: quantity.to_str(),
          policy: _policy,
          name: hexToAscii(_name),
          fingerprint
        });
      }
    }
  }
  
  // if (value.coin().to_str() == '0') return [];
  return assets;
};

  export const minAdaRequired = async (output: TransactionOutput, coinsPerUtxoWord: BigNum) => {
    return await (await min_ada_required(await output.amount(), false, coinsPerUtxoWord) as BigNum).to_str();
  };

  const accountToNetworkSpecific = (acc: AccountInfo, network: Network) => {
    const assets = acc[network.id]?.assets;
    const lovelace = acc[network.id]?.lovelace;
    const history = acc[network.id]?.history;
    const minAda = acc[network.id]?.minAda;
    const collateral = acc[network.id]?.collateral;
    const recentSendToAddresses = acc[network.id]?.recentSendToAddresses;
    const paymentAddr = acc[network.id]?.paymentAddr;
    const rewardAddr = acc[network.id]?.rewardAddr;
    
    const account: AccountInfo = {
      [network.id]: {
        paymentAddr: paymentAddr,
        rewardAddr: rewardAddr,
        assets: assets,
        lovelace: lovelace,
        minAda: minAda,
        collateral: collateral,
        history: history,
        recentSendToAddresses: recentSendToAddresses,
      },
      avatar: acc.avatar,
      name: acc.name,
      paymentKeyHash: acc.paymentKeyHash,
      paymentKeyHashBech32: acc.paymentKeyHashBech32,
      publicKey: acc.publicKey,
      stakeKeyHash: acc.stakeKeyHash,
    }

    return account;
  };

  /**
 *
 * @param {TransactionUnspentOutput[]} utxos
 * @returns
 */
export const sumUtxos = async (utxos: any) => {
  let value = (await Value.new((await BigNum.from_str('0')) as BigNum)) as Value;  
  await Promise.all(
      utxos?.map(async (utxo: TransactionUnspentOutput) => value = (await value?.checked_add(await (await utxo.output()).amount())) as Value)
  )
  return value;
};

/**
 *
 * @param {string} assetName utf8 encoded
 */
export const getAdaHandle = async (assetName: any) => {
  const network = await getNetwork();
  const assetNameHex = Buffer.from(assetName).toString('hex');
  if (!assetNameHex || assetNameHex.length == 0) return null;
  const policy = network.id == "mainnet" ? ADA_HANDLE.mainnet : ADA_HANDLE.testnet;
  const asset = policy + assetNameHex;
  const resolvedAddress = await blockfrostRequest(`/assets/${asset}/addresses`);
  if (!resolvedAddress || resolvedAddress.error) return null;
  return resolvedAddress[0].address;
};

/**
 * Compile all required output to a flat amount list
 * @param {OutputList} outputList - The set of outputs requested for payment.
 * @return {AmountList} - The compiled set of amounts requested for payment.
 */
export const compileOutputs = (outputList: any) => {
  let compiledAmountList: any = [];

  outputList.forEach((output: any) => addAmounts(output.amount, compiledAmountList));

  return compiledAmountList;
};

/**
 * Add up an AmountList values to an other AmountList
 * @param {AmountList} amountList - Set of amounts to be added.
 * @param {AmountList} compiledAmountList - The compiled set of amounts.
 */
function addAmounts(amountList: any, compiledAmountList: any) {
  amountList.forEach((amount: any) => {
    let entry = compiledAmountList.find(
      (compiledAmount: any) => compiledAmount.unit === amount.unit
    );

    // 'Add to' or 'insert' in compiledOutputList
    const am = JSON.parse(JSON.stringify(amount)); // Deep Copy
    entry
      ? (entry.quantity = (
          BigInt(entry.quantity) + BigInt(amount.quantity)
        ).toString())
      : compiledAmountList.push(am);
  });
}

function checksum(num: any) {
  return crc.crc8((Buffer.from(num, 'hex'))).toString(16).padStart(2, '0');
}

export function fromLabel(label: any) {
  if (label.length !== 8 || !(label[0] === '0' && label[7] === '0')) {
    return null;
  }
  const numHex = label.slice(1, 5);
  const num = parseInt(numHex, 16);
  const check = label.slice(5, 7);
  return check === checksum(numHex) ? num : null;
}

export function toAssetUnit(policyId: any, name: any, label: any) {
  const hexLabel = Number.isInteger(label) ? toLabel(label) : '';
  const n = name ? name : '';
  if ((n + hexLabel).length > 64) {
    throw new Error('Asset name size exceeds 32 bytes.');
  }
  if (policyId.length !== 56) {
    throw new Error(`Policy id invalid: ${policyId}.`);
  }
  return policyId + hexLabel + n;
}

export function toLabel(num: any) {
  if (num < 0 || num > 65535) {
    throw new Error(
      `Label ${num} out of range: min label 1 - max label 65535.`
    );
  }
  const numHex = num.toString(16).padStart(4, '0');
  return '0' + numHex + checksum(numHex) + '0';
}

export function fromAssetUnit(unit: any) {
  const policyId = unit.slice(0, 56);
  const label = fromLabel(unit.slice(56, 64));
  const name = (() => {
    const hexName = Number.isInteger(label) ? unit.slice(64) : unit.slice(56);
    return unit.length === 56 ? "" : hexName || null;
  })();
  return { policyId, name, label };
}


/**
 *
 * @param {string} ethAddress
 */
export const getMilkomedaData = async (ethAddress: any) => {
  if (!ethAddress) {
    return {current_address: ""}
  }

  const network = await getNetwork();
  if (network.id === NETWORK_ID.mainnet) {
    const { isAllowed } = await fetch(
      'https://' +
        milkomedaNetworks['c1-mainnet'].backendEndpoint +
        `/v1/isAddressAllowed?address=${ethAddress}`
    ).then((res) => res.json());
    const { ada, ttl_expiry, assets, current_address } = await fetch(
      'https://' +
        milkomedaNetworks['c1-mainnet'].backendEndpoint +
        '/v1/stargate'
    ).then((res) => res.json());
    const protocolMagic = milkomedaNetworks['c1-mainnet'].protocolMagic;
    return {
      isAllowed,
      assets: [],
      ada,
      current_address,
      protocolMagic,
      ttl: ttl_expiry,
    };
  } else {
    const { isAllowed } = await fetch(
      'https://' +
        milkomedaNetworks['c1-devnet'].backendEndpoint +
        `/v1/isAddressAllowed?address=${ethAddress}`
    ).then((res) => res.json());
    const { ada, ttl_expiry, assets, current_address } = await fetch(
      'https://' +
        milkomedaNetworks['c1-devnet'].backendEndpoint +
        '/v1/stargate'
    ).then((res) => res.json());
    const protocolMagic = milkomedaNetworks['c1-devnet'].protocolMagic;
    return {
      isAllowed,
      assets: [],
      ada,
      current_address,
      protocolMagic,
      ttl: ttl_expiry,
    };
  }
};

export const calculateAmount = (currentAddr: any, uTxOList: any, validContract = true) => {
  if (!uTxOList) {
      return;
  }
  
  let inputs = compileOutputs(
    uTxOList.inputs.filter(
      (input: any) =>
        input.address === currentAddr && !(input.collateral && validContract)
    )
  );
  let outputs = compileOutputs(
    uTxOList.outputs.filter(
      (output: any) =>
        output.address === currentAddr && !(output.collateral && validContract)
    )
  );
  let amounts = [];

  while (inputs.length) {
    let input = inputs.pop();
    let outputIndex = outputs.findIndex((amount: any) => amount.unit === input.unit);
    let qty;

    if (outputIndex > -1) {
      qty =
        (BigInt(input.quantity) - BigInt(outputs[outputIndex].quantity)) *
        BigInt(-1);
      outputs.splice(outputIndex, 1);
    } else {
      qty = BigInt(input.quantity) * BigInt(-1);
    }

    if (qty !== BigInt(0) || input.unit === 'lovelace')
      amounts.push({
        unit: input.unit,
        quantity: qty,
      });
  }

  return amounts.concat(outputs);
};