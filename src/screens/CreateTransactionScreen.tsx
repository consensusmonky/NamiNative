import { Buffer } from "buffer";
import { createRef, useCallback, useEffect, useRef, useState } from 'react';
import "@mfellner/react-native-fast-create-hash"
import {
  ActivityIndicator,  
    Alert,  
    Modal,  
    NativeSyntheticEvent,    
    Pressable,    
    SafeAreaView,    
    StyleSheet,
    Text,
    TextInput,    
    TextInputTextInputEventData,
    TouchableOpacity,
    useColorScheme,
    View,
  } from 'react-native';
import  { SvgXml } from 'react-native-svg';
import React from 'react';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import {  BaseAddress, Address, Value, TransactionOutput, BigNum, TransactionUnspentOutput, Transaction, TransactionOutputs, AuxiliaryData, GeneralTransactionMetadata, encode_json_str_to_metadatum, TransactionMetadatum, TransactionBody, Ed25519KeyHash, Certificates, StakeRegistration, StakeDeregistration, StakeDelegation, PoolRegistration, MoveInstantaneousReward, MoveInstantaneousRewardsCert, MIRToStakeCredentials, Withdrawals, NativeScripts, ScriptPubkey, ScriptAll, ScriptAny, ScriptNOfK, Ed25519KeyHashes, EnterpriseAddress, PointerAddress, PoolRetirement } from '@emurgo/react-native-haskell-shelley';
import { useStateValue } from '../hooks/StateProvider';
import { assetsToValue, displayUnit, getAdaHandle, getCurrentAccount, getMilkomedaData, getNetwork, getSpecificUtxo, getUtxos, initTx, isValidAddress, isValidEthAddress, minAdaRequired, sumUtxos, toUnit, valueToAssets } from '../services/NetworkDataProviderService';
import { buildTx, signAndSubmit } from '../utils/Wallet';
import { ERROR } from '../config/config';
import AwesomeDebouncePromise from 'awesome-debounce-promise';
import Toast from 'react-native-toast-message';
import { debounce, transform } from 'lodash';
import { AccountInfo, Network, NetworkDefaultStats } from '../types/Network';
import { makeStyles } from "../../style";

const initialState = {
  fee: { fee: '0' },
  value: { ada: '', assets: new Array<any>(), personalAda: '', minAda: '0' },
  address: { result: '', display: '' },
  message: '',
  tx: undefined,
  txInfo: {
    protocolParameters: undefined,
    utxos: [],
    balance: { lovelace: '0', assets: undefined },
    milkomedaAddress: '',
  },
};

const useIsMounted = () => {
  const isMounted = React.useRef(false);
  React.useEffect(() => {
    isMounted.current = true;
    return () => {isMounted.current = false};    
  }, []);
  return isMounted;
};

export const CreateTransactionScreen = ({navigation, route}: any) => {  

  const isDarkMode = useColorScheme() === 'dark';
  const styles = makeStyles(isDarkMode);

  const isMounted = useIsMounted();
  let timer: any;  
    
  const [password, setPassword] = React.useState("");
  const inputElement = useRef<TextInput>({} as TextInput);

  React.useEffect(() => {
        
    const ini = async () => {
      await resetState();
      await init();
      setAddress({...address, display: route.params.walletAddress, result: route.params.walletAddress});
      if (route.params.walletAddress) {
        inputElement.current?.setNativeProps({
          selection: {
              start: 0,
              end: 0
          }
      });
        inputElement.current?.focus();
      }
    }
    ini();
    
    return () => {
        resetState();
    };
  }, [route]);

  const resetState = () => {
      setAddress({...initialState.address});
      setValue({...initialState.value});
      setMessage(initialState.message);
      setFee(initialState.fee);
      setTx(initialState.tx);
      setTxInfo(initialState.txInfo);
      setIsValidTransaction(false);
  }

  const [{ accountInfoReducer }, dispatch] = useStateValue();

  const [address, setAddress] = [
    accountInfoReducer?.address
    ,
    (value: any) => {
      dispatch({
        type: 'setAddress',
        value: value
      })
    }
  ]

  const [value, setValue] = [
    accountInfoReducer?.value
    ,
    (value: any) => {
      dispatch({
        type: 'setValue',
        value: value
      })
    }
  ]

  const [message, setMessage] = [
    accountInfoReducer?.message
    ,
    (message: any) => {
      dispatch({
        type: 'setMessage',
        value: message
      })
    }
  ];
  const [txInfo, setTxInfo] = [
    accountInfoReducer?.txInfo
    ,
    (txInfo: any) => {
      dispatch({
        type: 'setTxInfo',
        value: txInfo
      })
    }
  ];
  const [fee, setFee] = [
    accountInfoReducer?.fee
    ,
    (fee: any) => {
      dispatch({
        type: 'setFee',
        value: fee
      })
    }
  ];
  const [tx, setTx] = [
    accountInfoReducer?.tx
    ,
    (tx: any) => {
      dispatch({
        type: 'setTx',
        value: tx
      })
    }
  ];
    
  const milkomedaAddress = React.useRef(txInfo.milkomedaAddress);
  const [txUpdate, setTxUpdate] = React.useState(false);
  const triggerTxUpdate = (stateChange: any) => {
    stateChange();
    setTxUpdate((update) => !update);
  };

  const [modalVisible, setModalVisible] = useState(false);
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("0");

  const utxos = React.useRef({} as Array<any>);
  const assets = React.useRef({} as Array<any>);
  const account = React.useRef({} as AccountInfo);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isValidTransaction, setIsValidTransaction] = React.useState(false);
  const [keyHashes, setKeyHashes] = React.useState({ kind: [], key: [] } as {kind: string[], key: string[]});
  const focus = React.useRef(false);
  // const background = useColorModeValue('gray.100', 'gray.600');

