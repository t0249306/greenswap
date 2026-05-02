import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import React from 'react';

global.fetch = vi.fn();

const mockPlants = [
  { _id: '1', name: 'Monstera', species: 'Deliciosa', owner: { _id: 'u1', username: 'user1' } }
];

describe('App Component Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders auth when not logged in', () => {
    render(<App />);
    expect(screen.getByText('Вы не авторизованы')).toBeInTheDocument();
    expect(screen.getByText('Вход')).toBeInTheDocument();
  });

  it('logs in and shows catalog', async () => {
    // 1. Mock login success
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: 'u2', username: 'me' }, token: 't1' }),
    });
    // 2. Mock plant list fetch after login
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlants,
    });

    render(<App />);
    
    // Fill auth form
    fireEvent.change(screen.getByTestId('username-input'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByTestId('submit-button'));

    // Wait for login to complete and UI to update
    await waitFor(() => {
      expect(screen.getByText(/Профиль \(me\)/)).toBeInTheDocument();
    });
    
    // Check if PlantList is rendered
    await waitFor(() => {
      expect(screen.getByText('Каталог растений')).toBeInTheDocument();
    });
  });

  it('restores user from localStorage', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'u2', username: 'me' }));
    localStorage.setItem('token', 't1');
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlants,
    });

    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/Профиль \(me\)/)).toBeInTheDocument();
    });
  });

  it('logs out successfully', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'u2', username: 'me' }));
    localStorage.setItem('token', 't1');
    global.fetch.mockResolvedValue({ ok: true, json: async () => [] });

    render(<App />);
    await waitFor(() => expect(screen.getByText('Выйти')).toBeInTheDocument());
    
    fireEvent.click(screen.getByText('Выйти'));
    
    expect(screen.getByText('Вы не авторизованы')).toBeInTheDocument();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('switches tabs', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'u2', username: 'me' }));
    localStorage.setItem('token', 't1');
    global.fetch.mockResolvedValue({ 
      ok: true, 
      json: async () => ({ incoming: [], outgoing: [] }) 
    });

    render(<App />);
    await waitFor(() => expect(screen.getByText('Добавить растение')).toBeInTheDocument());
    
    fireEvent.click(screen.getByText('Добавить растение'));
    expect(await screen.findByText('Добавить новое растение')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Заявки'));
    expect(await screen.findByText('Заявки на обмен')).toBeInTheDocument();
  });
});
