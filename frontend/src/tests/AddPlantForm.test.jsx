import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddPlantForm from '../components/AddPlantForm';
import React from 'react';

global.fetch = vi.fn();
global.alert = vi.fn();

describe('AddPlantForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders form fields', () => {
    render(<AddPlantForm />);
    expect(screen.getByPlaceholderText('например, Мой любимый фикус')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('например, Фикус')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Опишите ваше растение...')).toBeInTheDocument();
  });

  it('shows error if name or species is missing', async () => {
    render(<AddPlantForm />);
    fireEvent.click(screen.getByText('Добавить растение'));
    expect(await screen.findByText('Название и вид обязательны для заполнения')).toBeInTheDocument();
  });

  it('submits form successfully', async () => {
    const onPlantAdded = vi.fn();
    localStorage.setItem('token', 'fake-token');
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ _id: '123', name: 'New Plant' }),
    });

    render(<AddPlantForm onPlantAdded={onPlantAdded} />);
    
    fireEvent.change(screen.getByPlaceholderText('например, Мой любимый фикус'), { target: { value: 'My Plant' } });
    fireEvent.change(screen.getByPlaceholderText('например, Фикус'), { target: { value: 'Ficus' } });
    fireEvent.click(screen.getByText('Добавить растение'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/plants', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'My Plant', species: 'Ficus', description: '', imageUrl: '' })
      }));
      expect(onPlantAdded).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith('Растение успешно добавлено!');
    });
  });

  it('shows error if API fails', async () => {
    localStorage.setItem('token', 'fake-token');
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to add' }),
    });

    render(<AddPlantForm />);
    
    fireEvent.change(screen.getByPlaceholderText('например, Мой любимый фикус'), { target: { value: 'My Plant' } });
    fireEvent.change(screen.getByPlaceholderText('например, Фикус'), { target: { value: 'Ficus' } });
    fireEvent.click(screen.getByText('Добавить растение'));

    expect(await screen.findByText('Failed to add')).toBeInTheDocument();
  });
});