const network = React.useRef({} as Network);

useEffect(() => {
  resetState();
},[])

const init = async () => {
  if (!isMounted.current) return;
  setTxInfo({...initialState.txInfo});
  addAssets(value?.assets);
  const _currentAccount = await getCurrentAccount() as AccountInfo;
  const _network = await getNetwork();
  network.current = _network;
  account.current = _currentAccount;  
  
  if (txInfo.protocolParameters) {
    const _utxos = await Promise.all(txInfo.utxos?.map(async (utxo: any) => {
      await TransactionUnspentOutput.from_bytes(Buffer.from(utxo, 'hex'));
    }));
     utxos.current = _utxos;
     setIsLoading(false);
     return;
  }
  
  let _utxos = await getUtxos() as TransactionUnspentOutput[];
  
  const protocolParameters = await initTx();
  const address = (await Address.from_bech32(_currentAccount[_network.id]?.paymentAddr as string)) as Address
  const checkOutput = await TransactionOutput.new(
    address,
    await Value.zero()
    );
    
  const minUtxo = await minAdaRequired(
    await checkOutput,
    (await BigNum.from_str(protocolParameters.coinsPerUtxoWord)) as BigNum
  )

  protocolParameters.minUtxo = minUtxo;
  const utxoSum = await sumUtxos(_utxos)
  
  let balance = await valueToAssets(utxoSum);
  var lovelaces = balance.find((v: any) => v.unit === 'lovelace')?.quantity;
  var totalBalance = {
    lovelace: lovelaces,
    assets: balance.filter((v) => v.unit !== 'lovelace'),
  };
  
  utxos.current = _utxos as TransactionUnspentOutput[];
  
  const _utxosHashes: string[] = await Promise.all(_utxos?.map(async (utxo: any) => Buffer.from(await utxo.to_bytes(), 'hex').toString('hex') ))
  const { current_address: milkomedaAddress } = await getMilkomedaData('');
  
  if (!isMounted.current) return;
  
  setIsLoading(false);  
  setTxInfo({ protocolParameters, utxos: _utxosHashes, totalBalance, milkomedaAddress });
};

const objectToArray = (obj: any) => Object.keys(obj)?.map((key) => obj[key]);

const addAssets = (_assets: any) => {
  _assets?.forEach((asset: any) => {
      assets.current[asset.unit] = { ...asset };
  });
  const assetsList = objectToArray(assets.current);
  triggerTxUpdate(() => setValue({ ...value, assets: assetsList }));
  
};

const removeAllAssets = () => {
  assets.current = [];
  triggerTxUpdate(() => setValue({ ...value, assets: [] }));
};

const removeAsset = (asset: any) => {
  delete assets.current[asset.unit];
  const assetsList = objectToArray(assets.current);
  triggerTxUpdate(() => setValue({ ...value, assets: assetsList }));
};

const keyPress = (event: any) => {

  /* this line will solve your error */
  
  event.persist();
  
  
  if (isNaN(event.nativeEvent.key)) 
  {
    setAmount("0.000000")
  }
}

