import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MiLegajo from '../../components/MiLegajo';
import { inscripcionService } from '../../services/inscripcionService';

describe('MiLegajo', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('permite continuar un borrador con los datos y documentos cargados', async () => {
    const legajo = {
      id: 'leg-1',
      estado: 'BORRADOR',
      dni: '30123456',
      email: 'aspirante@example.com',
      titulo: 'Ingeniero en Sistemas',
      universidad: 'UTN FRLP',
      anio_egreso: 2025,
      cohorte: { nombre: 'Cohorte 2026' },
    };
    const documentos = [
      { id: 'doc-1', tipo: 'DNI', nombre_original: 'dni.pdf' },
      { id: 'doc-2', tipo: 'TITULO_GRADO', nombre_original: 'titulo.pdf' },
    ];
    vi.spyOn(inscripcionService, 'obtenerMiLegajo').mockResolvedValue(legajo);
    vi.spyOn(inscripcionService, 'obtenerDocumentos').mockResolvedValue(documentos);
    const onCompletarLegajo = vi.fn();

    render(
      <MiLegajo
        onIniciarPreinscripcion={vi.fn()}
        onCompletarLegajo={onCompletarLegajo}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Borrador')).toBeDefined();
      expect(screen.getByText(/titulo\.pdf/)).toBeDefined();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Completar mi legajo' }));

    expect(onCompletarLegajo).toHaveBeenCalledWith({ legajo, documentos });
  });

  it('muestra la observación y habilita la subsanación del legajo', async () => {
    vi.spyOn(inscripcionService, 'obtenerMiLegajo').mockResolvedValue({
      id: 'leg-observado',
      estado: 'OBSERVADO',
      motivo_observacion: 'Falta corregir el año de egreso',
    });
    vi.spyOn(inscripcionService, 'obtenerDocumentos').mockResolvedValue([]);

    render(
      <MiLegajo
        onIniciarPreinscripcion={vi.fn()}
        onCompletarLegajo={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Falta corregir el año de egreso')).toBeDefined();
    });
    expect(screen.getByRole('status').className).toContain('mi-legajo-status-badge--warning');
    expect(screen.getByRole('button', { name: 'Corregir y reenviar' })).toBeDefined();
  });

  it.each([
    ['APROBADO', 'mi-legajo-status-badge--success'],
    ['RECHAZADO', 'mi-legajo-status-badge--danger'],
    ['BORRADOR', 'mi-legajo-status-badge--neutral'],
  ])('aplica la clase visual correspondiente al estado %s', async (estado, claseEsperada) => {
    vi.spyOn(inscripcionService, 'obtenerMiLegajo').mockResolvedValue({
      id: `leg-${estado.toLowerCase()}`,
      estado,
      motivo_observacion: estado === 'RECHAZADO' ? 'La documentación no cumple los requisitos.' : undefined,
    });
    vi.spyOn(inscripcionService, 'obtenerDocumentos').mockResolvedValue([]);

    render(<MiLegajo onIniciarPreinscripcion={vi.fn()} onCompletarLegajo={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('status').className).toContain(claseEsperada);
    });
    if (estado === 'RECHAZADO') {
      expect(screen.getByText('La documentación no cumple los requisitos.')).toBeDefined();
    }
  });
});
