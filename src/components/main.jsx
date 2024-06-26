import React, { useState } from 'react'
import { request, gql } from 'graphql-request'
import useSWR, { useSWRConfig } from 'swr';
import {  Link } from "react-router-dom";
import ReactPlayer from 'react-player'
import Masonry from 'react-masonry-css'


const breakpointColumns = {
  default: 4,
  1500: 4,
  1200: 3,
  900: 2,
  600: 1
};
// export const getCount = gql`
//   query total{
//     tokens_aggregate(where: {editions: {_eq: "1"}, price: {_is_null: false}, mime_type: {_is_null: false}}) {
//     aggregate {
//       count
//     }
//   }
// }
// `
export const getObjkts = gql`
  query objkts ($offset: Int!, $offsetNew: Int!) {
    random: tokens(where: {editions: {_eq: "1"}, price: {_is_null: false}, mime_type: {_is_null: false}, fa2_address: {_neq: "KT1EpGgjQs73QfFJs9z7m1Mxm5MTnpC2tqse"}}, offset: $offset, limit: 21) {
      mime_type
      artifact_uri
      display_uri
      fa2_address
      token_id
      description
      artist_address
      thumbnail_uri
    }

    recent: tokens(where: {editions: {_eq: "1"}, price: {_is_null: false}, mime_type: {_is_null: false}, fa2_address: {_neq: "KT1EpGgjQs73QfFJs9z7m1Mxm5MTnpC2tqse"}}, offset: $offsetNew, order_by: {minted_at: desc}, limit: 45) {
      mime_type
      artifact_uri
      display_uri
      fa2_address
      description
      token_id
      thumbnail_uri
    }
  }  
   ` 
    //  $offsetTag: Int!
    // tag: tokens(where: {editions: {_eq: "1"}, tags: {tag: {_eq: "teztrashone"}}, mime_type: {_is_null: false}, fa2_address: {_neq: "KT1EpGgjQs73QfFJs9z7m1Mxm5MTnpC2tqse"}}, offset: $offsetTag, order_by: {minted_at: desc}, limit: 63) {
    //   mime_type
    //   artifact_uri
    //   display_uri
    //   fa2_address
    //   description
    //   token_id
    //   thumbnail_uri
    // }  
const fetcher = (key, query, offset, offsetNew) => request(import.meta.env.VITE_TEZTOK_API, query, {offset, offsetNew})

