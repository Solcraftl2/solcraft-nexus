import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            SolCraft Nexus
          </h1>
          <p className="mt-2 text-gray-600">
            Piattaforma di Tokenizzazione Professionale
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Funzionamento</h2>
          <p className="text-gray-600 mb-4">
            Se vedi questo messaggio, React funziona correttamente.
          </p>
          <button 
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            onClick={() => alert('Funziona!')}
          >
            Test Button
          </button>
        </div>
      </div>
    </div>
  )
}

export default App

