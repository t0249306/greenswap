import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import Requests from '../components/Requests';
import React from 'react';

global.fetch = vi.fn();
global.alert = vi.fn();

const mockData = {
  incoming: [
    {
      _id: 'req1',
      status: 'pending',
      requester: { username: 'requester1' },
      targetPlant: { name: 'My Ficus' },
      message: 'Can I have it?'
    },
    {
      _id: 'req2',
      status: 'accepted',
      requester: { username: 'requester2' },
      targetPlant: { name: 'My Monstera' },
      message: 'Hello'
    }
  ],
  outgoing: [
    {
      _id: 'req3',
      status: 'pending',
      targetPlant: { name: 'Their Cactus', owner: { username: 'owner1' } }
    }
  ]
};

const mockMessages = [
  { _id: 'm1', text: 'Hi', sender: { _id: 'u1', username: 'requester1' } },
  { _id: 'm2', text: 'Hello', sender: { _id: 'u2', username: 'me' } }
];

describe('Requests Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'fake-token');
  });

  afterEach(() => {
    cleanup();
  });

  it('renders requests after loading', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    render(<Requests currentUser={{ id: 'u2' }} />);
    
    expect(screen.getByText('Загрузка заявок...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('My Ficus')).toBeInTheDocument();
      expect(screen.getByText('Their Cactus')).toBeInTheDocument();
    });
  });

  it('handles accepting a request', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => mockData }); // Initial fetch
    global.fetch.mockResolvedValueOnce({ ok: true }); // PUT status
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => mockData }); // Refetch

    render(<Requests currentUser={{ id: 'u2' }} />);
    await waitFor(() => expect(screen.getByText('Принять')).toBeInTheDocument());
    
    fireEvent.click(screen.getByText('Принять'));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/exchange-requests/req1/status'),
        expect.objectContaining({ method: 'PUT', body: JSON.stringify({ status: 'accepted' }) })
      );
    });
  });

  it('opens and interacts with chat', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => mockData }); // Initial fetch
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => mockMessages }); // GET messages
    global.fetch.mockResolvedValueOnce({ ok: true }); // POST message
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => [...mockMessages, { _id: 'm3', text: 'New', sender: { _id: 'u2' } }] }); // Refetch messages

    render(<Requests currentUser={{ id: 'u2' }} />);
    await waitFor(() => expect(screen.getByText('Открыть чат')).toBeInTheDocument());
    
    fireEvent.click(screen.getByText('Открыть чат'));
    
    await waitFor(() => {
      expect(screen.getByText('Чат по обмену')).toBeInTheDocument();
      expect(screen.getByText('Hi')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Сообщение...');
    fireEvent.change(input, { target: { value: 'New message' } });
    fireEvent.click(screen.getByText('Отправить'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/exchange-requests/req2/messages'),
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ text: 'New message' }) })
      );
    });
  });
});