const prepareTx = async (count: any, data: any) => {
  setIsValidTransaction(false);
  if (!isMounted.current) return;
  await new Promise((res: any, rej: any) => {
    const interval = setInterval(() => {
      if (utxos.current) {
        clearInterval(interval);
        res();
        return;
      }
    });
  });

  const _value = data.value;
  const _address = data.address;
  const _message = data.message;
  
  if (!_value.ada && _value.assets.length <= 0) {
    
    setFee({ fee: '0' });
    setTx(null);
    setIsLoading(false);
    return;
  }
  var unit = toUnit(_value.ada);
  
  if (
    _address.error ||
    !_address.result ||
    (!_value.ada && _value.assets.length <= 0) ||
    (address.isM1 &&
      BigInt(unit) <
        BigInt(address.ada.minLovelace) +
          BigInt(address.ada.fromADAFeeLovelace))
  ) {
    setFee({ fee: '0' });
    setTx(null);
    setIsLoading(false);
    
  
    return;
  }
  
  if (count >= 5) {
    setFee({ error: 'Transaction not possible' });
    setIsLoading(false);
    throw ERROR.txNotPossible;
  }
  
  setFee({ fee: '' });
  setTx(null);
  await new Promise((res: any, rej) => setTimeout(() => res()));

  var acc = (account.current as AccountInfo)[network.current.id] as any;
  // const val = acc.lovelace.length > 6 ? acc.lovelace.slice(0, acc.lovelace.length-6): acc.lovelace;
  

  try {
    const output = {
      address: _address.result,
      amount: [
        {
          unit: 'lovelace',
          quantity: toUnit(_value.ada || '10000000'),
        },
      ],
    };
    
    for (const asset of _value?.assets) {
      if (
        !asset.input ||
        BigInt(toUnit(asset.input, asset.decimals) || '0') < 1
      ) {
        setFee({ error: 'Asset quantity not set' });
        setIsLoading(false);
        return;
      }
      output.amount.push({
        unit: asset.unit,
        quantity: toUnit(asset.input, asset.decimals),
      });
    }
    
  const checkOutput = await TransactionOutput.new(
    _address.isM1
      ? (await Address.from_bech32(_address.result)) as Address
      : (await Address.from_bytes(
          (await isValidAddress(_address.result)) as Uint8Array)
        ) as Address,
    await assetsToValue(output.amount)
  );

    const minAda = await minAdaRequired(
      checkOutput,
      (await BigNum.from_str(
        txInfo.protocolParameters.coinsPerUtxoWord)
      ) as BigNum
    );
    
    if (BigInt(minAda) <= BigInt(toUnit(_value.personalAda || '0'))) {
      const displayAda = parseFloat(
        _value.personalAda.replace(/[,\s]/g, '')
      ).toLocaleString('en-US', { minimumFractionDigits: 6 });
      output.amount[0].quantity = toUnit(_value.personalAda || '0');
      !focus.current && setValue({ ...value, ada: displayAda });
    } else if (_value.assets.length > 0) {
      output.amount[0].quantity = minAda;
      const minAdaDisplay = parseFloat(
        displayUnit(minAda).toString().replace(/[,\s]/g, '')
      ).toLocaleString('en-US', { minimumFractionDigits: 6 });
      setValue({
        ...value,
        ada: minAdaDisplay,
      });
    }
    
    if (BigInt(minAda) > BigInt(output.amount[0].quantity || '0')) {
      setFee({ error: 'Transaction not possible' });
      setIsLoading(false);
      return;
    }
    
    const outputs = await TransactionOutputs.new();
    await outputs.add(await 
      TransactionOutput.new(
        _address.isM1
          ? (await Address.from_bech32(_address.result)) as Address
          : (await Address.from_bytes(
              (await isValidAddress(_address.result)) as Uint8Array
            )) as Address,
        await assetsToValue(output.amount)
      )
    );
    
    const auxiliaryData = await AuxiliaryData.new();
    const generalMetadata = await GeneralTransactionMetadata.new();
    
    // setting metadata for MilkomedaM1
    if (_address.isM1) {
      const ethAddress = _address.display;
      if (!isValidEthAddress(ethAddress)) {
        setIsLoading(false);
        throw new Error('Not a valid ETH address');
      }
      generalMetadata.insert(
        (await BigNum.from_str('87')) as BigNum,
        (await encode_json_str_to_metadatum(
          JSON.stringify(_address.protocolMagic),
          0
        )) as TransactionMetadatum
      );
      (await generalMetadata.insert(
        (await BigNum.from_str('88')) as BigNum,
        (await encode_json_str_to_metadatum(
          JSON.stringify(ethAddress),
          0
        )) as TransactionMetadatum
      )) as TransactionMetadatum;
    }
    
    // setting metadata for optional message (CIP-0020)
    if (_message) {
      function chunkSubstr(str: any, size: any) {
        const numChunks = Math.ceil(str.length / size);
        const chunks = new Array(numChunks);

        for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
          chunks[i] = str.substr(o, size);
        }

        return chunks;
      }
      const msg = { msg: chunkSubstr(_message, 64) };
      (await generalMetadata.insert(
        (await BigNum.from_str('674')) as BigNum,
        (await encode_json_str_to_metadatum(JSON.stringify(msg), 1)) as TransactionMetadatum
      )) as TransactionMetadatum;
    }

    if ((await generalMetadata.len()) > 0) {
      auxiliaryData.set_metadata(generalMetadata);
    }
    
    const tx = (await buildTx(
      account.current,
      utxos.current,
      outputs,
      txInfo.protocolParameters,
      ((await auxiliaryData.metadata()) as GeneralTransactionMetadata) ? auxiliaryData : null
    ).catch((e) => {       
      setMessage(e?.toString())})) as TransactionBody;
      
    var transAction = Buffer.from((await tx.to_bytes())).toString('hex');
  
    if (!value?.maxAda) {
      var fee = await ((await tx.fee()).to_str());
      setFee({ fee: fee });
    }    
     
     setIsLoading(false);
     setTx(transAction);
     setIsValidTransaction(true);
  } catch (e) {
    // prepareTx(count + 1, data);
    setIsLoading(false);
  }
};

