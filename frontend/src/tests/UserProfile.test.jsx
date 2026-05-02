import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import UserProfile from '../components/UserProfile';
import React from 'react';

global.fetch = vi.fn();

const mockUser = { id: 'u1', username: 'testuser', rating: 4.5 };
const mockMyPlants = [
  { _id: 'p1', name: 'My Ficus', species: 'Ficus', description: 'Healthy' }
];

describe('UserProfile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders loading state initially', async () => {
    localStorage.setItem('token', 'fake-token');
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMyPlants,
    });
    render(<UserProfile user={mockUser} />);
    expect(screen.getByText('Загрузка ваших растений...')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Загрузка ваших растений...')).not.toBeInTheDocument());
  });

  it('renders user details and plants', async () => {
    localStorage.setItem('token', 'fake-token');
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMyPlants,
    });
    render(<UserProfile user={mockUser} />);
    
    expect(screen.getByText('Профиль пользователя: testuser')).toBeInTheDocument();
    expect(screen.getByText('4.5 / 5 ★')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('My Ficus')).toBeInTheDocument();
    });
  });

  it('shows error if no token', async () => {
    render(<UserProfile user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText('Нет токена авторизации')).toBeInTheDocument();
    });
  });

  it('shows error if fetch fails', async () => {
    localStorage.setItem('token', 'fake-token');
    global.fetch.mockResolvedValueOnce({ ok: false });
    render(<UserProfile user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText('Не удалось загрузить ваши растения')).toBeInTheDocument();
    });
  });

  it('shows empty message if no plants', async () => {
    localStorage.setItem('token', 'fake-token');
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });
    render(<UserProfile user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText('У вас пока нет активных объявлений.')).toBeInTheDocument();
    });
  });

  it('renders "please log in" if no user prop', () => {
    render(<UserProfile user={null} />);
    expect(screen.getByText('Пожалуйста, войдите в систему.')).toBeInTheDocument();
  });
});
