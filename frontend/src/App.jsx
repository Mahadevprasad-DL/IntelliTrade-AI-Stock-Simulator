import React, { useState } from 'react';
import Home from './Home.jsx';
import Register from './Register.jsx';
import Login from './Login.jsx';
import MainHome from './MainHome.jsx';

function App() {

  const [page, setPage] = useState('home');
  const [user, setUser] = useState(null); // { username, email }

  const handleRegister = () => setPage('register');
  const handleLogin = () => setPage('login');
  const handleHome = () => setPage('home');

  const handleMainHome = (userInfo) => {
    setUser(userInfo);
    setPage('mainhome');
  };

  const handleLogout = () => {
    setUser(null);
    setPage('home');
  };

  let content;

  if (page === 'register') {
    content = <Register onSignIn={handleLogin} />;
  } 
  else if (page === 'login') {
    content = (
      <Login
        onRegister={handleRegister}
        onLoginSuccess={handleMainHome}
      />
    );
  } 
  else if (page === 'mainhome') {
    content = (
      <MainHome
        user={user}
        onLogout={handleLogout}
      />
    );
  } 
  else {
    content = (
      <Home
        onRegister={handleRegister}
        onLogin={handleLogin}
      />
    );
  }

  return content;
}

export default App;