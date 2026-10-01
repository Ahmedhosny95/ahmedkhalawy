import * as React from 'react';
import {syncSearchMetadata} from './metadata-runtime.js';
export function S({title,description}:{title:string;description?:string}){React.useEffect(()=>{syncSearchMetadata(window.location.pathname);},[title,description]);return null;}
