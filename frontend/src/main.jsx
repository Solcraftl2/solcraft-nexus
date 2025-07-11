import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppFixed from './AppFixed.jsx'

console.log('🚀 Main.jsx loading with AppFixed...');

const rootElement = document.getElementById('root');
console.log('📍 Root element:', rootElement);

if (rootElement) {
  const root = createRoot(rootElement);
  console.log('✅ Root created, rendering AppFixed...');
  
  root.render(
    <StrictMode>
      <AppFixed />
    </StrictMode>
  );
  
  console.log('🎉 AppFixed rendered!');
} else {
  console.error('❌ Root element not found!');
}

