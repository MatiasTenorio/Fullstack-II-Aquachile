import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import FormularioSolicitud from './FormularioSolicitud';
import { enviarSolicitudPublica } from '../services/api';

vi.mock('../services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  enviarSolicitudPublica: vi.fn(),
}));

describe('FormularioSolicitud', () => {
  it('muestra errores si se envía vacío', async () => {
    // FormularioSolicitud
    // Aparecen los mensajes de campo obligatorio y CV faltante
    const user = userEvent.setup();
    render(<FormularioSolicitud />);
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(screen.getAllByText('Este campo es obligatorio')).toHaveLength(2);
    expect(screen.getByText('Debes adjuntar tu CV')).toBeInTheDocument();
  });

  it('rechaza un CV con formato inválido', async () => {
    // FormularioSolicitud
    // Muestra "El CV debe ser un archivo PDF, DOC o DOCX"
    const user = userEvent.setup({ applyAccept: false });
    render(<FormularioSolicitud />);
    await user.upload(screen.getByLabelText(/cargue su cv/i), new File(['x'], 'cv.txt'));
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(screen.getByText('El CV debe ser un archivo PDF, DOC o DOCX')).toBeInTheDocument();
  });

  it('envía la solicitud con datos válidos', async () => {
    // FormularioSolicitud
    // Llama al envío y muestra el mensaje de éxito
    enviarSolicitudPublica.mockResolvedValue({});
    const user = userEvent.setup();
    render(<FormularioSolicitud />);
    await user.type(screen.getByLabelText(/nombre del candidato/i), 'Ana Pérez');
    await user.type(screen.getByLabelText(/correo electrónico/i), 'ana@correo.cl');
    await user.selectOptions(screen.getByLabelText(/nombre del cargo/i), 'A');
    await user.selectOptions(screen.getByLabelText(/familia del cargo/i), 'Profesional A');
    await user.upload(screen.getByLabelText(/cargue su cv/i), new File(['x'], 'cv.pdf', { type: 'application/pdf' }));
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(enviarSolicitudPublica).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/fue enviada correctamente/i)).toBeInTheDocument();
  });
});
