import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VersionHistory from './VersionHistory';

describe('VersionHistory', () => {
  it('renders the component', () => {
    render(<VersionHistory />);
    expect(screen.getByText('Histórico de Versões')).toBeInTheDocument();
  });

  it('opens the dialog when the button is clicked', () => {
    render(<VersionHistory />);
    fireEvent.click(screen.getByText('Adicionar Nova Versão'));
    expect(screen.getByText('Adicionar Nova Regra')).toBeInTheDocument();
  });

  it('adds a new version when the form is submitted', () => {
    render(<VersionHistory />);
    fireEvent.click(screen.getByText('Adicionar Nova Versão'));
    fireEvent.change(screen.getByPlaceholderText('Digite a nova regra aqui...'), {
      target: { value: 'Nova regra de teste' },
    });
    fireEvent.click(screen.getByText('Gerar Nova Versão'));
    expect(screen.getByText('Versão 1')).toBeInTheDocument();
    expect(screen.getByText('Nova regra de teste')).toBeInTheDocument();
  });
});
