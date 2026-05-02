import React, { useState, useEffect } from 'react';

export default function PlantList({ currentUser }) {
  const [plants, setPlants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPlants = async () => {
    try {
      const response = await fetch('http://localhost:3000/plants');
      if (!response.ok) {
        throw new Error('Не удалось загрузить растения');
      }
      const data = await response.json();
      setPlants(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlants();
  }, []);

  const handleExchangeRequest = async (targetPlantId) => {
    const message = prompt('Введите сообщение для владельца растения:');
    if (message === null) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Вы должны войти в систему, чтобы предложить обмен.');
        return;
      }

      const response = await fetch('http://localhost:3000/exchange-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetPlantId, message })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось отправить заявку на обмен');
      }

      alert('Заявка на обмен успешно отправлена!');
    } catch (err) {
      alert(`Ошибка: ${err.message}`);
    }
  };

  const filteredPlants = Array.isArray(plants) ? plants.filter(plant => 
    plant.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (plant.species && plant.species.toLowerCase().includes(searchQuery.toLowerCase()))
  ) : [];

  if (loading) return <div data-testid="loading-indicator">Загрузка растений...</div>;
  if (error) return <div data-testid="error-message" style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      <h2>Каталог растений</h2>
      <input 
        type="text" 
        placeholder="Поиск растений по названию или виду..." 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        data-testid="search-input"
        style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '4px', border: '1px solid #ccc' }}
      />
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {filteredPlants.map(plant => (
          <div key={plant._id} data-testid="plant-item" style={{ 
            border: '1px solid #eee', 
            borderRadius: '8px', 
            padding: '15px', 
            width: '250px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {plant.imageUrl && (
              <img 
                src={plant.imageUrl} 
                alt={plant.name} 
                style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }} 
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <h3 style={{ marginTop: 0 }}>{plant.name}</h3>
            <p><strong>Вид:</strong> {plant.species || 'Неизвестен'}</p>
            <p style={{ flexGrow: 1 }}>{plant.description}</p>
            
            {plant.owner && (
              <div style={{ marginBottom: '15px', fontSize: '0.9em', color: '#555' }}>
                Владелец: {plant.owner.username}
              </div>
            )}

            {currentUser && (!plant.owner || currentUser.id !== plant.owner._id) && (
              <button 
                onClick={() => handleExchangeRequest(plant._id)}
                style={{ padding: '8px 12px', cursor: 'pointer', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', width: '100%', marginTop: 'auto' }}
              >
                Предложить обмен
              </button>
            )}
          </div>
        ))}
      </div>
      {filteredPlants.length === 0 && <p>Растения не найдены.</p>}
    </div>
  );
}
