// src/App.tsx
import { useState } from 'react';
import Header from './components/_Header/Header';
import './App.css';
import { AppRoutes } from './routes';


function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  return (
    <div className="app-layout">
      <Header 
        onMenuClick={toggleSidebar}
      />
      <main className="p-16">
        <AppRoutes /> {/* Render the routes here */}
      </main>
    </div>
  );
}

export default App;