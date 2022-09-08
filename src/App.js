import React, { useState, useEffect } from 'react'
import { useTezosContext } from "./context/tezos-context";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { Home } from './pages/Home'
import { Gallery } from './pages/Gallery'
import { Harberger } from './pages/Harberger'
import { Objkt } from './pages/Objkt'
import { Mint } from './pages/Mint'
import { LightButton } from './components/light-button';
import "./styles/styles.css";

const fonts = ['Halo', 'Advantage', 'Faster One', 'Monofett', 'Sonsie One', 'Libre Barcode 39 Text','Monoton']

function App() {
  const  app = useTezosContext();
  const axios = require('axios');
  const [banned, setBanned] = useState();
  const location = useLocation();

  useEffect(() => {
    var r = document.querySelector(':root')
    r.style.setProperty('--font', fonts[Math.floor(Math.random()* fonts.length)])
  }, [])

  useEffect(() => {
    const getBanned = async () => {
    const result = await axios.get('https://raw.githubusercontent.com/teia-community/teia-report/main/restricted.json') ;
    setBanned(result.data)
  }
    getBanned();

  }, [axios])

  return(
    <>
    <header>
      <div style={{flexDirection: 'row', justifyContent: 'space-between'}}>
    {app.address && location.pathname !== '/Mint' && <Link to='/Mint'> mint</Link>}
    <div style={{justifyContent: 'flex-end', flexDirection: 'row'}}>
    {app.address && <Link to={`/${app.name || app.address}`}>
      {/* {app.address && <a href={`https://hicetnunc.miami/tz/${app.address}`}
      target="blank" rel="noopener noreferrer"> 
       */}
        {(app.name.length > 0 && app.name + ' / ') || (app.address.substr(0, 4) + "..." + app.address.substr(-4)+' / ')}
      {/* </a>} */}
      </Link>}
      
  
      <button onClick={() => !app.activeAccount ? app.sync() : app.unsync()}> 
        {!app.activeAccount ? "sync" : "unsync"}
      </button>
      </div>
      </div>
    </header>     

    <Link className='purple' to="/">S1NGULARE</Link>
     <p>1/1 TEZOS OBJKTS</p>
    <LightButton />

     <div  style={{minHeight: '44vh'}}>
     <Routes>
        <Route path="/" element={<Home banned={banned} />} />
        <Route path='/:account' element={<Gallery banned={banned}/>} />
        <Route path='/Mint' element={<Mint/>} />
        <Route path={`/${process.env.REACT_APP_HARBERGER}`} >
          <Route path=":id" element={<Harberger banned={banned}/>} />
       </Route>
        <Route path=":contract" >
          <Route path=":id" element={<Objkt banned={banned}/>} />
       </Route>
      </Routes>
    </div>
    <div>
    <LightButton />
       <a href={`https://www.teztok.com`} target="blank"
         rel="noopener noreferrer"> indexed by teztok</a>
       <p>experimental dApp - enjoy at your own risk. . .</p>
    </div>
    </>
    )
}

export default App;
