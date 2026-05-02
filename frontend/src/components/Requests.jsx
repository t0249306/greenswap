import React, { useState, useEffect } from 'react';

export default function Requests({ currentUser }) {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeChat, setActiveChat] = useState(null); // ID заявки

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/exchange-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Не удалось загрузить заявки');
      const data = await response.json();
      setIncoming(data.incoming);
      setOutgoing(data.outgoing);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/exchange-requests/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Не удалось обновить статус');
      fetchRequests();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div>Загрузка заявок...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      <h2>Заявки на обмен</h2>
      
      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h3>Входящие заявки</h3>
          {incoming.length === 0 && <p>Нет входящих заявок.</p>}
          {incoming.map(req => (
            <RequestCard 
              key={req._id} 
              req={req} 
              isIncoming={true} 
              onAccept={() => handleStatusChange(req._id, 'accepted')}
              onReject={() => handleStatusChange(req._id, 'rejected')}
              onOpenChat={() => setActiveChat(req._id)}
            />
          ))}
        </div>

        <div style={{ flex: 1, minWidth: '300px' }}>
          <h3>Мои предложения (Исходящие)</h3>
          {outgoing.length === 0 && <p>Вы не отправляли заявок.</p>}
          {outgoing.map(req => (
            <RequestCard 
              key={req._id} 
              req={req} 
              isIncoming={false} 
              onOpenChat={() => setActiveChat(req._id)}
            />
          ))}
        </div>
      </div>

      {activeChat && (
        <ChatBox 
          requestId={activeChat} 
          currentUser={currentUser} 
          onClose={() => setActiveChat(null)} 
        />
      )}
    </div>
  );
}

function RequestCard({ req, isIncoming, onAccept, onReject, onOpenChat }) {
  const statusColors = {
    pending: '#f39c12',
    accepted: '#28a745',
    rejected: '#dc3545'
  };

  const statusTranslations = {
    pending: 'Ожидает',
    accepted: 'Принято',
    rejected: 'Отклонено'
  };

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px', marginBottom: '15px', background: '#fff' }}>
      <p><strong>Статус:</strong> <span style={{ color: statusColors[req.status], fontWeight: 'bold' }}>{statusTranslations[req.status]}</span></p>
      
      {isIncoming ? (
        <p><strong>{req.requester?.username}</strong> хочет получить ваше растение <strong>{req.targetPlant?.name}</strong>.</p>
      ) : (
        <p>Вы хотите получить растение <strong>{req.targetPlant?.name}</strong> (владелец: {req.targetPlant?.owner?.username || 'неизвестен'}).</p>
      )}

      {req.message && (
        <p style={{ background: '#f9f9f9', padding: '10px', fontStyle: 'italic', borderRadius: '4px' }}>
          Сообщение: "{req.message}"
        </p>
      )}

      {isIncoming && req.status === 'pending' && (
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button onClick={onAccept} style={{ background: '#28a745', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Принять</button>
          <button onClick={onReject} style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Отклонить</button>
        </div>
      )}

      {req.status === 'accepted' && (
        <button onClick={onOpenChat} style={{ marginTop: '10px', background: '#007bff', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
          Открыть чат
        </button>
      )}
    </div>
  );
}

function ChatBox({ requestId, currentUser, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/exchange-requests/${requestId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Ошибка загрузки сообщений', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Поллинг каждые 3 секунды
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [requestId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/exchange-requests/${requestId}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ text })
      });
      if (response.ok) {
        setText('');
        fetchMessages();
      }
    } catch (err) {
      console.error('Ошибка отправки', err);
    }
  };

  // Нормализуем ID текущего пользователя (в localStorage он может лежать как .id или ._id)
  const currentUserId = currentUser.id || currentUser._id;

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', width: '300px', background: '#fff', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', zIndex: 1000 }}>
      <div style={{ background: '#007bff', color: '#fff', padding: '10px', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0 }}>Чат по обмену</h4>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '20px', lineHeight: '1' }}>&times;</button>
      </div>
      
      <div style={{ height: '300px', overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#f4f6f9' }}>
        {loading ? <div>Загрузка...</div> : messages.length === 0 ? <div style={{ textAlign: 'center', color: '#999', marginTop: 'auto', marginBottom: 'auto' }}>Нет сообщений</div> : null}
        {messages.map(m => {
          const isMine = m.sender._id === currentUserId;
          return (
            <div key={m._id} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', background: isMine ? '#d1e7dd' : '#fff', border: '1px solid #ccc', padding: '8px 12px', borderRadius: '15px', maxWidth: '80%' }}>
              <div style={{ fontSize: '0.75em', color: '#666', marginBottom: '2px', textAlign: isMine ? 'right' : 'left' }}>
                {isMine ? 'Вы' : m.sender.username}
              </div>
              <div style={{ wordBreak: 'break-word' }}>{m.text}</div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', borderTop: '1px solid #ccc' }}>
        <input 
          type="text" 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          style={{ flex: 1, padding: '12px', border: 'none', outline: 'none', borderRadius: '0 0 0 8px' }}
          placeholder="Сообщение..."
        />
        <button type="submit" style={{ padding: '0 15px', background: '#007bff', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '0 0 8px 0' }}>Отправить</button>
      </form>
    </div>
  );
}