const handleInput = async (val: any) => {
  // setIsLoading(true);
  let addr;
  let isHandle = false;
  let isM1 = false;
  if (!val) {
    addr = { result: '', display: '' };
  } else if (val.startsWith('$')) {
    isHandle = true;
    addr = { display: val };
  } else if (val.startsWith('0x')) {
    if (isValidEthAddress(val)) {
      isM1 = true;
      addr = {
        display: val,
        isM1: true,
        ada: {
          minLovelace: '2000000',
          fromADAFeeLovelace: '500000',
        },
      };
    } else {
      addr = {
        result: val,
        display: val,
        isM1: true,
        ada: {
          minLovelace: '2000000',
          fromADAFeeLovelace: '500000',
        },
        error: 'Address is invalid (Milkomeda)',
      };
    }
  } else if (
    (await isValidAddress(val)) &&
    val !== milkomedaAddress.current
  ) {
    addr = { result: val, display: val };
  } else {
    addr = {
      result: val,
      display: val,
      error: 'Address is invalid',
    };
  }

  if (isHandle) {
    const handle = val;
    const resolvedAddress = await getAdaHandle(handle.slice(1));
    if (handle.length > 1 && (await isValidAddress(resolvedAddress))) {
      addr = {
        result: resolvedAddress,
        display: val,
      };
    } else {
      addr = {
        result: '',
        display: val,
        error: '$handle not found',
      };
    }
  } else if (isM1) {
    const { isAllowed, ada, current_address, protocolMagic, assets, ttl } =
      await getMilkomedaData(val);

    if (!isAllowed || !isValidEthAddress(val)) {
      addr = {
        result: '',
        display: val,
        isM1: true,
        ada,
        ttl,
        protocolMagic,
        assets,
        error: 'Address is invalid (Milkomeda)',
      };
    } else {
      addr = {
        result: current_address,
        display: val,
        isM1: true,
        ada,
        ttl,
        protocolMagic,
        assets,
      };
    }
  }
  return addr;
};

