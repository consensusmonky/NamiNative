import React, { useEffect, useState } from "react";
import { Text, FlatList, View, SafeAreaView, Linking, useColorScheme } from "react-native";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { IconButton } from "react-native-paper";

type TransactionDetails = {
  id: string,
  txHash: any,
  lovelace: any,
  date: any,
  type: any
}

export function TransactionsList(props: {onClick: () => void, transactions: Array<TransactionDetails>}) {
    
    const isDarkMode = useColorScheme() === 'dark';

    // const getTxDetail = async () => {
    //     if (!displayInfo) {
    //       let txDetail = await updateTxInfo(txHash);
    //       onLoad(txHash, txDetail);
    //       if (!isMounted.current) return;
    //       setDisplayInfo(genDisplayInfo(txHash, txDetail, currentAddr, addresses));
    //     }
    //   };

  //   const [transactions, setTransactions] = useState([] as Array<{
  //     txHash: any,
  //     lovelace: any,
  //     type: any
  //  }>);

    
    function handleOpenUrl(txHash: string) {
        Linking.openURL('https://preprod.cardanoscan.io/transaction/' + txHash);
    }

    useEffect(() => {
        // updateTransactions();
        // setTransactions(props.transactionsData);
    }, [props.transactions]);

    return (
        <>
        
            {/* <SafeAreaView style={{flex: 1}} > */}
                <FlatList scrollEnabled={false} ListHeaderComponent={
      <>        
        <View style={{flexDirection: 'row'}}><Text style={{fontSize: 24, padding: 12, marginBottom: 12}}>Transaction history</Text></View>
      </>} data={props.transactions} renderItem={({item}: any) => 
                    <View style={[{flexDirection: 'column', flex: 1, height: 128}, isDarkMode ? {backgroundColor: Colors.darker} : {backgroundColor: Colors.lighter}]}>
                        <View style={[{flexDirection: 'row', flex: 1, padding: 4, height: 48, alignItems: 'center'}, isDarkMode ? {backgroundColor: Colors.darker} : {backgroundColor: Colors.lighter}]}>
                        {/* <Text style={{width: 96, paddingLeft: 12}} >{item.type}</Text> */}
                        { item.type == "SELF" ? <IconButton icon="account-arrow-left" style={{backgroundColor: isDarkMode ? Colors.lighter : Colors.lighter}} /> : item.type == "IN" ?<IconButton icon="arrow-down" style={{backgroundColor: isDarkMode ? Colors.lighter : Colors.lighter}} /> : <IconButton icon="arrow-up" style={{backgroundColor: isDarkMode ? Colors.lighter : Colors.lighter}} /> }
                        <Text style={{}} ></Text>
                        <Text style={item.lovelace < 0 ? {color: '#ff0000'} : {color: '#009900'}} >{((item.lovelace) / 1000000n).toString()} ADA</Text>
                        <Text style={{}} >    </Text>
                        <Text style={{}}>{item.date?.toLocaleString()}</Text>
                        </View>
                        <View style={{marginBottom: 8, flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ccc'}} onTouchEnd ={() => {handleOpenUrl(item.txHash)}}>
                            <IconButton size={15} icon="link" style={[isDarkMode ? {backgroundColor: Colors.darker} : {backgroundColor: Colors.lighter}, {margin: 0, marginTop: -10}]} />
                            <Text style={{fontSize: 9}}>{item.txHash}</Text>
                        </View> 
                        {/* <View style={{flexDirection: 'row', flex: 1, padding: 4, marginBottom: 2, backgroundColor: '#c0c0c0'}}>
                            <Text style={{}} >{item.txHash.substr(0, 25)}...</Text>
                            <Text style={{}} >{item}</Text>
                            <Text style={{}} >Block: {item}</Text>
                        </View> */}
                    </View>
                    }
                    ListFooterComponent={
                        <View/>
                      }/>
            {/* </SafeAreaView > */}
            {/* <Text>
                        Transactions
                    </Text>
                
                {
                    (transactions !== undefined) ? 
                    transactions.map((transaction: any) => {
                        <Text>{transaction.txHash}</Text>
                    })
                    :
                    <Text>no transactions available</Text>
                } */}
            
        </>
    )
}