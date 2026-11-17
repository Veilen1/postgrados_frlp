import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Preinscripcion from '../../components/preinscripcion';
import { inscripcionService } from '../../services/inscripcionService';
import { authService } from '../../services/authService';

describe('Preinscripcion Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  const mockCohortes = [
    {
      id: 'cohorte-1',
      anio: 2026,
      nombre: 'Cohorte 2026 - MISI',
      carrera: 'Maestría en Ingeniería en Sistemas de Información',
      abierta: true,
    },
  ];

  const avanzarHastaPaso3 = async (container) => {
    fireEvent.change(container.querySelector('input[name="apellido"]'), { target: { value: 'Angel' } });
    fireEvent.change(container.querySelector('input[name="nombre"]'), { target: { value: 'Lucio' } });
    fireEvent.change(container.querySelector('input[name="dni"]'), { target: { value: '40123456' } });
    fireEvent.change(container.querySelector('input[name="email"]'), { target: { value: 'lucio@utn.edu.ar' } });
    fireEvent.change(container.querySelector('input[name="password"]'), { target: { value: 'ClaveSegura123' } });
    fireEvent.click(screen.getByText('Continuar a Datos Académicos'));

    await waitFor(() => {
      expect(container.querySelector('input[name="titulo"]')).not.toBeNull();
    });

    fireEvent.change(container.querySelector('input[name="titulo"]'), { target: { value: 'Ingeniero en Sistemas' } });
    fireEvent.change(container.querySelector('input[name="universidad"]'), { target: { value: 'UTN FRLP' } });
    fireEvent.change(container.querySelector('input[name="anioEgreso"]'), { target: { value: '2025' } });
    fireEvent.click(screen.getByText('Continuar a Documentación'));

    await waitFor(() => {
      expect(screen.getByText('Generar Resumen de Legajo')).toBeDefined();
    });
  };

  it('rechaza archivos .pdf sin firma binaria %PDF en Paso 3', async () => {
    vi.spyOn(inscripcionService, 'obtenerCohortes').mockResolvedValue(mockCohortes);

    const { container } = render(<Preinscripcion onVolverAlLogin={() => {}} />);
    await avanzarHastaPaso3(container);

    const fileInputs = container.querySelectorAll('input[type="file"]');
    const archivoFalso = new File(['texto plano disfrazado'], 'titulo.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInputs[0], { target: { files: [archivoFalso] } });

    await waitFor(() => {
      expect(screen.getByText(/El archivo no es un PDF válido o está dañado/i)).toBeDefined();
    });
  });

  it('reutiliza el legajo, evita resubir documentos ya cargados y limpia sesion vencida en flujo publico', async () => {
    localStorage.setItem('access_token', 'token-vencido-huerfano');
    vi.spyOn(inscripcionService, 'obtenerCohortes').mockResolvedValue(mockCohortes);
    const registroSpy = vi.spyOn(authService, 'registroAspirante').mockResolvedValue({ id: 'u-1', rol: 'ASPIRANTE' });
    vi.spyOn(authService, 'login').mockImplementation(async () => {
      localStorage.setItem('access_token', 'jwt-temp');
      localStorage.setItem('user_profile', JSON.stringify({ id: 'u-1', rol: 'ASPIRANTE' }));
      return { access_token: 'jwt-temp', user: { id: 'u-1', rol: 'ASPIRANTE' } };
    });
    const logoutSpy = vi.spyOn(authService, 'logout').mockImplementation(() => {
      localStorage.clear();
    });

    const crearSpy = vi
      .spyOn(inscripcionService, 'crearPreinscripcion')
      .mockResolvedValue({ id: 'legajo-123' });

    const actualizarSpy = vi
      .spyOn(inscripcionService, 'actualizarPreinscripcion')
      .mockResolvedValue({ id: 'legajo-123' });

    const subirSpy = vi
      .spyOn(inscripcionService, 'subirDocumento')
      .mockResolvedValueOnce({ id: 'doc-titulo' })
      .mockRejectedValueOnce(new Error('Fallo temporal de red'))
      .mockResolvedValueOnce({ id: 'doc-dni' });

    const enviarSpy = vi
      .spyOn(inscripcionService, 'enviarLegajo')
      .mockResolvedValue({ id: 'legajo-123', estado: 'ENVIADO' });

    const { container } = render(<Preinscripcion onVolverAlLogin={() => {}} />);
    await avanzarHastaPaso3(container);

    const fileInputs = container.querySelectorAll('input[type="file"]');
    const pdfValido = new File(['%PDF-1.4 contenido'], 'doc.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInputs[0], { target: { files: [pdfValido] } });
    fireEvent.change(fileInputs[3], { target: { files: [pdfValido] } });

    await waitFor(() => {
      fireEvent.click(screen.getByText('Generar Resumen de Legajo'));
      expect(screen.getByText('Confirmar y Enviar')).toBeDefined();
    });

    // Primer intento: sube TITULO_GRADO, falla DNI después de crear el legajo
    fireEvent.click(screen.getByText('Confirmar y Enviar'));
    await waitFor(() => {
      expect(screen.getByText(/Fallo temporal de red/i)).toBeDefined();
    });

    // Reintento: NO debe volver a crear el legajo, NO re-registra ni re-sube TITULO_GRADO
    fireEvent.click(screen.getByText('Confirmar y Enviar'));
    await waitFor(() => {
      expect(screen.getByText(/Preinscripción Registrada con Éxito/i)).toBeDefined();
    });

    expect(registroSpy).toHaveBeenCalledTimes(1);
    expect(crearSpy).toHaveBeenCalledTimes(1);
    expect(actualizarSpy).toHaveBeenCalledWith('legajo-123', expect.objectContaining({ dni: '40123456' }));
    expect(subirSpy).toHaveBeenCalledTimes(3);
    expect(subirSpy.mock.calls.map((c) => c[1])).toEqual(['TITULO_GRADO', 'DNI', 'DNI']);
    expect(enviarSpy).toHaveBeenCalledWith('legajo-123');
    expect(logoutSpy).toHaveBeenCalled();
  });

  it('actualiza datos corregidos y elimina documentos previos al reenviar legajo OBSERVADO', async () => {
    localStorage.setItem('access_token', 'jwt-asp');
    localStorage.setItem('user_profile', JSON.stringify({ id: 'u-1', rol: 'ASPIRANTE', nombre: 'Lucio', apellido: 'Angel', email: 'lucio@utn.edu.ar' }));
    vi.spyOn(inscripcionService, 'obtenerCohortes').mockResolvedValue(mockCohortes);

    const err409 = new Error('El usuario ya tiene un legajo');
    err409.status = 409;
    vi.spyOn(inscripcionService, 'crearPreinscripcion').mockRejectedValue(err409);
    vi.spyOn(inscripcionService, 'obtenerMiLegajo').mockResolvedValue({ id: 'leg-obs', estado: 'OBSERVADO' });
    const actualizarSpy = vi.spyOn(inscripcionService, 'actualizarPreinscripcion').mockResolvedValue({ id: 'leg-obs' });
    vi.spyOn(inscripcionService, 'obtenerDocumentos').mockResolvedValue([
      { id: 'old-titulo', tipo: 'TITULO_GRADO' },
      { id: 'old-dni', tipo: 'DNI' },
    ]);
    const eliminarSpy = vi.spyOn(inscripcionService, 'eliminarDocumento').mockResolvedValue(null);
    const subirSpy = vi.spyOn(inscripcionService, 'subirDocumento').mockResolvedValue({ id: 'new-doc' });
    const enviarSpy = vi.spyOn(inscripcionService, 'enviarLegajo').mockResolvedValue({ id: 'leg-obs', estado: 'ENVIADO' });

    const { container } = render(<Preinscripcion />);
    fireEvent.change(container.querySelector('input[name="dni"]'), { target: { value: '40999888' } });
    fireEvent.click(screen.getByText('Continuar a Datos Académicos'));

    await waitFor(() => {
      expect(container.querySelector('input[name="titulo"]')).not.toBeNull();
    });
    fireEvent.change(container.querySelector('input[name="titulo"]'), { target: { value: 'Ingeniero en Sistemas' } });
    fireEvent.change(container.querySelector('input[name="universidad"]'), { target: { value: 'UTN FRLP' } });
    fireEvent.change(container.querySelector('input[name="anioEgreso"]'), { target: { value: '2025' } });
    fireEvent.click(screen.getByText('Continuar a Documentación'));

    await waitFor(() => {
      expect(screen.getByText('Generar Resumen de Legajo')).toBeDefined();
    });
    const fileInputs = container.querySelectorAll('input[type="file"]');
    const pdfValido = new File(['%PDF-1.4 nuevo'], 'nuevo.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInputs[0], { target: { files: [pdfValido] } });
    fireEvent.change(fileInputs[3], { target: { files: [pdfValido] } });

    await waitFor(() => {
      fireEvent.click(screen.getByText('Generar Resumen de Legajo'));
      expect(screen.getByText('Confirmar y Enviar')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Confirmar y Enviar'));
    await waitFor(() => {
      expect(screen.getByText(/Preinscripción Registrada con Éxito/i)).toBeDefined();
    });

    expect(actualizarSpy).toHaveBeenCalledWith('leg-obs', expect.objectContaining({ dni: '40999888' }));
    expect(eliminarSpy).toHaveBeenCalledWith('old-titulo');
    expect(eliminarSpy).toHaveBeenCalledWith('old-dni');
    expect(subirSpy).toHaveBeenCalledTimes(2);
    expect(enviarSpy).toHaveBeenCalledWith('leg-obs');
  });
});