const getKeyHashes = async (tx: Transaction, utxos: TransactionUnspentOutput[], account: any) => {
  let requiredKeyHashes = [];
  const baseAddr = (await BaseAddress.from_address((await
    Address.from_bech32(account.paymentAddr)) as Address) as BaseAddress
  );
  const paymentKeyHash = Buffer.from((await ((await (await
    baseAddr.payment_cred()).to_keyhash()) as Ed25519KeyHash).to_bytes())
  ).toString('hex');
  const stakeKeyHash = Buffer.from((await ((await (await
    baseAddr.stake_cred()).to_keyhash()) as Ed25519KeyHash).to_bytes())
  ).toString('hex');

  //get key hashes from inputs
  const inputs = await (await tx.body()).inputs();
  for (let i = 0; i < await inputs.len(); i++) {
    const input = await inputs.get(i);
    const txHash = Buffer.from(await (await input.transaction_id()).to_bytes()).toString(
      'hex'
    );
    const index = (await input.index());
    if (
      utxos.some(
        async (utxo) =>
          Buffer.from(await (await ((await utxo.input()).transaction_id())).to_bytes()).toString(
            'hex'
          ) === txHash && (await (await utxo.input()).index()) === index
      )
    ) {
      requiredKeyHashes.push(paymentKeyHash);
    } else {
      requiredKeyHashes.push('<not_owned_key_hash>');
    }
  }

  //get key hashes from certificates
  const txBody = await tx.body();
  const keyHashFromCert = async (txBody: TransactionBody) => {
    var certs = (await txBody.certs()) as Certificates;
    for (let i = 0; i < await certs.len(); i++) {
      const cert = await certs.get(i);
      if (await cert.kind() === 0) {
        const credential = await ((await cert.as_stake_registration()) as StakeRegistration).stake_credential();
        if (await credential.kind() === 0) {
          // stake registration doesn't required key hash
        }
      } else if (await cert.kind() === 1) {
        const credential = await ((await cert.as_stake_deregistration()) as StakeDeregistration).stake_credential();
        if (await credential.kind() === 0) {
          const keyHash = Buffer.from(
            await ((await credential.to_keyhash()) as Ed25519KeyHash).to_bytes()
          ).toString('hex');
          requiredKeyHashes.push(keyHash);
        }
      } else if (await cert.kind() === 2) {
        const credential = await (( await cert.as_stake_delegation()) as StakeDelegation).stake_credential();
        if (await credential.kind() === 0) {
          const keyHash = Buffer.from(
            await ((await  credential.to_keyhash()) as Ed25519KeyHash).to_bytes()
          ).toString('hex');
          requiredKeyHashes.push(keyHash);
        }
      } else if (await cert.kind() === 3) {
        const owners = (await (await (( await cert
          .as_pool_registration()) as PoolRegistration)
          .pool_params())
          .pool_owners());
        for (let i = 0; i < await owners.len(); i++) {
          const keyHash = Buffer.from((await (await  owners.get(i)).to_bytes())).toString(
            'hex'
          );
          requiredKeyHashes.push(keyHash);
        }
      } else if (await cert.kind() === 4) {
        const operator = await (await (await (cert.as_pool_retirement()) as PoolRetirement).pool_keyhash()).to_hex();
        requiredKeyHashes.push(operator);
      } else if (await cert.kind() === 6) {
        const instant_reward = (await ((await (await ((await  cert
          .as_move_instantaneous_rewards_cert()) as MoveInstantaneousRewardsCert)
          .move_instantaneous_reward())
          .as_to_stake_creds()) as MIRToStakeCredentials)
          .keys());
        for (let i = 0; i < await instant_reward.len(); i++) {
          const credential = await  instant_reward.get(i);

          if (await credential.kind() === 0) {
            const keyHash = Buffer.from(
              await ((await credential.to_keyhash()) as Ed25519KeyHash).to_bytes()).toString('hex');
            requiredKeyHashes.push(keyHash);
          }
        }
      }
    }
  };
  if (await txBody.certs()) keyHashFromCert(txBody);

  // key hashes from withdrawals
  const withdrawals = (await txBody.withdrawals()) as Withdrawals;
  const keyHashFromWithdrawal = async (withdrawals: Withdrawals) => {
    const rewardAddresses = await withdrawals.keys();
    for (let i = 0; i < await rewardAddresses.len(); i++) {
      const credential = await (await rewardAddresses.get(i)).payment_cred();
      if (await credential.kind() === 0) {
        requiredKeyHashes.push(await ((await credential.to_keyhash()) as Ed25519KeyHash).to_hex());
      }
    }
  };
  if (withdrawals) keyHashFromWithdrawal(withdrawals);

  //get key hashes from scripts
  const scripts = (await (await tx.witness_set()).native_scripts()) as NativeScripts;
  const keyHashFromScript: any =  async (scripts: NativeScripts) => {
    for (let i = 0; i < await scripts.len(); i++) {
      const script = await scripts.get(i);
      if (await script.kind() === 0) {
        const keyHash = Buffer.from(await (await ((await script.as_script_pubkey()) as ScriptPubkey).addr_keyhash()).to_bytes()
        ).toString('hex');
        requiredKeyHashes.push(keyHash);
      }
      if (await script.kind() === 1) {
        return keyHashFromScript(await ((await script.as_script_all()) as ScriptAll).native_scripts());
      }
      if (await script.kind() === 2) {
        return keyHashFromScript(await ((await script.as_script_any()) as ScriptAny).native_scripts());
      }
      if (await script.kind() === 3) {
        return keyHashFromScript(await ((await script.as_script_n_of_k()) as ScriptNOfK).native_scripts());
      }
    }
  };
  if (scripts) keyHashFromScript(scripts);

  //get keyHashes from required signers
  const requiredSigners = ((await (await tx.body()).required_signers()) as Ed25519KeyHashes);
  if (requiredSigners) {
    for (let i = 0; i < await requiredSigners.len(); i++) {
      requiredKeyHashes.push(
        Buffer.from((await (await requiredSigners.get(i)).to_bytes())).toString('hex')
      );
    }
  }

  //get keyHashes from collateral
  const collateral = await txBody.collateral();
  if (collateral) {
    for (let i = 0; i < await collateral.len(); i++) {
      const c = await collateral.get(i);
      const utxo = await getSpecificUtxo(
        Buffer.from(await (await c.transaction_id()).to_bytes()).toString('hex'),
        await c.index()
      );
      if (utxo) {
        const address = (await Address.from_bech32(utxo.address)) as Address;
        requiredKeyHashes.push(await getPaymentKeyHash(address));
      }
    }
  }

  const keyKind = [];
  requiredKeyHashes = [...new Set(requiredKeyHashes)];
  if (requiredKeyHashes.includes(paymentKeyHash)) keyKind.push('payment');
  if (requiredKeyHashes.includes(stakeKeyHash)) keyKind.push('stake');
  if (keyKind.length <= 0) {
    setIsLoading((l: any) => ({
      ...l,
      error: 'Signature not possible',
    }));
    return;
  }
  setKeyHashes({ key: requiredKeyHashes, kind: keyKind });
};

const getPaymentKeyHash = async (address: Address) => {
  try {
    var addressByteArray =  (await Address.from_bytes(await address.to_bytes())) as Address;
    return Buffer.from(
      (await (await (await ((await BaseAddress.from_address(addressByteArray)) as BaseAddress)
        .payment_cred())
        .to_keyhash() as Ed25519KeyHash)
        .to_bytes()
    )).toString('hex');
  } catch (e) {}
  try {
    var addressByteArray =  (await Address.from_bytes(await address.to_bytes())) as Address;
    return Buffer.from(
      (await (await (await ((await EnterpriseAddress.from_address(addressByteArray)) as EnterpriseAddress)
        .payment_cred())
        .to_keyhash() as Ed25519KeyHash)
        .to_bytes()
    )).toString('hex');
  } catch (e) {}
  try {
    var addressByteArray =  (await Address.from_bytes(await address.to_bytes())) as Address;
    return Buffer.from(
      (await (await (await ((await PointerAddress.from_address(addressByteArray)) as PointerAddress)
        .payment_cred())
        .to_keyhash() as Ed25519KeyHash)
        .to_bytes()
    )).toString('hex');
  } catch (e) {}
  throw Error('Not supported address type');
};

const handleInputDebounced = AwesomeDebouncePromise(handleInput, 300);

