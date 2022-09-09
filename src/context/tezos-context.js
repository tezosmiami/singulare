import { useEffect, useState, createContext, useContext} from "react";
import { TezosToolkit, MichelsonMap, OpKind } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";


const querySubjkt = `
query Subjkt($address: String!) {
  hic_et_nunc_holder(where: {address: {_eq: $address}}) {
    name
  }
}
`

async function fetchGraphQL(queryObjkts, name, variables) {
  let result = await fetch(process.env.REACT_APP_HICDEX_API, {
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
  name: 'S1NGULARE',
  preferredNetwork: 'jakartanet'
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
  const [tezos, setTezos] = useState(new TezosToolkit("https://jakartanet.ecadinfra.com"));
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
           data?.hic_et_nunc_holder[0]?.name && 
           setName(data.hic_et_nunc_holder[0].name);
          }
      }
    };
      getLoggedIn();
    }, [tezos]);
  
  async function sync() {
    app.currentWallet && await app.currentWallet?.logOut();
    await wallet.client.clearActiveAccount();
    await wallet.client.requestPermissions({
      network: {
        type: 'jakartanet',

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
     if(data?.hic_et_nunc_holder[0]?.name) {
        setName(data.hic_et_nunc_holder[0].name);
      }
    }
   
  }

  async function unsync() {
    await wallet.client.clearActiveAccount();
    setActiveAccount("")
    setAddress("");
    setName("")
    //  window.location.reload();
  }

  const mint = async(metadata, price, fee ) => {
   
   const token_metadata = new MichelsonMap()
   token_metadata.set(
    '',
    metadata.split('')
      .reduce(
          (hex, c) =>
              (hex += c.charCodeAt(0)
                  .toString(16)
                  .padStart(2, '0')),
          ''
      )
    );
   console.log(token_metadata)
    try {
        const contract = await tezos.wallet
            .at(process.env.REACT_APP_HARBERGER_MINT);
        const operation = await contract.methods.mint(
            token_metadata,
            parseFloat(price) * (10**6),
            parseFloat(fee) * 10
        ).send({amount: 0, storageLimit: 310});
        await operation.confirmation(1);
        console.log('Minted');
        console.log('Operation hash:', operation.hash);
    } catch(e) {
        console.log('Error:', e);
        return false;
    }
    return true;
};
  const costCollect = async ({price, token_id, deposit}) => {
   console.log(price,deposit)
    const contract = await tezos.wallet.at(process.env.REACT_APP_HARBERGER_FEES)
    const batch = await tezos.wallet.batch([
      { kind: OpKind.TRANSACTION, 
        ...contract.methods.transfer_to_deposit(deposit).toTransferParams({ amount: deposit, mutez: true, storageLimit: 210 }) 
      },
      { kind: OpKind.TRANSACTION, 
        ...contract.methods.collect(token_id,price).toTransferParams({ amount: price, mutez: true, storageLimit: 210 }) 
      }
    ]
    )
    
     const batchOp = await batch.send();
     console.log('Operation hash:', batchOp.hash);
    await batchOp.confirmation();
    return true;
  }
  async function collect({swap_id, price, contract, platform, token_id}) {
    try {
      const interact = await tezos.wallet.at(contract)
        const op = platform ==='HARBERGER' ?  await interact.methods['collect'](token_id, price)
                  : platform === 'VERSUM' ? await interact.methods['collect_swap'](1,swap_id)
                  : platform === 'HEN' || 'TYPED' ? await interact.methods['collect'](swap_id)
                  : platform === '8BIDOU' ? await interact.methods['buy'](swap_id, 1, price) 
                  : platform === 'OBJKT' ? await interact.methods['fulfill_ask'](swap_id)
                  : 
 ''

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

async function deposit(deposit) {
  try {
    const interact = await tezos.wallet.at(process.env.REACT_APP_HARBERGER_FEES)
      const op =  await interact.methods['transfer_to_deposit']()

      if(op) {await op.send({
        amount: deposit,
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



  const wrapped = { ...app, tezos, collect, costCollect, mint, deposit, sync, unsync, activeAccount, address, name};

  return (
   
    <TezosContext.Provider value={wrapped}>
           {children}
    </TezosContext.Provider>
  
  );
};

export default TezosContextProvider;