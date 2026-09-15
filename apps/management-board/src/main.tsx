import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import '@fontsource/noto-sans-jp/400.css';
import '@fontsource/noto-sans-jp/500.css';
import '@fontsource/zen-kaku-gothic-new/700.css';
import { App } from './App.tsx';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw Error('Application root is missing');
ReactDOM.createRoot(root).render(<React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>);