const sign = async(password: any, hw: any) => {
          setIsLoading(true);
          // const txDes = (await Transaction.from_bytes(
          //   Buffer.from(tx)
          // )) as Transaction;
          
          // if (hw)
          //   return await signAndSubmitHW(txDes, {
          //     keyHashes: [account.current.paymentKeyHash],
          //     account: account.current,
          //     hw,
          //   });
          // else
          
          return await signAndSubmit(
            tx,
            {
              accountIndex: 0,
              keyHashes: [account.current.paymentKeyHash],
            },
            password
          );
            // TODO: Check already consumed UTxO.
            // {"error": "Bad Request", "message": "\"transaction submit error ShelleyTxValidationError ShelleyBasedEraBabbage (ApplyTxError [UtxowFailure (UtxoFailure (FromAlonzoUtxoFail (ValueNotConservedUTxO (Value 0 (fromList [])) (Value 5719135619 (fromList []))))),UtxowFailure (UtxoFailure (FromAlonzoUtxoFail (BadInputsUTxO (fromList [TxIn (TxId {_unTxId = SafeHash \\\"d0d73575f428865978d601f0c3596a08ba1155d08bb9fb2f69c64cc8de2bb3b0\\\"}) (TxIx 1)]))))])\"", "status_code": 400}
}

// function normaliseValue (value: string, decimals = 2) {
//   if (!value) {
//     return ''
//   }
//   if (value === '.') {
//     return value = '0.'
//   }

//   var regex = new RegExp(`^-?\\d+(?:\\.\\d{0,${decimals}})?`)
//   const decimalsNumber = value.toString().match(regex)[0]
//   const parsed = parseFloat(parseFloat(decimalsNumber).toFixed(2))
//   if (isNaN(parsed)) {
//     return '0'
//   }
//   return parsed
// }

let ignoreInputDelayFlag = false;
const updateValueHandler = useCallback(debounce(updateValue, 2500), []);

function updateValue(val: string) {  
      triggerTxUpdate(() => {});      
}

function onSuccess(result: string) {
    resetState();
    setModalVisible(!modalVisible);
    setMessage("");
    setIsLoading(false);
    Toast.show({
      type: 'success',
      text1: 'Transaction was sent successfully',
      // text2: 'This is some something 👋'
    });
    setTimeout(() => {
      navigation.navigate('Home', {hideLoadingScreen: true, skipWalletUpdate: true});
    }, 1500)
}

function onFailure(e: any) {
    Toast.show({
      type: 'error',
      text1: 'transaction could not be sent \n',
      // text2: 'This is some something 👋'
    });
    let message: string = e?.info ?? e?.toString() ?? "fatal error";
    if (e.message?.indexOf("ValueNotConservedUTxO") >= 0) {
      message = "Error: UTxO already spent."
    }
    setMessage(message);
    setIsLoading(false);
}

React.useEffect(() => {

  if (txInfo.protocolParameters) {
    clearTimeout(timer);
    setTx(null);
    setFee({ fee: '' });
    timer = setTimeout(() => prepareTx(0, { value, address, message }), 500);
  }
}, [txUpdate]);

async function setMaxBalance() {
       
  if (utxos.current.length == 0) {
    return;
  }

  var acc = (account.current as AccountInfo)[network.current.id] as any;
  setIsValidTransaction(false);
  setMessage("");
  setIsLoading(true)
  
    const newVal = (((Number(acc.lovelace)* 0.997956588)/1000000)).toString();
    
    const _feeCalcOutput = {
      address: address.result,
      amount: [
        {
          unit: 'lovelace',
          quantity: toUnit(newVal || '10000000'),
        },
      ],
    };
    
    const _feeCalcOutputs = await TransactionOutputs.new();
      await _feeCalcOutputs.add(await 
        TransactionOutput.new(
          address.isM1
            ? (await Address.from_bech32(address.result)) as Address
            : (await Address.from_bytes(
                (await isValidAddress(address.result)) as Uint8Array
              )) as Address,
          await assetsToValue(_feeCalcOutput.amount)
        )
      );

    const tx = (await buildTx(
      account.current,
      utxos.current,
      _feeCalcOutputs,
      txInfo.protocolParameters,
      null
    ).catch((e) => {       
      setMessage(e?.toString())})) as TransactionBody;
      var fee = await ((await tx.fee()).to_str());
      
      const val = ((Number(acc.lovelace)/1000000) - (Number(fee)/1000000)).toString();
      console.log(fee)
  // const val = acc.lovelace.length > 6 ? acc.lovelace.slice(0, acc.lovelace.length-6): acc.lovelace;
  
  value.ada = val;
  value.personalAda = val;
  value.maxAda = true;

  const maxValue = value;
  

  // setValue({
  //   ...maxValue,
  //     })
      // prepareTx(0, { value: value, address, message });
            setValue({
              ...maxValue
                })
            
            // updateValueHandler(val);
       triggerTxUpdate(() => setValue({...maxValue}));
       updateValueHandler(val);
  // setIsLoading(true)
  // updateValueHandler(val);
  // // updateValueHandler(maxValue.ada);
  // console.log(val);
  
  // setIsLoading(true)
  // triggerTxUpdate(() => setValue({ value: acc.lovelace, ...assets }));
  
}

