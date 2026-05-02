import React, { useState, useEffect } from 'react';

export default function UserProfile({ user }) {
  const [myPlants, setMyPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyPlants = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Нет токена авторизации');
        }

        const response = await fetch('http://localhost:3000/plants/my', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Не удалось загрузить ваши растения');
        }

        const data = await response.json();
        setMyPlants(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMyPlants();
    }
  }, [user]);

  if (!user) return <div>Пожалуйста, войдите в систему.</div>;

  return (
    <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
      <h2>Профиль пользователя: {user.username}</h2>
      <p style={{ fontSize: '1.2em' }}>
        <strong>Рейтинг: </strong> 
        <span style={{ color: '#f39c12' }}>
          {user.rating > 0 ? `${user.rating.toFixed(1)} / 5 ★` : 'Нет оценок'}
        </span>
      </p>

      <h3 style={{ marginTop: '30px' }}>Мои активные объявления</h3>
      
      {loading && <div>Загрузка ваших растений...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      {!loading && !error && myPlants.length === 0 && (
        <p>У вас пока нет активных объявлений.</p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '15px' }}>
        {myPlants.map(plant => (
          <div key={plant._id} style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            padding: '15px', 
            width: '200px',
            background: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            {plant.imageUrl && (
              <img 
                src={plant.imageUrl} 
                alt={plant.name} 
                style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }} 
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <h4 style={{ margin: '0 0 5px 0' }}>{plant.name}</h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.9em', color: '#666' }}>{plant.species}</p>
            <p style={{ fontSize: '0.85em', color: '#444' }}>{plant.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
