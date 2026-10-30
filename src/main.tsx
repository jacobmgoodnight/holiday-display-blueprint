import React from 'react';import {createRoot} from 'react-dom/client';import App from './App';
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
// Cache only the public app shell. Actual projects remain in browser IndexedDB and encrypted sync.
if('serviceWorker' in navigator)window.addEventListener('load',()=>{void navigator.serviceWorker.register(import.meta.env.BASE_URL+'sw.js').catch(()=>{/* browser may deny offline caching */});});
