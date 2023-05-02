import { Address, AuxiliaryData, AuxiliaryDataHash, BigNum, CoinSelectionStrategyCIP2, ExUnitPrices, hash_transaction, LinearFee, make_vkey_witness, Transaction, TransactionBody, TransactionBuilder, TransactionBuilderConfigBuilder, TransactionUnspentOutput, TransactionUnspentOutputs, TransactionWitnessSet, UnitInterval, Value, Vkeywitnesses } from "@emurgo/react-native-haskell-shelley";
import { STORAGE, TX } from "../config/config";
import { blockfrostRequest, getInitalNetwork } from "./ApiExtensions";
import { Buffer } from "buffer";
import { signTx } from "./Ledger";
import { getCurrentAccount, getCurrentAccountIndex, getNetwork, getTransactions, submitTx, updateBalance } from "../services/NetworkDataProviderService";
// import AsyncStorage from "@react-native-async-storage/async-storage";
import { AccountInfo, NetworkDefaultStats } from "../types/Network";
import { Network } from "../types/Network";
import { Alert } from "react-native";
import { Wallet } from "../storage/Wallet";

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
      coinsPerUtxoWord: parseInt(p.coins_per_utxo_size),
      maxValSize: parseInt(p.max_val_size),
      priceMem: parseInt(p.price_mem),
      priceStep: parseInt(p.price_step),
      maxTxSize: parseInt(p.max_tx_size),
      slot: parseInt(latest_block.slot),
      collateralPercentage: parseInt(p.collateral_percent),
      maxCollateralInputs: parseInt(p.max_collateral_inputs),
    };
  };
  
  export const buildTx = async (
    account: any,
    utxos: any,
    outputs: any,
    protocolParameters: any,
    auxiliaryData: any = null
  ) => {
  
    const memPrice = await UnitInterval.new(
        (await BigNum.from_str('0')) as BigNum,
        (await BigNum.from_str('0')) as BigNum,
      )

    const stepPrice  = await UnitInterval.new(
        (await BigNum.from_str('0')) as BigNum,
        (await BigNum.from_str('0')) as BigNum,
    ) 
    
    const txBuilderConfig = (await ((await ((await ((await ((await ((await ((await ((await ((await TransactionBuilderConfigBuilder.new()) as TransactionBuilderConfigBuilder)
      .coins_per_utxo_byte((await 
        BigNum.from_str(protocolParameters.coinsPerUtxoWord)) as BigNum
      )) as TransactionBuilderConfigBuilder)
       .fee_algo(( await LinearFee.new(
          (await BigNum.from_str(protocolParameters.linearFee.minFeeA)) as BigNum,
          (await BigNum.from_str(protocolParameters.linearFee.minFeeB)) as BigNum
        )) as LinearFee)))      
       .key_deposit((await BigNum.from_str(protocolParameters.keyDeposit)) as BigNum)) as TransactionBuilderConfigBuilder)
       .pool_deposit((await BigNum.from_str(protocolParameters.poolDeposit)) as BigNum)) as TransactionBuilderConfigBuilder)
       .max_tx_size(protocolParameters.maxTxSize)) as TransactionBuilderConfigBuilder)
       .max_value_size(protocolParameters.maxValSize)) as TransactionBuilderConfigBuilder)
       .ex_unit_prices((await ExUnitPrices.new(memPrice, stepPrice)) as ExUnitPrices)) as TransactionBuilderConfigBuilder)
    // ProtocolParamUpdate
    //.collateral_percentage(protocolParameters.collateralPercentage)
    // .max_collateral_inputs(protocolParameters.maxCollateralInputs) as TransactionBuilderConfigBuilder
        .build()) as TransactionBuilderConfigBuilder
       
    const txBuilder = (await TransactionBuilder.new(txBuilderConfig)) as TransactionBuilder;
    await txBuilder.add_output(await outputs.get(0)); 
    const utxosCore = (await TransactionUnspentOutputs.new()) as TransactionUnspentOutputs;
    await Promise.all(utxos.map(async (utxo: any) => {
            await utxosCore.add(utxo)
        }
        )
    )
    
    await txBuilder.add_inputs_from(utxosCore, CoinSelectionStrategyCIP2.LargestFirst);

    if (auxiliaryData) {
        await txBuilder.set_auxiliary_data(auxiliaryData);
    }
    
    const currentNetwork = getNetwork();
    await txBuilder.set_ttl((protocolParameters.slot + TX.invalid_hereafter));    
    await txBuilder.add_change_if_needed((await Address.from_bech32(account[currentNetwork.id].paymentAddr)) as Address);
    
    const transactionBody = (await txBuilder.build()) as TransactionBody;  
    return transactionBody;
  };
  
  export const signAndSubmit = async (
    txBodyHash: any,
    { keyHashes, accountIndex }: any,
    password: any
  ) => {
    
    const txBody = (await TransactionBody.from_bytes(Buffer.from(txBodyHash, 'hex'))) as TransactionBody
    const txHash = await hash_transaction(txBody);
    // const witnesses = await TransactionWitnessSet.new();
    
    // add keyhash witnesses
    // const vkeyWitnesses = await Vkeywitnesses.new();
    // const vkeyWitness = await make_vkey_witness(txHash, keyHashes);
    // await vkeyWitnesses.add(vkeyWitness);
    // await witnesses.set_vkeys(vkeyWitnesses);
    
    
    // create the finalized transaction with witnesses
    // const transaction = Transaction.new(
    //     txBody,
    //     witnesses,
    //     await txBody.auxiliary_data(), // transaction metadata
    // );

    
    const witnessSet = await signTx(
      txHash,
      keyHashes,
      password,
      accountIndex
    );
    
    const transaction = (await Transaction.new(
      txBody,
      witnessSet,
      undefined
    )) as Transaction;
    
    var txCbor = Buffer.from(await transaction.to_bytes()).toString('hex');
    
    const txHashResult = await submitTx(txCbor)
    
    return txHashResult;
  };

  export const updateAccount = async (existingAccount: AccountInfo | undefined = undefined, forceUpdate = false, offlineMode = false) => {
    const currentIndex = getCurrentAccountIndex();

    // const accounts = await JSON.parse(((await AsyncStorage.getItem(STORAGE.accounts)) as string)) as AccountSetting;
    const account =  existingAccount ?? JSON.parse(Wallet.getString(STORAGE.accounts) as string) as AccountInfo;
    
    // const account = getCurrentAccount() as Account;
    // const currentAccount = accounts[currentIndex] as Account;
    const network = getInitalNetwork();
    
    if (!offlineMode) {
      let result = await updateTransactions(account, network);
      if (!result)
      {
        return account as AccountInfo;
      }
    }
    
    if (
      account[network.id]?.history &&
      account[network.id]?.history?.confirmed[0] ==
      account[network.id]?.lastUpdate &&
      !forceUpdate &&
      !account[network.id]?.forceUpdate
    ) {
      
      if (account[network.id]?.lovelace == null) {
        // first initilization of account
        (account[network.id] as NetworkDefaultStats).lovelace = '0';
        var serializedAccount = JSON.stringify(account);
        Wallet.set(STORAGE.accounts, serializedAccount);
        
        // await AsyncStorage.setItem(STORAGE.accounts, serializedAccount);
      }
      return account as AccountInfo;
    }
    
    // var accountLedgerInfo = account as NetworkDefaultStats;
    // forcing acccount update for in case of breaking changes in an Nami update
    if (account[network.id]?.forceUpdate)
      delete account[network.id]?.forceUpdate;
      
    if (!offlineMode) {
      await updateBalance(account as AccountInfo);
    }
    
    (account[network.id] as NetworkDefaultStats).lastUpdate = account[network.id]?.history?.confirmed[0];
    var serializedAccount = JSON.stringify(account)        
    
    Wallet.set(STORAGE.accounts, serializedAccount);
    // await AsyncStorage.setItem(STORAGE.accounts, serializedAccount);
    
    return account as AccountInfo;
  };

  const updateTransactions = async (accountLedgerInfo: AccountInfo, network: Network) => {
    const transactions = await getTransactions();
    
    if (
      transactions?.length <= 0 ||
      accountLedgerInfo[network.id]?.history?.confirmed?.includes(
        transactions[0].txHash
      )
    )
    {
      return false;
    }
    
    let txHashes = transactions.map((tx: any) => tx.txHash);
    txHashes = txHashes.concat(accountLedgerInfo[network.id]?.history?.confirmed);
    const txSet = new Set(txHashes);
    if (accountLedgerInfo[network.id]?.history != undefined)
    {
        (accountLedgerInfo[network.id] as NetworkDefaultStats).history.confirmed = Array.from(txSet);
    }
    
    return true;
  };

  export const setTransactions = async (txs: any) => {
    const currentIndex = await getCurrentAccountIndex();
    const network = await getInitalNetwork();
    const account = await getCurrentAccount() as AccountInfo;
    (account[network.id] as NetworkDefaultStats).history.confirmed = txs;
    var serializedAccount = JSON.stringify(account)       

    // await AsyncStorage.setItem(STORAGE.accounts, serializedAccount);
    Wallet.set(STORAGE.accounts, serializedAccount);
  };
  
  export const setCollateral = async (collateral: any) => {
    const currentIndex = await getCurrentAccountIndex();
    const network = await getInitalNetwork();
    const account = await getCurrentAccount() as AccountInfo;
    (account[network.id] as NetworkDefaultStats).collateral = collateral;
    var serializedAccount = JSON.stringify(account)        

    // await AsyncStorage.setItem(STORAGE.accounts, serializedAccount);
    Wallet.set(STORAGE.accounts, serializedAccount);
  };
  
  export const removeCollateral = async () => {
    const currentIndex = await getCurrentAccountIndex();
    const network = await getInitalNetwork();
    const account = await getCurrentAccount() as AccountInfo;
    delete account[network.id]?.collateral;
  
    var serializedAccount = JSON.stringify(account)        

    // await AsyncStorage.setItem(STORAGE.accounts, serializedAccount);
    Wallet.set(STORAGE.accounts, serializedAccount);
  };
