import React, { useState } from 'react';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import * as yup from 'yup';
import styles from '../styles/minter.module.css';
import { useTezosContext } from "../context/tezos-context";
import Dropzone from 'react-dropzone'
import App from '../App';

const MAX_EDITIONS = 10000;
const MIN_ROYALTIES = 10;
const MAX_ROYALTIES = 25;
const MAX_AUDIO_SIZE_BYTES = 1_000_000_00;
const MAX_COVER_SIZE_BYTES = 1_000_000_0;
const MAX_THUMB_SIZE_BYTES = 1_000_000;
const ALLOWED_AUDIO_TYPES = [
    'audio/wav',
    'audio/ogg',
    'audio/mpeg',
    "audio/x-wav"
];
const ALLOWED_IMAGE_TYPES = [
    'image/png',
    'image/jpeg',
    'image/gif'
];
const mintPayload=''
const validationSchema = yup.object().shape({
    title: yup.string().required(),
    description: yup.string().required(),
    tags: yup.string().required(),
    royalties: yup.number()
        .min(MIN_ROYALTIES)
        .max(MAX_ROYALTIES),
    license: yup.string(),
    licenseUrl: yup.string(),
});

const bytesToMb = bytes => bytes / 1_000_000;



const licenses = {
    NO: {
        title: 'No license / All rights reserved'
    },
    CCBY: {
        title: 'Attribution 4.0 International',
        url: "https://creativecommons.org/licenses/by/4.0/"
    },
    CCBYND: {
        title: 'Attribution-NoDerivatives 4.0 International',
        url: "http://creativecommons.org/licenses/by-nd/4.0/"
    },
    CCBYSA: {
        title: 'Attribution-ShareAlike 4.0 International',
        url: "https://creativecommons.org/licenses/by-sa/4.0/"
    },
    CCBYNC: {
        title: 'Attribution-NonCommercial 4.0 International',
        url: "https://creativecommons.org/licenses/by-nc/4.0/"
    },
    CCBYNCND: {
        title: 'Attribution-NonCommercial-NoDerivatives 4.0 International',
        url: "https://creativecommons.org/licenses/by-nc-nd/4.0/"
    },
    CCBYNCSA: {
        title: 'Attribution-NonCommercial-ShareAlike 4.0 International',
        url: "https://creativecommons.org/licenses/by-nc-sa/4.0/"
    },
    CC0: {
        title: 'Public Domain Dedication',
        url: "https://creativecommons.org/publicdomain/zero/1.0/"
    },
}

