import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import PlantList from './components/PlantList';
import AddPlantForm from './components/AddPlantForm';
import UserProfile from './components/UserProfile';
import Requests from './components/Requests';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog', 'add', 'profile', 'requests'

  // Проверка localStorage при загрузке приложения
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleAuthSuccess = (data) => {
    setUser(data.user);
    // Сохраняем токен и данные пользователя
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setActiveTab('catalog');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setActiveTab('catalog');
  };

  const navButtonStyle = (tabName) => ({
    padding: '10px 15px',
    cursor: 'pointer',
    background: activeTab === tabName ? '#007bff' : 'transparent',
    color: activeTab === tabName ? 'white' : '#333',
    border: '1px solid #007bff',
    borderRadius: '4px',
    fontWeight: 'bold'
  });

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <nav data-testid="navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid #ccc', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, color: '#2c7a2c' }}>GreenSwap</h1>
        
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setActiveTab('catalog')} style={navButtonStyle('catalog')}>Каталог</button>
              <button onClick={() => setActiveTab('add')} style={navButtonStyle('add')}>Добавить растение</button>
              <button onClick={() => setActiveTab('requests')} style={navButtonStyle('requests')}>Заявки</button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '1px solid #ccc', paddingLeft: '20px' }}>
              <button onClick={() => setActiveTab('profile')} style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: activeTab === 'profile' ? 'underline' : 'none', fontWeight: activeTab === 'profile' ? 'bold' : 'normal' }}>
                Профиль ({user.username})
              </button>
              <button onClick={handleLogout} style={{ padding: '5px 10px', cursor: 'pointer', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>Выйти</button>
            </div>
          </div>
        ) : (
          <div>Вы не авторизованы</div>
        )}
      </nav>
      
      <main>
        {!user ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
            <div style={{ minWidth: '300px', width: '100%', maxWidth: '400px' }}>
              <Auth onSuccess={handleAuthSuccess} />
            </div>
          </div>
        ) : (
          <div>
            {activeTab === 'catalog' && <PlantList currentUser={user} />}
            {activeTab === 'add' && <AddPlantForm onPlantAdded={() => setActiveTab('catalog')} />}
            {activeTab === 'profile' && <UserProfile user={user} />}
            {activeTab === 'requests' && <Requests currentUser={user} />}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
