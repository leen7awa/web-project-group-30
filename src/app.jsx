import React from 'react';
import Header from './Header';
import Body from './Body';
import Footer from './Footer';
import './index.css';
import { Router } from 'preact-router';
import Login from './Login';
import EventPage from './EventPage';
import Registration from './Registration';
import Recovery from './PasswordRecovery'

export function App() {
  return (
    <>
      <div id="app">
        <Header />
        <Router>
          <Body path="/" />
          <Login path="login" />
          <Registration path="register" />
          <Recovery path="password_recovery" />
          <EventPage path="event-page" />
        </Router>
        <Footer />
      </div>
    </>
  );
}
