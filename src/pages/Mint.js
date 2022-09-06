import React, { useState } from 'react';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import { useTezosContext } from '../context/tezos-context'
import { setMetadata }  from '../utils/ipfs'
import Dropzone from 'react-dropzone'
import * as yup from 'yup'
import App from '../App';

const min_fee = 1;
const min_price = 0;
const max_fee = 100;

const mintPayload=''
const validationSchema = yup.object().shape({
    title: yup.string().required(),
    description: yup.string().required(),
    tags: yup.string().required(),
    harberger: yup.number().required()
    .min(min_fee)
    .max(max_fee),
    price: yup.number().required()
    .min(min_price)
});

const bytesToMb = bytes => bytes / 1_000_000;




export const Mint = () => {
    const [mintPayload, setMintPayload] = useState();
    const [isMinting, setIsMinting] = useState(false);
    const [isForm, setIsForm] = useState(true);
    const [file, setFile] = useState(null);
    const [isPreview, setIsPreview] = useState(false)
    const [preview, setPreview] = useState(null)
    const [loaded, setLoaded] = useState(false)
    const [message, setMessage] = useState('')
    const app = useTezosContext();

    const handleDrop = (file) => {
      if (!file[0]?.type) return
      setFile(file[0])
      setPreview(URL.createObjectURL(file[0]))
      setLoaded(true)
    }

    const initialValues = {
        title: mintPayload?.title || '',
        description: mintPayload?.description || '',
        tags: mintPayload?.tags || '',
        harberger: mintPayload?.harberger || '',
        audio: mintPayload?.audio || '',
        cover: mintPayload?.cover || '',
        thumbnail: mintPayload?.thumbnail || '',
        price: mintPayload?.price || '',

    };
    const handleMint = async () => {
        setMessage('Ipfs. . .')
        console.log(file)
        await setMetadata({values: mintPayload , file: file, setMessage})
        setMessage('Minting. . .');
        // const isSuccessful = await app.mint(auth.address, p.amount, nftCid.substr(7), p.royalties);
        // setMessage(isSuccessful ? 'Completed' : 'Failed to mint');
        setTimeout(() => {
            setMessage(null);
        }, 2000)
    };





            // let isMinted = ''
            // !app.address && setMessage('please sync. . .') 
            //   if(app.address) try {
            //       setMessage('ready wallet. . .');
            //       isMinted = await app.mint(mintPayload)
            //       setMessage(isMade ? 'Congratulations - Market Made!' : 'transaction issues - try again. . .');
                
            //   } catch(e) {
            //       setMessage('errors. . .');
            //       console.log('Error: ', e);
            //   }
            //   setTimeout(() => {
            //       setMessage(null)
            //   }, 3200)
            //   setMarketPayload({fa2s,values})
            //   isMade && navigate('/')
            // }
            
           
       
    const handleSubmit = (values) => { 
        setIsMinting(false)
        values.address=app.address
        setMintPayload(values);
        setIsPreview(true)
        setIsForm(false);
        console.log(values)
    };
    const triggerMint = () => {
        setIsMinting(true)
        // handleMint(mintPayload);
    };
    
    
    if(!app.address) return(<p>please sync to mint</p>, <p/>)
console.log(isPreview)
    return (
        <div >
            <Dropzone multiple={false}  
            accept={{
                   'image/*': ['.jpeg', '.png', '.gif'], 'video/*': ['.mp4']
                 }} 
                onDrop={file => handleDrop(file)}>
                {({getRootProps, getInputProps}) => (
               
                    <div {...getRootProps()}>
                       
                        { !loaded ? (<input {...getInputProps()} />,
                        <div className='view'> 
                        <p>drag 'n' drop file here - or click to select</p>
                        <p>[jpeg, png, gif, mp4]</p></div>) 
    
                        : file.type.includes('image') ? <img className='view' src={preview} />
                        : file.type.includes('video') ? <video className='view' src={preview}  controls autoPlay/>
                        : null}
                   
                    </div>
                  
                 
                )}
            </Dropzone><p/>
           
            {loaded && !isPreview && <Formik
                onSubmit={handleSubmit}
                initialValues={initialValues}
                validationSchema={validationSchema}
            >
                {(formik) =>
                    <Form className='form' >
                        <div className='formField'>
                            <label
                                className='label'
                                htmlFor={'title'}
                            >Title</label>
                            <Field
                                className='fields'
                                id="title"
                                name="title"
                                type="text"
                            />
                            <ErrorMessage
                                component="span"
                                className='errorMessage'
                                name="title"
                            />
                        </div>
                        <div className='formField'>
                            <label
                                className='label'
                                htmlFor={'description'}
                            >Description</label>
                            <Field
                                className='fields'
                                id="description"
                                name="description"
                                component="textarea"
                            />
                            <ErrorMessage
                                component="span"
                                className='errorMessage'
                                name="description"
                            />
                        </div>
                        <div className='formField'>
                            <label
                                className='label'
                                htmlFor={'tags'}
                            >Tags</label>
                            <Field
                                className='fields'
                                id="tags"
                                name="tags"
                                type="text"
                                placeholder="tags (comma separated. example: illustration, digital)"
                            />
                            <ErrorMessage
                                component="span"
                                className='errorMessage'
                                name="tags"
                            />
                        </div>
                       
            
                     
                        <div className='formField'>
                            <label
                                className='label'
                                htmlFor={'harberger'}
                            >Harberger Fee</label>
                            <Field
                                className='fields'
                                id="harberger"
                                name="harberger"
                                type="number"
                                min={min_fee}
                                max={max_fee}
                                placeholder={`percentage of sale price as harberger fee (between ${min_fee}-${max_fee}%)`}
                            />
                            <ErrorMessage
                                component="span"
                                className='errorMessage'
                                name="harberger"
                            />
                        </div>
                        <div className='formField'>
                            <label
                                className='label'
                                htmlFor={'price'}
                            >Initial Price</label>
                            <Field
                                className='fields'
                                id="price"
                                name="price"
                                type="number"
                                min={min_price}
                                placeholder={`price for initial sale`}
                            />
                            <ErrorMessage
                                component="span"
                                className='errorMessage'
                                name="price"
                            />
                        </div>
                        <p/>
                        <div>
                        <button
                            // className='formButton'
                            type="submit"
                        >Preview
                        </button>
                        <p/>
                        </div>
                    </Form>
                    
                }
            </Formik>
           }
           {isPreview && <div>
            <div style= {{borderBottom: '6px dotted', width: '63%', marginTop:'33px'}} />
                <p>{mintPayload.title}</p>
                <div style= {{borderBottom: '6px dotted', width: '63%', marginBottom: '27px'}} />
               <p>{mintPayload.description}</p>
               <div style= {{borderBottom: '6px dotted', width: '63%', marginTop:'27px'}} />               
           <p>Created by: {`${app.alias || app.address.substr(0, 4) + ". . ." + app.address.substr(-4)}`}</p>
            <p>Harberger  Fee: {mintPayload.harberger}%</p>
            <p>Initial Price: {mintPayload.price} ꜩ</p>
            <p>[-]</p>
            <p>Harberger x S1NGULARE</p>
          
            <div style= {{borderBottom: '6px dotted', width: '63%', marginTop:'27px'}} />
        <div style= {{borderBottom: '6px dotted', width: '63%', marginBottom: '33px'}} />
        <button onClick={()=> handleMint()}>[ ::  Mint  :: ]<p/></button> <button style={{fontSize: '27px'}} onClick={() => setIsPreview(false)}>{`<`}<p/></button>
        </div>}
        </div>
    );
};

