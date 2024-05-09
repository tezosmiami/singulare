import { useEffect, useState, createContext, useContext} from "react";
import { TezosToolkit, MichelsonMap } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";


const querySubjkt = `
query Subjkt($address: String!) {
  holder(where: {address: {_eq: $address}}) {
    name
  }
}
`

async function fetchGraphQL(queryObjkts, name, variables) {
  let result = await fetch(import.meta.env.VITE_HICDEX_API, {
    method: 'POST',
    body: JSON.stringify({
      query: queryObjkts,
      variables: variables,
      operationName: name,
    }),
  })
  return await result.json()
}

const TezosContext = createContext();
const options = {
  name: 'S1NGULARE'
 };
  
const wallet = new BeaconWallet(options);

export const useTezosContext = () => {

  const app = useContext(TezosContext);
  if (!app) {
    throw new Error(
      `!app`
    );
  }
  return app;
};

export const TezosContextProvider = ({ children }) => {
  
  const [app, setApp] = useState("");
  const [address, setAddress] = useState("");
  const [tezos, setTezos] = useState(new TezosToolkit("https://mainnet.api.tez.ie"));
  const [activeAccount, setActiveAccount] = useState("");
  const [name, setName] = useState("")

  useEffect(() => {
     const getLoggedIn = async () => {
        if (await wallet?.client?.getActiveAccount()) { 
          setActiveAccount(await wallet?.client?.getActiveAccount());
          const address =  await wallet.getPKH();
          setAddress(address);
          tezos.setWalletProvider(wallet);
          setTezos(tezos)
          if(address) {
            const { errors, data } = await fetchGraphQL(querySubjkt, 'Subjkt', { address: address});
           if (errors) {
             console.error(errors);
           }
           data?.holder[0]?.name && 
           setName(data.holder[0].name);
          }
      }
    };
      getLoggedIn();
    }, [tezos]);
  
  async function logIn() {
    app.currentWallet && await app.currentWallet?.logOut();
    await wallet.client.clearActiveAccount();
    await wallet.client.requestPermissions({
      network: {
        type: 'mainnet',
      },
    });
    tezos.setWalletProvider(wallet);
    setTezos(tezos)
    let address=await wallet.getPKH()
    setAddress(address);
    setActiveAccount(await wallet?.client?.getActiveAccount());
    if(address) {
        const { errors, data } = await fetchGraphQL(querySubjkt, 'Subjkt', { address: address});
     if (errors) {
       console.error(errors);
     }
     if(data?.holder[0]?.name) {
        setName(data.holder[0].name);
      }
    }
   
  }

  async function logOut() {
    await wallet.client.clearActiveAccount();
    setActiveAccount("")
    setAddress("");
    setName("")
    //  window.location.reload();
  }

  async function collect({swap_id, price, contract, platform}) {
    try {
      const interact = await tezos.wallet.at(contract)
        const op = platform === 'VERSUM' ? await interact.methods['collect_swap'](1,swap_id)
                  : platform === 'HEN' || platform === 'TYPED' ? await interact.methods['collect'](swap_id)
                  : platform === '8BIDOU' ? await interact.methods['buy'](swap_id, 1, price) 
                  : platform === 'OBJKT' ? contract === 'KT1WvzYHCNBvDSdwafTHv7nJ1dWmZ8GCYuuC'
                     ? await interact.methods['fulfill_ask'](swap_id) : await interact.methods['fulfill_ask'](swap_id, price, null, null, MichelsonMap.fromLiteral({tz2WNxPcE7JZhAFfqGEHkMtd2gcHaeiJKMWE: 10000}))
                  : ''

        if(op) {await op.send({
          amount: price,
          mutez: true,
          storageLimit: 310
      }) 
      // await op.confirmation(2)}
    }

    } catch(e) {
        console.log('Error:', e);
        return false;
    }
    return true;
};

  const wrapped = { ...app, tezos, collect, logIn, logOut, activeAccount, address, name};

  return (
   
    <TezosContext.Provider value={wrapped}>
           {children}
    </TezosContext.Provider>
  
  );
};

export default TezosContextProvider;