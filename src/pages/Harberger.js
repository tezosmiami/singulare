import React, { useState, useEffect } from 'react';
import { useTezosContext } from '../context/tezos-context';
import { request, gql } from 'graphql-request';
import ReactPlayer from 'react-player';
import { useParams, Link } from 'react-router-dom';
const axios = require('axios');

export const Harberger = ({ banned }) => {
  const [harberger, setHarberger] = useState([]);
  const [message, setMessage] = useState();
  const [input, setInput] = useState(false);
  const app = useTezosContext();
  const params = useParams();
  
  useEffect(() => {
    const getHarberger = async () => {
      let fees = await axios.get(`https://api.jakartanet.tzkt.io/v1/bigmaps/123703/keys/${params.id}`)
      let data = await axios.get(`https://api.jakartanet.tzkt.io/v1/tokens/balances?token.contract=${process.env.REACT_APP_HARBERGER}&token.tokenId=${params.id}`)
      setHarberger({...data.data[0].token.metadata, ...data.data[0].account, ...fees.data.value});
    };
    getHarberger();
  }, [axios]);

  if (harberger.length === 0)
    return (
      <div>
        loading. . .<p />
      </div>
    );
  if (harberger[0] === 'nada')
    return (
      <div>
        nada. . .<p />
      </div>
    );

  const handleCollect = () => async() => {
    !app.address && setMessage('please sync. . .')
    if(app.address) try {
        setMessage('ready wallet. . .');
        const isCollected = await app.costCollect({
            contract: process.env.REACT_APP_HARBERGER_FEES, 
            price: harberger.price,
            token_id: parseFloat(params.id),
            deposit: parseFloat(harberger.price * harberger.fee/1000),
            platform:'HARBERGER'})
        setMessage(isCollected ? 'congratulations - you got it!' : 'transaction denied. . .');

    } catch(e) {
        setMessage('errors. . .');
        console.log('Error: ', e);
    }
    setTimeout(() => {
        setMessage(null);
    }, 3200);
  };
  
  const handleSetPrice = async(e) => {
       e.preventDefault()
       if(isNaN(e.target[0].value) ) return
      await app.setPrice(params.id, (e.target[0].value * (10**6)))
      setInput(false) 
  }
  return (
    <>
      {harberger.formats[0].mimeType.includes('image') &&
      harberger.formats[0].mimeType !== 'image/svg+xml' ? (
        <img
          alt=''
          className='view'
          src={`https://ipfs.io/ipfs/${
            harberger.displayUri
              ? harberger.displayUri?.slice(7)
              : harberger.artifactUri.slice(7)
          }`}
        />
      ) : harberger.formats[0].mimeType.includes('video') ? (
        <div className='view video '>
          <ReactPlayer
            url={
              'https://ipfs.io/ipfs/' + harberger.artifactUri.slice(7)
            }
            width='100%'
            height='100%'
            muted={true}
            playing={true}
            loop={true}
          />
        </div>
      ) : (
        ''
      )}

      <div style={{ borderBottom: '6px dotted', width: '63%', margin: '33px' }} />
        {harberger.name}
      <div style={{ borderBottom: '6px dotted', width: '63%', margin: '33px' }} />
        {harberger.description}
      <div style={{ borderBottom: '6px dotted', width: '63%', margin: '33px' }} />
      <Link to={`/${harberger.creators[0]}`}>
        created by:{' '}
        {harberger.creators[0].substr(0, 4) + '...' + harberger.creators[0].substr(-4)}
      </Link>
      <p>[-]</p>
      <div>
          <div style={{ cursor: 'pointer' }} onClick={handleCollect()}>
            {`collect for ${harberger.price / 1000000}ꜩ`}
      <div>+</div>
      <div>  first monthly fee: {harberger.fee/10}%</div>
      </div>
      </div>
      {/* <div style={{ cursor: 'pointer' }} onClick={()=>app.deposit(harberger.price * harberger.fee/1000)}>[deposit]</div> */}
       <p>[-]</p> 
        <div>HARBERGER</div>
    
        {(harberger.creators[0] !== harberger.address) && <p>curated by: {harberger.address.substr(0, 4) + '...' +  harberger.address.substr(-4)}</p>}
       
        <div style={{ borderBottom: '6px dotted', width: '63%', margin: '33px' }} />
       <div>{harberger.tags.map((p) => `#${p} `)}</div>
       {app.address && <>
       <div style={{ borderBottom: '6px dotted', width: '63%', margin: '33px' }}/>
          <div style={{width: '63%', flexDirection: 'row', justifyContent: !input ? 'space-around' : 'center'}}>
            {!input ?
            <>
            <button onClick={() => app.applyFees(params.id)}>apply fees</button>
            {app.address === harberger.address && <button onClick={() => {setInput(true)}}>set price</button>}
            {/* {app.address === harberger.address && app.address !== harberger.creators[0]
               && <button onClick={() => app.approve(harberger)}>{harberger.approve ? 'approve' : 'cancel'}</button>} */}
            {app.address === harberger.address && app.address !== harberger.creators[0] 
             && <button onClick={() => app.deposit(parseFloat(harberger.price * harberger.fee/1000))}>deposit</button>}
            </>
            : 
            <>
            <form onSubmit={(e) => handleSetPrice(e)}>
            <input type='text' placeholder='new price ꜩ' />
            <input type="submit" value="Submit"/>
            <button onClick={() => setInput(false)}>x</button> 
            </form>
            </>
          }
          </div>
      </>
}

      <div style={{ borderBottom: '6px dotted', width: '63%', marginTop: '27px' }} />
      <div style={{ borderBottom: '6px dotted', width: '63%', marginBottom: '33px'}} />
    </>
  );
};
