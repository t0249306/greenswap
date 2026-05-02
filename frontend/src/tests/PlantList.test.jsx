import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PlantList from '../components/PlantList';
import React from 'react';

global.fetch = vi.fn();
global.prompt = vi.fn();
global.alert = vi.fn();

const mockPlants = [
  { _id: '1', name: 'Monstera', species: 'Deliciosa', description: 'Green', owner: { _id: 'u1', username: 'user1' } },
  { _id: '2', name: 'Cactus', species: 'Desert', description: 'Spiky', owner: { _id: 'u2', username: 'user2' } }
];

describe('PlantList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders loading state initially', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlants,
    });
    render(<PlantList />);
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());
  });

  it('renders plants after loading', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlants,
    });
    render(<PlantList />);
    await waitFor(() => {
      expect(screen.getByText('Monstera')).toBeInTheDocument();
      expect(screen.getByText('Cactus')).toBeInTheDocument();
    });
  });

  it('filters plants based on search query', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlants,
    });
    render(<PlantList />);
    await waitFor(() => expect(screen.getByText('Monstera')).toBeInTheDocument());
    
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'cactus' } });
    
    expect(screen.queryByText('Monstera')).not.toBeInTheDocument();
    expect(screen.getByText('Cactus')).toBeInTheDocument();
  });

  it('shows error message if fetch fails', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
    });
    render(<PlantList />);
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
  });

  it('handles exchange request when user is logged in', async () => {
    const currentUser = { id: 'u3', username: 'user3' };
    localStorage.setItem('token', 'fake-token');
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => mockPlants }); // Initial fetch
    global.prompt.mockReturnValueOnce('Can we swap?');
    global.fetch.mockResolvedValueOnce({ ok: true }); // Exchange request fetch

    render(<PlantList currentUser={currentUser} />);
    await waitFor(() => expect(screen.getByText('Monstera')).toBeInTheDocument());
    
    const exchangeButtons = screen.getAllByText('Предложить обмен');
    fireEvent.click(exchangeButtons[0]);
    
    expect(global.prompt).toHaveBeenCalled();
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/exchange-request', expect.any(Object));
      expect(global.alert).toHaveBeenCalledWith('Заявка на обмен успешно отправлена!');
    });
  });

  it('shows alert if trying to exchange without token', async () => {
    const currentUser = { id: 'u3', username: 'user3' };
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => mockPlants });
    global.prompt.mockReturnValueOnce('Hello');

    render(<PlantList currentUser={currentUser} />);
    await waitFor(() => expect(screen.getByText('Monstera')).toBeInTheDocument());
    
    fireEvent.click(screen.getAllByText('Предложить обмен')[0]);
    
    expect(global.alert).toHaveBeenCalledWith('Вы должны войти в систему, чтобы предложить обмен.');
  });
});