export const Mint = () => {
    const [mintPayload, setMintPayload] = useState();
    const [isMinting, setIsMinting] = useState(false);
    const [isForm, setIsForm] = useState(true);
    const [file, setFile] = useState(null);
    const [isPreview, setIsPreview] = useState(false)
    const [preview, setPreview] = useState(null)
    const [loaded, setLoaded] = useState(false)
    const app = useTezosContext();

    const handleDrop = (file) => {
      setFile(file[0])
      setPreview(URL.createObjectURL(file[0]))
      setLoaded(true)
    }

    const initialValues = {
        title: mintPayload?.title || '',
        description: mintPayload?.description || '',
        tags: mintPayload?.tags || '',
        royalties: mintPayload?.royalties || '',
        audio: mintPayload?.audio || '',
        cover: mintPayload?.cover || '',
        thumbnail: mintPayload?.thumbnail || '',
        license: mintPayload?.license || '',
        licenseUrl: mintPayload?.licenseUrl || '',
    };
    const handleSubmit = (values) => {
        setIsMinting(false)
        setMintPayload(values);
        setIsPreview(true)
        setIsForm(false);
        console.log(values)
    };
    const triggerMint = () => {
        setIsMinting(true)
        // handleMint(mintPayload);
    };
    
    const handleDropdownChange = (formik) => (event) => {
        let key = event.target.value;
        formik.setFieldValue('license', licenses[key].title);
        formik.setFieldValue('licenseUrl', licenses[key].url);
    };

    
    if(!app.address) return(<p>please sync to mint</p>, <p/>)
console.log(isPreview)
    return (
        <div >
            <Dropzone maxFiles={1} onDrop={file => handleDrop(file)}>
                {({getRootProps, getInputProps}) => (
                 
                    <div {...getRootProps()}>
                 
                        { !loaded ? (<input {...getInputProps()} />,
                        <div className='view'> 
                        <p>Drag 'n' drop file here - or click to select</p>
                        <p>[jpeg, png, gif, mp4, mp3, wav]</p></div>) 
                        : file.type.includes('image') ? <img className='view' src={preview} />
                        : file.type.includes('video') ? <video className='view' src={preview}  controls autoplay/>
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
                    <Form className={styles.form} >
                        <div className={styles.formField}>
                            <label
                                className={styles.label}
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
                                className={styles.errorMessage}
                                name="title"
                            />
                        </div>
                        <div className={styles.formField}>
                            <label
                                className={styles.label}
                                htmlFor={'description'}
                            >Description</label>
                            <Field
                                className={'fields'}
                                id="description"
                                name="description"
                                component="textarea"
                            />
                            <ErrorMessage
                                component="span"
                                className={styles.errorMessage}
                                name="description"
                            />
                        </div>
                        <div className={styles.formField}>
                            <label
                                className={styles.label}
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
                                className={styles.errorMessage}
                                name="tags"
                            />
                        </div>
                       
                        <div className={styles.formField}>
                            <label
                                className={styles.label}
                                htmlFor={'royalties'}
                            >Royalties</label>
                            <Field
                                className='fields'
                                id="royalties"
                                name="royalties"
                                type="number"
                                min={MIN_ROYALTIES}
                                max={MAX_ROYALTIES}
                                placeholder={`royalties after each sale (between ${MIN_ROYALTIES}-${MAX_ROYALTIES}%)`}
                            />
                            <ErrorMessage
                                component="span"
                                className={styles.errorMessage}
                                name="royalties"
                            />
                        </div>
                        <div className={styles.formField} >
                            <label
                                className={styles.label}
                                htmlFor={'license'}
                            >Select a license</label>
                            <select
                                className={styles.dropdown}
                                onChange={handleDropdownChange(formik)}
                            >
                                <option value="NO">No License / All Rights Reserved</option>
                                <option value="CCBY">CC BY</option>
                                <option value="CCBYND">CC BY-ND</option>
                                <option value="CCBYSA">CC BY-SA</option>
                                <option value="CCBYNC">CC BY-NC</option>
                                <option value="CCBYNCND">CC BY-NC-ND</option>
                                <option value="CCBYNCSA">CC BY-NC-SA</option>
                                <option value="CC0">CCO (Public Domain)</option>
                            </select>
                            <div>
                                {formik.values.licenseUrl && <a href={formik.values.licenseUrl} target="_blank" rel="noopener noreferrer"><u>{formik.values.license}</u></a>}
                            </div>
                            <ErrorMessage
                                component="span"
                                className={styles.errorMessage}
                                name="license"
                            />
                        </div>
                        <p/>
                        <div>
                        <button
                            // className={styles.formButton}
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
           <p>created by: {`${app.alias || app.address.substr(0, 4) + ". . ." + app.address.substr(-4)}`}</p>
            <o>Royalties: {mintPayload.royalties}%</o>
            <p>[-]</p>
            <p>S1NGULARE</p>
          
            <div style= {{borderBottom: '6px dotted', width: '63%', marginTop:'27px'}} />
        <div style= {{borderBottom: '6px dotted', width: '63%', marginBottom: '33px'}} />
        <button>[ ::  Mint  :: ]<p/></button> <button style={{fontSize: '27px'}} onClick={() => setIsPreview(false)}>{`<`}<p/></button>
        </div>}
        </div>
    );
};

