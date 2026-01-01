import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LaunchPage from './pages/launch_page';
import GuestPage from './pages/guest_page';
import ChatRoom from './pages/ChatRoom';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path='/' element={ <LaunchPage /> } />
        <Route path='guest' element={ <GuestPage /> } />
        <Route path='room/:id' element={ <ChatRoom /> } />
      </Routes>
    </Router>
  </StrictMode>
)