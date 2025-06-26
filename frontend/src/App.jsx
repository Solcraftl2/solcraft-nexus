import React, { useState } from 'react';
import WelcomePage from './components/WelcomePage';

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
    console.log('Login successful:', userData);
  };

  return (
    <div className="App">
      <WelcomePage onLogin={handleLogin} />
    </div>
  );
}

export default App;

