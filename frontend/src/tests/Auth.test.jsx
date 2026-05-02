import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Auth from '../components/Auth';
import React from 'react';

// Mock fetch
global.fetch = vi.fn();

describe('Auth Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form by default', () => {
    render(<Auth />);
    expect(screen.getByText('Вход')).toBeInTheDocument();
    expect(screen.getByText('Нет аккаунта? Зарегистрироваться')).toBeInTheDocument();
  });

  it('switches between login and registration', () => {
    render(<Auth />);
    const toggleButton = screen.getByText('Нет аккаунта? Зарегистрироваться');
    
    fireEvent.click(toggleButton);
    expect(screen.getByText('Регистрация')).toBeInTheDocument();
    expect(screen.getByText('Уже есть аккаунт? Войти')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Уже есть аккаунт? Войти'));
    expect(screen.getByText('Вход')).toBeInTheDocument();
  });

  it('shows validation errors for short username/password', async () => {
    render(<Auth />);
    
    fireEvent.change(screen.getByTestId('username-input'), { target: { value: 'us' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: '123' } });
    fireEvent.click(screen.getByTestId('submit-button'));
    
    expect(await screen.findByText('Имя пользователя должно содержать не менее 3 символов')).toBeInTheDocument();
    
    fireEvent.change(screen.getByTestId('username-input'), { target: { value: 'user' } });
    fireEvent.click(screen.getByTestId('submit-button'));
    expect(await screen.findByText('Пароль должен содержать не менее 6 символов')).toBeInTheDocument();
  });

  it('calls onSuccess on successful login', async () => {
    const onSuccess = vi.fn();
    const mockUser = { user: { id: '1', username: 'testuser' }, token: 'fake-token' };
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    });

    render(<Auth onSuccess={onSuccess} />);
    
    fireEvent.change(screen.getByTestId('username-input'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockUser);
    });
    expect(global.fetch).toHaveBeenCalledWith('/api/login', expect.any(Object));
  });

  it('calls onSuccess on successful registration', async () => {
    const onSuccess = vi.fn();
    const mockUser = { user: { id: '1', username: 'newuser' }, token: 'fake-token' };
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    });

    render(<Auth onSuccess={onSuccess} />);
    
    fireEvent.click(screen.getByText('Нет аккаунта? Зарегистрироваться'));
    fireEvent.change(screen.getByTestId('username-input'), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockUser);
    });
    expect(global.fetch).toHaveBeenCalledWith('/api/register', expect.any(Object));
  });

  it('shows error message on API failure', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    });

    render(<Auth />);
    
    fireEvent.change(screen.getByTestId('username-input'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByTestId('submit-button'));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });

  it('shows generic error message on network failure', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<Auth />);
    
    fireEvent.change(screen.getByTestId('username-input'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByTestId('submit-button'));

    expect(await screen.findByText('Network error')).toBeInTheDocument();
  });
});
