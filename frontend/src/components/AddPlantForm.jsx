import React, { useState } from 'react';

export default function AddPlantForm({ onPlantAdded }) {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !species) {
      setError('Название и вид обязательны для заполнения');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/plants', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, species, description, imageUrl })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Не удалось добавить растение');
      }
      
      setName('');
      setSpecies('');
      setDescription('');
      setImageUrl('');
      if (onPlantAdded) onPlantAdded();
      alert('Растение успешно добавлено!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', maxWidth: '400px' }}>
      <h2>Добавить новое растение</h2>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Название</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            style={{ width: '100%', padding: '8px' }}
            placeholder="например, Мой любимый фикус"
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Вид</label>
          <input 
            type="text" 
            value={species} 
            onChange={(e) => setSpecies(e.target.value)} 
            style={{ width: '100%', padding: '8px' }}
            placeholder="например, Фикус"
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>URL фотографии (необязательно)</label>
          <input 
            type="url" 
            value={imageUrl} 
            onChange={(e) => setImageUrl(e.target.value)} 
            style={{ width: '100%', padding: '8px' }}
            placeholder="https://example.com/image.jpg"
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Описание</label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            style={{ width: '100%', padding: '8px', minHeight: '80px' }}
            placeholder="Опишите ваше растение..."
          />
        </div>
        <button type="submit" disabled={loading} style={{ padding: '10px 15px', cursor: 'pointer', width: '100%', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>
          {loading ? 'Добавление...' : 'Добавить растение'}
        </button>
      </form>
    </div>
  );
}
