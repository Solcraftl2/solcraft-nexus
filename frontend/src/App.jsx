import React from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  return (
    <Layout currentPage="dashboard">
      <Dashboard />
    </Layout>
  );
}

export default App;