function onTextChanged(val: string) {

  if (val == "") {
    value.ada = 0;
    value.personalAda = 0
    setIsLoading(false);
    return;
  }
  
  // var regex = new RegExp(`^-?\\d+(?:\\.\\d{0,${6}})?`)
  // const decimalsNumber = val.match(regex)[0]
  // const parsed = parseFloat(decimalsNumber).toFixed(6)

  value.ada = val;//val.replace(/[- #*;<>\{\}\[\]\\\/]/gi, '');
  value.personalAda = val; //val.replace(/[- #*;<>\{\}\[\]\\\/]/gi, '');
  const v = value;
  
  triggerTxUpdate(() => setValue({... v}));
}
const changeAmount = (newAmount: string) => {
    setAmount(parseFloat(newAmount).toLocaleString());  
}

    return (
    <SafeAreaView> 
      <View style={{zIndex: 10}}>
        <Toast />
      </View>
    <View style={{paddingTop: 50}}>
      <View style={{alignSelf: 'center'}}>
        <View style={{alignSelf: 'center'}}>
            
            <SvgXml xml={dataUriExample} width={75} height={75} fill={"#61DDBC"}  />  
            </View>
            <View style={[styles.container, {paddingTop: 20}]}>
              <Text style={[styles.sectionTitle, {fontSize: 32}]}>Send</Text>
            </View>
            
            
          <View
            style={{
              display: 'flex',
              flex: 1,
              flexWrap: 'wrap',
              flexDirection: 'column',
              margin: 1,
          }}><TextInput
          style={styles.input}
          onChangeText={async (addr: string) =>  {
              setIsValidTransaction(false);
              setMessage("");
              setAddress({...address, display: addr})
              const addressToUse = await handleInputDebounced(addr);
              setAddress({...address, display: addr, result: addressToUse.result, error: addressToUse.error})
            
              setIsLoading(true);                
              triggerTxUpdate(() => {} /*setAddress({...address, result: addressToUse.result})*/);
            }           
          }
          onTextInput={(e: NativeSyntheticEvent<TextInputTextInputEventData>) => {
          }}
          
          value={address?.display}
          placeholder="Address"
        />
        <TextInput
          editable={utxos?.current.length > 0 && address.display !== "" && !address.error}
          style={styles.input}
          ref={inputElement}
          onChangeText={async (val: string) => {
            if (utxos.current.length == 0 || !address) {
                return;
            }
            setIsValidTransaction(false);
            setMessage("");
            value.ada = val;
            value.personalAda = val;
            const newVal = value;
            setValue({
              ...newVal,
                })
            setIsLoading(true)
            updateValueHandler(val);
        }}
          value={value?.ada}
          keyboardType='numeric'
          placeholder="0.000000"
        />
                  <TouchableOpacity disabled={utxos.current.length == 0 || address.display === "" || address.error !== undefined} style={{justifyContent: "flex-end", alignSelf: "stretch", position: 'absolute', right: 16, top: 56}}
                    onPress={setMaxBalance}
                  >
                    <Text style={[!isLoading ? { display: 'flex' } : {display: 'none'}, isDarkMode ? {color: Colors.dark} : {color: Colors.darker}]}>max</Text>
                  </TouchableOpacity>
                  <View style={{flexDirection: 'row', maxWidth: 300, justifyContent: 'center'}}><Text>{address.error}</Text><Text>{message?.toString() ?? ""}</Text></View>
                  <TouchableOpacity
                      style={[styles.buttons, styles.buttonOpen, {width: 164, alignSelf: 'center'}, !isValidTransaction ? {backgroundColor: "#cecece"} : {}]}
                      // onPress={() => WalletService.createWallet(mnemonicCorrectOrder(), "test", "test", "P4ssw0rd")}
                      // onPress={() => {setModalVisible(!modalVisible); navigation.navigate('CreateAccount', {entropy: mnemonic})}}

                      // onPress={() => {sign("Hallo Welt", false)}}
                       onPress={() => setModalVisible(true)}
                      disabled={!isValidTransaction}
                  >
                    <Text style={[!isLoading ? { display: 'flex' } : {display: 'none'}, isDarkMode ? {color: Colors.dark} : {color: Colors.darker}]}>Send</Text>
                    <ActivityIndicator size="small" color={Colors.dark}  style={[ isLoading ? { display: 'flex' } : {display: 'none'}]}/>                    
                  </TouchableOpacity>
          </View>
          <Modal
                  animationType="fade"
                  transparent={true}
                  visible={modalVisible}
                  onRequestClose={() => {
                    setModalVisible(!modalVisible);
                  }}>
                    <View style={[{position: 'absolute', top:0, left: 0, right: 0, bottom: 0}, isDarkMode ? {backgroundColor: Colors.darker, opacity: 0.9} : {backgroundColor: Colors.darker, opacity: 0.5}]}></View>
                  <View style={[styles.centeredView,]}>
                    <View style={[styles.modalView, isDarkMode ? {backgroundColor: '#353535'} : {backgroundColor: Colors.lighter}]}>
                      <SafeAreaView style={{alignItems: 'center'}}>
                        <Text style={[styles.sectionTitle, {fontSize: 22}]}>Enter wallet password</Text>
                        <TextInput
                          style={styles.input}
                          onChangeText={(newPassword: string) => {setPassword(newPassword);}}
                          value={password}
                          placeholder="password"
                          secureTextEntry={true}
                        />
                          <View style={{flexDirection: 'row'}}>
                            <TouchableOpacity
                              style={[styles.buttons, styles.buttonClose]}
                              onPress={() => { setMessage(""); setModalVisible(!modalVisible);}}
                              
                              >
                              <Text style={[styles.textStyle, isDarkMode ? {color: Colors.dark} : {color: Colors.darker}]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.buttons, styles.buttonClose, password.length < 8 ? {backgroundColor: "#c0c0c0"}: {}]}
                              // onPress={() => {setModalVisible(!modalVisible); navigation.navigate('SeedGenerator')}}
                              onPress={() => {password.length >= 8 && sign(password, false).then(onSuccess).catch(onFailure);}}
                              >
                              <Text style={[styles.textStyle, isDarkMode ? {color: Colors.dark} : {color: Colors.darker}]}>Sign</Text>
                            </TouchableOpacity>
                            </View>
                            <Text style={[styles.textStyle, isDarkMode ? {color: Colors.dark} : {color: Colors.darker}]}>{message}</Text>
                            </SafeAreaView>
                          </View>
                  </View>
                </Modal>
         <View style={{marginBottom: 24}}>
          </View>        
      </View>
    </View>
    </SafeAreaView>
    );
};

