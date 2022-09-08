import React, { useState, useEffect } from 'react';
import { useTezosContext } from '../context/tezos-context';
import { request, gql } from 'graphql-request';
import ReactPlayer from 'react-player';
import { useParams, Link } from 'react-router-dom';
const axios = require('axios');

export const Harberger = ({ banned }) => {
  const [harberger, setHarberger] = useState([]);
  const [message, setMessage] = useState();
  const app = useTezosContext();
  const params = useParams();
  console.log('hi');
  useEffect(() => {
    const getHarberger = async () => {
      let result = await axios.get(
        `https://api.jakartanet.tzkt.io/v1/tokens?contract=${process.env.REACT_APP_HARBERGER}&tokenId=${params.id}`
      );
      setHarberger(result.data[0]);
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

  // const handleCollect = () => async() => {
  //   !app.address && setMessage('please sync. . .')
  //   if(app.address) try {
  //       setMessage('ready wallet. . .');
  //       const isCollected = await app.collect({swap_id: harberger.listings[0].swap_id || harberger.listings[0].ask_id, price: harberger.price,
  //          contract: harberger.listings[0].contract_address, platform: harberger.listings[0].type.includes('harberger') ? 'harberger' : harberger.platform});
  //       setMessage(isCollected ? 'congratulations - you got it!' : 'transaction denied. . .');

  //   } catch(e) {
  //       setMessage('errors. . .');
  //       console.log('Error: ', e);
  //   }
  //   setTimeout(() => {
  //       setMessage(null);
  //   }, 3200);
  // };
  console.log(harberger);
  return (
    <>
      {harberger.metadata.formats[0].mimeType.includes('image') &&
      harberger.metadata.formats[0].mimeType !== 'image/svg+xml' ? (
        <img
          alt=''
          className='view'
          src={`https://ipfs.io/ipfs/${
            harberger.metadata.displayUri
              ? harberger.metadata.displayUri?.slice(7)
              : harberger.metadata.artifactUri.slice(7)
          }`}
        />
      ) : harberger.metadata.formats[0].mimeType.includes('video') ? (
        <div className='view video '>
          <ReactPlayer
            url={
              'https://ipfs.io/ipfs/' + harberger.metadata.artifactUri.slice(7)
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
      <div
        style={{ borderBottom: '6px dotted', width: '63%', margin: '33px' }}
      />

      {harberger.metadata.name}
      <div
        style={{ borderBottom: '6px dotted', width: '63%', margin: '33px' }}
      />

      {harberger.metadata.description}
      <div
        style={{ borderBottom: '6px dotted', width: '63%', margin: '33px' }}
      />
      <div>{harberger.metadata.tags.map((p) => `#${p} `)}</div>
      <div
        style={{ borderBottom: '6px dotted', width: '63%', margin: '33px' }}
      />
      <Link
        to={`/${harberger.minter_profile?.alias || harberger.artist_address}`}
      >
        created by:{' '}
        {harberger.metadata.creators[0].substr(0, 4) +
          '...' +
          harberger.metadata.creators[0].substr(-4)}
        <p />
      </Link>
      <p>[-]</p>
      <div>
        {harberger.price > 0 ? (
          <div style={{ cursor: 'pointer' }}>
            {`collect for ${harberger.price / 1000000}ꜩ`}
            <a className='center'>-</a>
          </div>
        ) : (
          ''
        )}
      </div>
      {message}
      <div
        style={{ borderBottom: '6px dotted', width: '63%', marginTop: '27px' }}
      />
      <div
        style={{
          borderBottom: '6px dotted',
          width: '63%',
          marginBottom: '33px',
        }}
      />
    </>
  );
};
