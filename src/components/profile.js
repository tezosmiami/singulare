import React, { useState, useEffect } from 'react'
import { request, gql } from 'graphql-request'
import useSWR, { useSWRConfig } from 'swr';
import ReactPlayer from 'react-player'
import { useParams, Link } from 'react-router-dom';
import Masonry from 'react-masonry-css'


const breakpointColumns = {
  default: 5,
  1540: 4,
  1230: 3,
  920: 2,
  610: 1
};

export const getAddressbyName = gql`
query alias($param: String!) {
  tzprofiles(where: {alias: {_eq: $param}}) {
      account
      twitter
    }
  }
`

export const getAddressbySubjkt = gql`
query subjkt($param: String!) {
  hic_et_nunc_holder(where: { name: {_eq: $param}}) {
    address
  }
}
`
export const getObjkts = gql`
query walletName($param: String!) {
    created: tokens(where: {artist_address: {_eq: $param}, artifact_uri: {_is_null: false}, mime_type: {_is_null: false}, editions: {_eq: "1"}, fa2_address: {_neq: "KT1EpGgjQs73QfFJs9z7m1Mxm5MTnpC2tqse"}}, order_by: {minted_at: desc}) {
      artifact_uri
      display_uri
      artist_address
      fa2_address
      token_id
      mime_type
      description
      platform
      minter_profile {
        alias
        twitter
        logo
      }
    }
  

  curated: tokens(where: {holdings: {holder_address: {_eq: $param}, amount: {_gte: "1"}}, artifact_uri: {_is_null: false}, mime_type: {_is_null: false}, artist_address: {_neq: $param}, editions: {_eq: "1"}}, order_by: {minted_at: desc}) {
    artifact_uri
    artist_address
    display_uri
    platform
    description
    fa2_address
    token_id
    mime_type
  }
}
` 
   
const fetcher = (key, query, param) => request(process.env.REACT_APP_TEZTOK_API, query, {param})
const hicFetcher = (key, query, param) => request(process.env.REACT_APP_HICDEX_API, query, {param})


export const Profile = ({banned}) => {

//   const [pageIndex, setPageIndex] = useState(0);
  const [offset, setOffset] = useState(0)
  const { account } = useParams();
  const { data: alias, error: aliasError } = useSWR(account.length !== 36 ? ['/api/name', getAddressbyName, account] : null, fetcher)
  const { data: subjkt, error: subjktError } = useSWR(account.length !== 36 ? ['/api/subjkt', getAddressbySubjkt, account.toLowerCase().replace(/\s+/g, '')] : null, hicFetcher)
  const address = account?.length === 36 ? account : alias?.tzprofiles[0]?.account || subjkt?.hic_et_nunc_holder[0]?.address || null
  const { data, error } = useSWR(address?.length === 36 ? ['/api/profile', getObjkts, address] : null, fetcher, { refreshInterval: 15000 })

  if ((subjkt || alias) && !address) return <div>nada. . .<p/></div>
  if (error) return <p>error</p>
  if (!data ) return <div>loading. . .<p/></div>
  
  // const merge = data?.recent.concat(data.random)
  // const owned = data.alias.length > 0 ? data.alias : data.pk;
  
  const filteredcreated = data?.created.filter((i) => !banned.includes(i.artist_address))
  const filteredcurated = data?.curated.filter((i) => !banned.includes(i.artist_address))

  //   totalpixils?.length > 0 && totalpixils.sort(function (a, b) {
//     return b.opid - a.opid;
//   });
    return (
      <>
        <a style={{fontSize:'27px'}} href={alias?.tzprofiles[0]?.twitter ? `https://twitter.com/${alias.tzprofiles[0].twitter}`: null} target="blank"  rel="noopener noreferrer">
        {account?.length===36 ? address.substr(0, 4) + "..." + address.substr(-4) : account}
      </a>
      {/* <img className='avatar' src={filteredcreated ? filteredcreated[0].minter_profile?.logo : null}/> */}
      {filteredcreated.length > 0 && <p>created:</p>}
      <div className='container'>
      <Masonry
        breakpointCols={breakpointColumns}
        className={filteredcreated.length == 1 ? '' : 'grid'}
         columnClassName='column'>
        {filteredcreated && filteredcreated.map(p=> (
           <Link className='center' key={p.artifact_uri+p.token_id} to={`/${p.fa2_address}/${p.token_id}`}>
           {p.mime_type.includes('image') && p.mime_type !== 'image/svg+xml' ?
           <img alt='' className= 'pop' src={`https://ipfs.io/ipfs/${p.display_uri ? p.display_uri?.slice(7) : p.artifact_uri.slice(7)}`}/> 
           : p.mime_type.includes('video') ? 
            <div  className='pop'>
              <ReactPlayer url={'https://ipfs.io/ipfs/' + p?.artifact_uri?.slice(7)} width='100%' height='100%' muted={true} playing={true} loop={true}/>
             </div>
           : p.mime_type.includes('text') ? <div className='text'>{p.description}</div> : ''}
            </Link>
             ))}
             </Masonry>
          </div>
          <div style= {{borderBottom: '6px dotted', width: '80%', marginTop:'33px'}} />
         <div style= {{borderBottom: '6px dotted', width: '80%'}} />
       <div>
          <p></p>
       </div>
       {filteredcurated.length > 0 && <p>curated:</p>}
       <div className='container'>
       <Masonry
        breakpointCols={breakpointColumns}
        className={filteredcurated.length == 1 ? '' : 'grid'}
         columnClassName='column'>
        {filteredcurated && filteredcurated.map(p=> (
        <Link  key={p.artifact_uri+p.token_id} to={`/${p.fa2_address}/${p.token_id}`}>
        {p.mime_type.includes('image') && p.mime_type !== 'image/svg+xml' ?
        <img alt='' className= 'pop'  src={`https://ipfs.io/ipfs/${p.display_uri ? p.display_uri?.slice(7) : p.artifact_uri.slice(7)}`}/> 
        : p.mime_type.includes('video') ? 
         <div className='pop'>
           <ReactPlayer url={'https://ipfs.io/ipfs/' + p.artifact_uri.slice(7)} width='100%' height='100%' muted={true} playing={true} loop={true}/>
          </div>
        : p.mime_type.includes('text') ? <div className='text'>{p.description}</div> : ''}
         </Link>
          ))}
          </Masonry>
          </div>
       <div>
          <p></p>
       </div>
     
   

       {/* <div>
          {pageIndex >= 1 && <button onClick={() => {setPageIndex(pageIndex - 1); setOffset(offset-99); setOffsetNew(offsetNew-27); mutate('/api/objkts')}}>Previous  &nbsp;- </button>}
          <button onClick={() => {setPageIndex(pageIndex + 1); setOffset(offset+99); setOffsetNew(offsetNew+27); mutate('/api/objkts')}}>Next</button>   
       </div> */}
     </>
    );
  }
  