const svgDecoded = Buffer.from("PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0ODYuMTcgNDk5Ljg2Ij48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6IzM0OWVhMzt9PC9zdHlsZT48L2RlZnM+PGcgaWQ9IkxheWVyXzIiIGRhdGEtbmFtZT0iTGF5ZXIgMiI+PGcgaWQ9IkxheWVyXzEtMiIgZGF0YS1uYW1lPSJMYXllciAxIj48cGF0aCBpZD0icGF0aDE2IiBjbGFzcz0iY2xzLTEiIGQ9Ik03My44Nyw1Mi4xNSw2Mi4xMSw0MC4wN0EyMy45MywyMy45MywwLDAsMSw0MS45LDYxLjg3TDU0LDczLjA5LDQ4Ni4xNyw0NzZaTTEwMi40LDE2OC45M1Y0MDkuNDdhMjMuNzYsMjMuNzYsMCwwLDEsMzIuMTMtMi4xNFYyNDUuOTRMMzk1LDQ5OS44Nmg0NC44N1ptMzAzLjM2LTU1LjU4YTIzLjg0LDIzLjg0LDAsMCwxLTE2LjY0LTYuNjh2MTYyLjhMMTMzLjQ2LDE1LjU3SDg0TDQyMS4yOCwzNDUuNzlWMTA3LjZBMjMuNzIsMjMuNzIsMCwwLDEsNDA1Ljc2LDExMy4zNVoiLz48cGF0aCBpZD0icGF0aDE4IiBjbGFzcz0iY2xzLTEiIGQ9Ik0zOC4yNywwQTM4LjI1LDM4LjI1LDAsMSwwLDc2LjQ5LDM4LjI3djBBMzguMjgsMzguMjgsMCwwLDAsMzguMjcsMFpNNDEuOSw2MS44YTIyLDIyLDAsMCwxLTMuNjMuMjhBMjMuOTQsMjMuOTQsMCwxLDEsNjIuMTgsMzguMTNWNDBBMjMuOTQsMjMuOTQsMCwwLDEsNDEuOSw2MS44WiIvPjxwYXRoIGlkPSJwYXRoMjAiIGNsYXNzPSJjbHMtMSIgZD0iTTQwNS43Niw1MS4yYTM4LjI0LDM4LjI0LDAsMCwwLDAsNzYuNDYsMzcuNTcsMzcuNTcsMCwwLDAsMTUuNTItMy4zQTM4LjIyLDM4LjIyLDAsMCwwLDQwNS43Niw1MS4yWm0xNS41Miw1Ni40YTIzLjkxLDIzLjkxLDAsMSwxLDguMzktMTguMThBMjMuOTEsMjMuOTEsMCwwLDEsNDIxLjI4LDEwNy42WiIvPjxwYXRoIGlkPSJwYXRoMjIiIGNsYXNzPSJjbHMtMSIgZD0iTTEzNC41OCwzOTAuODFBMzguMjUsMzguMjUsMCwxLDAsMTU3LjkyLDQyNmEzOC4yNCwzOC4yNCwwLDAsMC0yMy4zNC0zNS4yMlptLTE1LDU5LjEzQTIzLjkxLDIzLjkxLDAsMSwxLDE0My41NCw0MjZhMjMuOSwyMy45LDAsMCwxLTIzLjk0LDIzLjkxWiIvPjwvZz48L2c+PC9zdmc+", 'base64').toString('ascii');
const dataUriExample = "data:image/svg+xml;base64" + svgDecoded;