export const Main = ({banned}) => {
  const { mutate } = useSWRConfig()
  const [pageIndex, setPageIndex] = useState(0);
  const [offset, setOffset] = useState(Math.floor(Math.floor(Math.random() * 195000)))
  const [offsetNew, setOffsetNew] = useState(1)
  // const [offsetTag, setOffsetTag] = useState(0)

  // useEffect(() => {
  //   const getTotal = async () => {
  //     const result = await request(import.meta.env.VITE_TEZTOK_API, getCount)
  //     setOffset(Math.floor(Math.floor(Math.random() * result.tokens_aggregate.aggregate.count)))
  // }
  //   getTotal();
  // }, [])
 
  const { data, error } = useSWR(offset>0 && ['/api/objkts', getObjkts, offset, offsetNew], fetcher, { refreshInterval: 5000 })

  if (error) return <div>nada. . .<p/></div>
  if (!data) return <div>loading. . .<p/></div>

  const final = data?.random.filter((i) => !banned.includes(i.artist_address))
  const recent = data?.recent
  //&&  data?.recent.filter((i) => !data.tag.filter((j) => i.artifact_uri === j.artifact_uri).length)
  return (
      <>
      {/* {data.tag.length > 0 &&
      <div>
        <p style={{marginTop:0}}>#TEZTRASHONE</p>
        <Masonry
          breakpointCols={breakpointColumns}
          className='grid'
          columnClassName='column'>
          {data && data.tag.map(p=> (
            <Link className='center' key={p.artifact_uri+p.token_id} to={`/${p.fa2_address}/${p.token_id}`}>
            {p.mime_type.includes('image') && p.mime_type !== 'image/svg+xml' ?
            <img alt='' className= 'pop' key={p.artifact_uri+p.token_id}  src={`https://dweb.link/ipfs/${p.display_uri ? p.display_uri?.slice(7) : p.artifact_uri.slice(7)}`}/> 
            : p.mime_type.includes('video') ? 
              <div className='pop video '>
                <ReactPlayer url={'https://dweb.link/ipfs/' + p.artifact_uri.slice(7)} width='100%' height='100%' muted={true} playing={true} loop={true}/>
              </div>
            : p.mime_type.includes('audio') ?  
              <div className= 'pop'>
              <img className= 'pop' alt='' src={'https://dweb.link/ipfs/' + p.display_uri.slice(7)} />
              <audio style={{width:'93%'}} src={'https://dweb.link/ipfs/' + p.artifact_uri.slice(7)} controls />
              </div>
            : p.mime_type.includes('text') ? <div className='text'>{p.description}</div> : ''}
              </Link>   
              ))} 
          </Masonry>
      
          <div>
            <div style= {{borderBottom: '6px dotted', width: '63%', marginTop:'33px'}} />
            <p>Recent Mints</p>
            <div style= {{borderBottom: '6px dotted', width: '63%'}} />
          </div>
          <p/>
        </div>}   */}
        
      <p style={{marginTop:0}}>Recent</p>

      <Masonry
        breakpointCols={breakpointColumns}
        className='grid'
         columnClassName='column'>
        {recent && recent.map(p=> (
           <Link className='center' key={p.artifact_uri+p.token_id} to={`/${p.fa2_address}/${p.token_id}`}>
           {p.mime_type.includes('image') && p.mime_type !== 'image/svg+xml' ?
           <img alt='' className= 'pop' key={p.artifact_uri+p.token_id}  src={`https://dweb.link/ipfs/${p.display_uri ? p.display_uri?.slice(7) : p.artifact_uri.slice(7)}`}/> 
           : p.mime_type.includes('video') ? 
            <div className='pop video '>
              <ReactPlayer url={'https://dweb.link/ipfs/' + p.artifact_uri.slice(7)} width='100%' height='100%' muted={true} playing={true} loop={true}/>
             </div>
           : p.mime_type.includes('audio') ?  
            <div className= 'pop'>
             <img className= 'pop' alt='' src={'https://dweb.link/ipfs/' + p.display_uri.slice(7)} />
             <audio style={{width:'93%'}} src={'https://dweb.link/ipfs/' + p.artifact_uri.slice(7)} controls />
            </div>
           : p.mime_type.includes('text') ? <div className='text'>{p.description}</div> : ''}
            </Link>   
            ))} 
      </Masonry>
      <div style= {{borderBottom: '6px dotted', width: '63%', marginTop:'33px'}} />
      <p/>
      <p style={{marginTop: '0px'}}>Random</p>
      <Masonry
        breakpointCols={breakpointColumns}
        className='grid'
        columnClassName='column'>
        {final && final.map(p=> (
         <Link className='center' key={p.artifact_uri+p.token_id} to={`/${p.fa2_address}/${p.token_id}`}>
            {p.mime_type.includes('image') && p.mime_type !== 'image/svg+xml' ?
           <img alt='' className= 'pop' key={p.artifact_uri+p.token_id}  src={`https://dweb.link/ipfs/${p.display_uri ? p.display_uri?.slice(7) : p.artifact_uri.slice(7)}`}/> 
           : p.mime_type.includes('') ? 
            <div className='pop'>
              <ReactPlayer url={'https://dweb.link/ipfs/' + p.artifact_uri.slice(7)} width='100%' height='100%' muted={true} playing={true} loop={true}/>
             </div>
          : p.mime_type.includes('audio') ?  
           <div className= 'pop'>
            <img className= 'pop' alt='' src={'https://dweb.link/ipfs/' + p.display_uri.slice(7)} />
            <audio style={{width:'93%'}} src={'https://dweb.link/ipfs/' + p.artifact_uri.slice(7)} controls />
           </div>
           : p.mime_type.includes('text') ? <div className='text'>{p.description}</div> : ''}
            </Link>   
            ))} 
        </Masonry>
        <div>
        <div style= {{borderBottom: '6px dotted', width: '188px', marginTop:'33px'}} />
        <div style={{justifyContent: 'center', margin: '12px', flexDirection: 'row'}}>
          {pageIndex >= 1 && <button onClick={() => {setPageIndex(pageIndex - 1); setOffset(offset-21); setOffsetNew(offsetNew - 45); mutate('/api/objkts')}}>Previous  &nbsp;- </button>}
          <button onClick={() => {setPageIndex(pageIndex + 1); setOffset(offset+21); setOffsetNew(offsetNew + 45); mutate('/api/objkts'); window.scrollTo({top: 0, behavior: 'smooth'})}}>Next</button>   
          <p/>
        </div>
        <div style= {{borderBottom: '6px dotted', width: '188px'}} />
        </div>
       
          <p/>
     </>
    );
  }
  
