import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MyClub } from './MyClub';
import { MemoryRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { MainMenu } from '../../mainMenu/views/MainMenu';
import { getMyClub, updateMyClub } from '../api';
import { getCurrentUser } from '../../friendlyGames/api';

vi.mock('../api', () => ({ getMyClub: vi.fn(), updateMyClub: vi.fn() }));
vi.mock('../../friendlyGames/api', () => ({ getCurrentUser: vi.fn() }));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...await importOriginal(),
  useNavigate: vi.fn(),
}));

const realRouter = await vi.importActual('react-router-dom');

const USER = { user_name: 'Luca', user_email: 'luca@example.com' };
const CLUB = {
  club_name: 'San Marino',
  club_avatar: 'YWJj',
  club_id: 1,
  statistics: {
    total_points: 42,
    matches_played: 20,
    matches_won: 12,
    matches_drawn: 6,
    matches_lost: 2,
    goals_for: 35,
    goals_against: 10,
    leagues_played: 3,
    leagues_won: 1,
  },
};
const AVATAR_LABEL = 'Nueva imagen JPG/JPEG (hasta 1 MB)';

// Permite controlar cuándo termina una petición para probar los estados de espera.
function createPendingRequest() {
  let resolve;
  let reject;
  const promise = new Promise((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

async function renderLoadedClub() {
  const view = render(<MyClub />);
  await screen.findByText(CLUB.club_name);
  return view;
}

async function enterClubName(user, name) {
  const input = screen.getByLabelText('Nombre del club');
  await user.clear(input);
  await user.type(input, name);
}

async function selectValidAvatar(user) {
  const image = new File(['jpeg'], 'club.jpg', { type: 'image/jpeg' });
  await user.upload(screen.getByLabelText(AVATAR_LABEL), image);
  await waitFor(() => expect(screen.getByText('Guardar')).toBeEnabled());
}

describe('MyClub', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentUser.mockResolvedValue(USER);
    getMyClub.mockResolvedValue(CLUB);
    useNavigate.mockReturnValue(mockNavigate);
  });

  describe('Carga inicial y pestañas', () => {
    it('renderiza la vista de gestión del club correctamente', async () => {
      await renderLoadedClub();

      expect(screen.getByRole('heading', { name: /Mi Club/i })).toBeInTheDocument();
      expect(screen.getByRole('img', { name: CLUB.club_name })).toBeInTheDocument();
      expect(screen.queryByText(/^Usuario:/)).not.toBeInTheDocument();
      expect(screen.getByText('Correo electrónico: luca@example.com')).toBeInTheDocument();
      expect(screen.queryByText('Estadísticas del club')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Gestión de Jugadores/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Gestión de Comportamientos/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Gestión de Directores Técnicos/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Volver al Menú Principal/i })).toBeInTheDocument();

      // Verificamos que los botones de features futuras no se rendericen
      expect(screen.queryByRole('button', { name: /Preparar mi plantilla/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Estadísticas' })).toBeInTheDocument();
    });

    it('alterna las pestañas sin navegar ni repetir las consultas', async () => {
      const user = userEvent.setup();
      await renderLoadedClub();

      expect(screen.getByRole('button', { name: 'Gestión de Jugadores' })).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Estadísticas' }));

      expect(screen.getByText('Estadísticas del club')).toBeInTheDocument();
      expect(screen.getByText('Puntos totales').parentElement).toHaveTextContent('42');
      expect(screen.queryByRole('button', { name: 'Gestión de Jugadores' })).not.toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(getCurrentUser).toHaveBeenCalledTimes(1);
      expect(getMyClub).toHaveBeenCalledTimes(1);

      await user.click(screen.getByRole('button', { name: 'Información' }));
      expect(screen.getByRole('button', { name: 'Gestión de Jugadores' })).toBeInTheDocument();
    });

    it('selecciona Información nuevamente al volver a ingresar', async () => {
      const user = userEvent.setup();
      const { unmount } = await renderLoadedClub();
      await user.click(screen.getByText('Estadísticas'));
      unmount();

      await renderLoadedClub();

      expect(screen.getByText('Gestión de Jugadores')).toBeInTheDocument();
      expect(screen.queryByText('Estadísticas del club')).not.toBeInTheDocument();
    });
  });

  describe('Navegación', () => {
    it('navega a "/club/coach-behaviors" al hacer clic en "Gestión de Directores Técnicos"', async () => {
      const user = userEvent.setup();
      await renderLoadedClub();

      await user.click(screen.getByRole('button', { name: 'Gestión de Directores Técnicos' }));

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/club/coach-behaviors');
    });

    it('navega a "/club/players" al hacer clic en "Gestión de Jugadores"', async () => {
      const user = userEvent.setup();
      await renderLoadedClub();

      const playersButton = screen.getByRole('button', { name: /Gestión de Jugadores/i });
      await user.click(playersButton);

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/club/players');
    });

    it('navega a "/club/behaviors" al hacer clic en "Gestión de Comportamientos"', async () => {
      const user = userEvent.setup();
      await renderLoadedClub();

      const behaviorsButton = screen.getByRole('button', { name: /Gestión de Comportamientos/i });
      await user.click(behaviorsButton);

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/club/behaviors');
    });

    it('navega a "/" al hacer clic en "Volver al Menú Principal"', async () => {
      const user = userEvent.setup();
      await renderLoadedClub();

      const backButton = screen.getByRole('button', { name: /Volver al Menú Principal/i });
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Peticiones iniciales', () => {
    it('inicia ambas peticiones en paralelo y espera a las dos', async () => {
      const userRequest = createPendingRequest();
      const clubRequest = createPendingRequest();
      getCurrentUser.mockReturnValue(userRequest.promise);
      getMyClub.mockReturnValue(clubRequest.promise);
      render(<MyClub />);

      expect(getCurrentUser).toHaveBeenCalledTimes(1);
      expect(getMyClub).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Cargando información del club…')).toBeInTheDocument();

      // La vista debe seguir cargando hasta recibir también los datos del club.
      await act(async () => userRequest.resolve(USER));
      expect(screen.getByText('Cargando información del club…')).toBeInTheDocument();

      await act(async () => clubRequest.resolve(CLUB));

      expect(screen.getByText('San Marino')).toBeInTheDocument();
      expect(screen.queryByText(/^Usuario:/)).not.toBeInTheDocument();
      expect(screen.queryByText('Cargando información del club…')).not.toBeInTheDocument();
    });

    it.each([
      { resource: 'usuario', request: getCurrentUser, error: new TypeError('Failed to fetch'), message: 'No se pudo establecer conexión con el servidor' },
      { resource: 'club', request: getMyClub, error: Object.assign(new Error('Club not found'), { status: 404 }), message: 'No se encontró el club' },
    ])('redirige al menú con el error si falla la consulta de $resource', async ({ request, error, message }) => {
      request.mockRejectedValue(error);
      render(<MyClub />);
      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/', {
        state: { clubLoadError: message },
      }));
    });
  });

  describe('Guardado y actualización', () => {
    it.each([
      { responseType: 'sin contenido', response: null },
      { responseType: 'con datos', response: { club_name: 'Nuevo club' } },
    ])('guarda el nombre y refresca solo el club ante una respuesta $responseType', async ({ response }) => {
      const user = userEvent.setup();
      updateMyClub.mockResolvedValue(response);
      await renderLoadedClub();
      await user.click(screen.getByTitle('Editar nombre'));
      await enterClubName(user, '  Nuevo club  ');
      getMyClub.mockResolvedValueOnce({ ...CLUB, club_name: 'Nuevo club' });

      await user.click(screen.getByText('Guardar'));

      await screen.findByText('Nuevo club');
      expect(screen.queryByLabelText('Nombre del club')).not.toBeInTheDocument();
      expect(updateMyClub).toHaveBeenCalledWith({ new_name: 'Nuevo club' });
      expect(getCurrentUser).toHaveBeenCalledTimes(1);
      expect(getMyClub).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Club actualizado correctamente').closest('[role="alert"]')).toHaveClass('bg-green-100');
    });

    it('conserva el modal y el nombre ingresado si falla el guardado', async () => {
      const user = userEvent.setup();
      updateMyClub.mockRejectedValue(Object.assign(new Error('[object Object]'), { status: 422 }));
      await renderLoadedClub();
      await user.click(screen.getByTitle('Editar nombre'));
      await enterClubName(user, 'Otro club');

      await user.click(screen.getByText('Guardar'));

      await screen.findByText('Revisá el nombre o la imagen del club e intentá nuevamente');
      expect(screen.getByLabelText('Nombre del club')).toHaveValue('Otro club');
      expect(screen.getByText('Guardar')).toBeEnabled();
      expect(getMyClub).toHaveBeenCalledTimes(1);
    });

    it('conserva los datos anteriores y vuelve a habilitar la edición si falla el GET posterior', async () => {
      const user = userEvent.setup();
      const refreshRequest = createPendingRequest();
      updateMyClub.mockResolvedValue(null);
      await renderLoadedClub();
      await user.click(screen.getByTitle('Editar nombre'));
      await enterClubName(user, 'Nuevo club');
      getMyClub.mockReturnValueOnce(refreshRequest.promise);
      await user.click(screen.getByText('Guardar'));

      // El PUT ya terminó; el GET de actualización todavía está pendiente.
      expect(screen.getByText('San Marino')).toBeInTheDocument();
      expect(screen.getByTitle('Editar nombre')).toBeDisabled();
      expect(screen.getByTitle('Editar avatar')).toBeDisabled();

      // Si falla el refresco, se conservan los datos y vuelve a habilitarse la edición.
      await act(async () => refreshRequest.reject(new TypeError('Failed to fetch')));

      expect(screen.getByText('No se pudo establecer conexión con el servidor')).toBeInTheDocument();
      expect(screen.getByText('San Marino')).toBeInTheDocument();
      expect(screen.getByTitle('Editar nombre')).toBeEnabled();
      expect(screen.getByTitle('Editar avatar')).toBeEnabled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Cancelación', () => {
    it('descarta el nombre ingresado al cancelar', async () => {
      const user = userEvent.setup();
      await renderLoadedClub();
      await user.click(screen.getByTitle('Editar nombre'));
      await enterClubName(user, 'Otro club');

      await user.click(screen.getByText('Cancelar'));

      expect(screen.queryByText('Guardar')).not.toBeInTheDocument();
      expect(updateMyClub).not.toHaveBeenCalled();
      expect(getMyClub).toHaveBeenCalledTimes(1);

      await user.click(screen.getByTitle('Editar nombre'));
      expect(screen.getByLabelText('Nombre del club')).toHaveValue(CLUB.club_name);
      expect(screen.getByText('Guardar')).toBeDisabled();
    });

    it('descarta la imagen seleccionada al cancelar', async () => {
      const user = userEvent.setup();
      await renderLoadedClub();
      await user.click(screen.getByTitle('Editar avatar'));
      await selectValidAvatar(user);

      await user.click(screen.getByText('Cancelar'));

      expect(screen.queryByText('Guardar')).not.toBeInTheDocument();
      expect(updateMyClub).not.toHaveBeenCalled();
      expect(getMyClub).toHaveBeenCalledTimes(1);

      await user.click(screen.getByTitle('Editar avatar'));
      expect(screen.getByText('Guardar')).toBeDisabled();
      expect(screen.getByLabelText(AVATAR_LABEL)).toHaveValue('');
      expect(screen.getAllByRole('img')).toHaveLength(2);
      for (const image of screen.getAllByRole('img')) {
        expect(image).toHaveAttribute('src', 'data:image/png;base64,YWJj');
      }
    });
  });

  describe('Guardado del avatar', () => {
    it('conserva el avatar seleccionado ante un PUT fallido y permite reintentar', async () => {
      const user = userEvent.setup();
      updateMyClub
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce(null);
      await renderLoadedClub();
      await user.click(screen.getByTitle('Editar avatar'));
      await selectValidAvatar(user);

      await user.click(screen.getByText('Guardar'));

      await screen.findByText('No se pudo establecer conexión con el servidor');
      expect(screen.getByText('Guardar')).toBeEnabled();
      expect(screen.getByText('Cancelar')).toBeEnabled();
      expect(updateMyClub).toHaveBeenLastCalledWith({ new_avatar: 'anBlZw==' });
      expect(getMyClub).toHaveBeenCalledTimes(1);

      // Reintento: el backend acepta el avatar y devuelve los datos actualizados.
      getMyClub.mockResolvedValueOnce({
        ...CLUB,
        club_avatar: 'anBlZw==',
        statistics: { ...CLUB.statistics, total_points: 60 },
      });
      await user.click(screen.getByText('Guardar'));
      await waitFor(() => expect(screen.queryByText('Guardar')).not.toBeInTheDocument());

      expect(updateMyClub).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('img')).toHaveAttribute('src', 'data:image/png;base64,anBlZw==');
      expect(screen.getByTitle('Editar nombre')).toBeEnabled();
      expect(screen.getByTitle('Editar avatar')).toBeEnabled();

      // La otra pestaña también debe recibir las estadísticas actualizadas.
      await user.click(screen.getByText('Estadísticas'));

      expect(screen.getByText('Puntos totales').parentElement).toHaveTextContent('60');
      expect(getCurrentUser).toHaveBeenCalledTimes(1);
      expect(getMyClub).toHaveBeenCalledTimes(2);
    });
  });
  describe('Notificaciones de errores', () => {
    it('redirige con el mensaje de conexión si falla la carga inicial por red', async () => {
      getCurrentUser.mockRejectedValue(new TypeError('Failed to fetch'));

      render(<MyClub />);

      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/', {
        state: { clubLoadError: 'No se pudo establecer conexión con el servidor' },
      }));
    });

    it('redirige con el mensaje de respuesta inválida si la carga devuelve JSON ilegible', async () => {
      getMyClub.mockRejectedValue(new SyntaxError('Unexpected token'));

      render(<MyClub />);

      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/', {
        state: { clubLoadError: 'Respuesta inválida del servidor' },
      }));
    });

    it('conserva el formulario y notifica en rojo una respuesta inválida al guardar', async () => {
      const user = userEvent.setup();
      updateMyClub.mockRejectedValue(new SyntaxError('Unexpected token'));
      await renderLoadedClub();
      await user.click(screen.getByTitle('Editar nombre'));
      await enterClubName(user, 'Otro club');

      await user.click(screen.getByText('Guardar'));

      const message = await screen.findByText('Respuesta inválida del servidor');
      expect(message.closest('[role="alert"]')).toHaveClass('bg-red-300');
      expect(screen.getByLabelText('Nombre del club')).toHaveValue('Otro club');
      expect(screen.getByText('Guardar')).toBeEnabled();
      expect(getMyClub).toHaveBeenCalledTimes(1);
    });

    it.each([
      { status: 404, detail: 'Club not found', expected: 'No se encontró el club' },
      { status: 422, detail: '[object Object]', expected: 'Revisá el nombre o la imagen del club e intentá nuevamente' },
      { status: 500, detail: 'Internal Server Error', expected: 'Respuesta inválida del servidor' },
    ])('muestra el mensaje correspondiente al estado HTTP $status al guardar', async ({ status, detail, expected }) => {
      const user = userEvent.setup();
      // Misma estructura de error que entrega apiClient.
      updateMyClub.mockRejectedValue(Object.assign(new Error(detail), { status }));
      await renderLoadedClub();
      await user.click(screen.getByTitle('Editar nombre'));
      await enterClubName(user, 'Otro club');

      await user.click(screen.getByText('Guardar'));

      await screen.findByText(expected);
      expect(screen.getByLabelText('Nombre del club')).toHaveValue('Otro club');
      expect(screen.getByText('Guardar')).toBeEnabled();
    });

    it('delega el 401 de carga inicial a apiClient sin redirigir al menú', async () => {
      getCurrentUser.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }));

      await act(async () => { render(<MyClub />); });

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(screen.queryByText('Respuesta inválida del servidor')).not.toBeInTheDocument();
    });

    it('delega el 401 de guardado a apiClient sin mostrar otra notificación', async () => {
      const user = userEvent.setup();
      updateMyClub.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }));
      await renderLoadedClub();
      await user.click(screen.getByTitle('Editar nombre'));
      await enterClubName(user, 'Otro club');

      await user.click(screen.getByText('Guardar'));

      expect(screen.queryByText('No se pudo actualizar el club')).not.toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(getMyClub).toHaveBeenCalledTimes(1);
    });

    it('muestra errores locales debajo del campo sin notificación HTTP', async () => {
      const user = userEvent.setup();
      await renderLoadedClub();
      await user.click(screen.getByTitle('Editar nombre'));

      await enterClubName(user, 'ab');

      expect(screen.getByText('El nombre debe tener entre 3 y 30 caracteres')).toBeInTheDocument();
      expect(screen.queryByText('No se pudo actualizar el club')).not.toBeInTheDocument();
      expect(updateMyClub).not.toHaveBeenCalled();
    });
  });

  describe('Apertura de los modales', () => {
    it('abre el editor de nombre con el nombre actual', async () => {
      const user = userEvent.setup();
      await renderLoadedClub();

      await user.click(screen.getByTitle('Editar nombre'));

      expect(screen.getByLabelText('Nombre del club')).toHaveValue(CLUB.club_name);
      expect(screen.getByText('Guardar')).toBeDisabled();
    });

    it('abre el editor de avatar con la imagen actual y el selector vacío', async () => {
      const user = userEvent.setup();
      getMyClub.mockResolvedValue({ ...CLUB, club_avatar: 'YWJj' });
      await renderLoadedClub();

      await user.click(screen.getByTitle('Editar avatar'));

      expect(screen.getByLabelText(AVATAR_LABEL)).toHaveValue('');
      expect(screen.getByText('Guardar')).toBeDisabled();
      const modal = screen.getByText('Editar avatar del club').closest('form');
      expect(modal.querySelector('img')).toHaveAttribute('src', 'data:image/png;base64,YWJj');
    });
  });

  describe('Bloqueo durante el PUT', () => {
    it.each([
      { modal: 'nombre', enterChanges: user => enterClubName(user, 'Otro club') },
      { modal: 'avatar', enterChanges: selectValidAvatar },
    ])('no permite cerrar el modal de $modal mientras guarda', async ({ modal, enterChanges }) => {
      const user = userEvent.setup();
      const saveRequest = createPendingRequest();
      updateMyClub.mockReturnValue(saveRequest.promise);
      await renderLoadedClub();
      await user.click(screen.getByTitle(`Editar ${modal}`));
      await enterChanges(user);

      await user.click(screen.getByText('Guardar'));
      await user.click(screen.getByText('Cancelar'));
      fireEvent.keyDown(document, { key: 'Escape' });
      fireEvent.click(screen.getByText('Guardando…').closest('form').parentElement);

      expect(screen.getByText('Guardando…')).toBeDisabled();
      expect(screen.getByText('Cancelar')).toBeDisabled();
      expect(updateMyClub).toHaveBeenCalledTimes(1);
      expect(getMyClub).toHaveBeenCalledTimes(1);
    });
  });

  describe('Finalización del refresco', () => {
    it('actualiza ambas pestañas y habilita la edición cuando termina el GET', async () => {
      const user = userEvent.setup();
      const refreshRequest = createPendingRequest();
      updateMyClub.mockResolvedValue(null);
      await renderLoadedClub();
      await user.click(screen.getByTitle('Editar nombre'));
      await enterClubName(user, 'Nuevo club');
      getMyClub.mockReturnValueOnce(refreshRequest.promise);
      await user.click(screen.getByText('Guardar'));

      expect(screen.getByText(CLUB.club_name)).toBeInTheDocument();
      expect(screen.getByTitle('Editar nombre')).toBeDisabled();
      expect(screen.getByTitle('Editar avatar')).toBeDisabled();

      await act(async () => refreshRequest.resolve({
        ...CLUB,
        club_name: 'Nuevo club',
        statistics: { ...CLUB.statistics, total_points: 99 },
      }));

      expect(screen.getByText('Nuevo club')).toBeInTheDocument();
      expect(screen.getByTitle('Editar nombre')).toBeEnabled();
      expect(screen.getByTitle('Editar avatar')).toBeEnabled();
      expect(screen.queryByText('Guardar')).not.toBeInTheDocument();

      await user.click(screen.getByText('Estadísticas'));

      expect(screen.getByText('Puntos totales').parentElement).toHaveTextContent('99');
      expect(getCurrentUser).toHaveBeenCalledTimes(1);
      expect(getMyClub).toHaveBeenCalledTimes(2);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('delega a apiClient el 401 del GET posterior al guardado', async () => {
      const user = userEvent.setup();
      updateMyClub.mockResolvedValue(null);
      await renderLoadedClub();
      await user.click(screen.getByTitle('Editar nombre'));
      await enterClubName(user, 'Nuevo club');
      getMyClub.mockRejectedValueOnce(Object.assign(new Error('Unauthorized'), { status: 401 }));

      await user.click(screen.getByText('Guardar'));

      expect(screen.queryByText('No se pudo actualizar el club')).not.toBeInTheDocument();
      expect(screen.getByTitle('Editar nombre')).toBeEnabled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

});

function CurrentPath() {
  const location = useLocation();
  return <p>Ruta actual: {location.pathname}</p>;
}

function renderApp(initialPath) {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <CurrentPath />
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/club" element={<MyClub />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Navegación de Mi club con el router real', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useNavigate.mockImplementation(realRouter.useNavigate);
    getCurrentUser.mockResolvedValue({ user_name: 'Luca', user_email: 'luca@example.com' });
    getMyClub.mockResolvedValue({ club_name: 'San Marino', club_avatar: 'YWJj', statistics: {} });
  });

  it('abre /club desde el menú principal', async () => {
    const user = userEvent.setup();
    renderApp('/');

    await user.click(screen.getByText('Mi Club'));

    await screen.findByText('San Marino');
    expect(screen.getByText('Ruta actual: /club')).toBeInTheDocument();
  });

  it('mantiene la URL y reutiliza los datos al alternar ambas pestañas', async () => {
    const user = userEvent.setup();
    renderApp('/club');
    await screen.findByText('San Marino');

    await user.click(screen.getByText('Estadísticas'));
    await user.click(screen.getByText('Información'));

    expect(screen.getByText('Ruta actual: /club')).toBeInTheDocument();
    expect(screen.getByText('San Marino')).toBeInTheDocument();
    expect(getCurrentUser).toHaveBeenCalledTimes(1);
    expect(getMyClub).toHaveBeenCalledTimes(1);
  });

  it.each([
    { resource: 'usuario', request: getCurrentUser },
    { resource: 'club', request: getMyClub },
  ])('vuelve al menú y conserva la notificación si falla la carga de $resource', async ({ request }) => {
    request.mockRejectedValue(new TypeError('Failed to fetch'));
    renderApp('/club');

    await screen.findByText('No se pudo establecer conexión con el servidor');

    expect(screen.getByText('Ruta actual: /')).toBeInTheDocument();
    expect(screen.getByText('FUTBOT')).toBeInTheDocument();
  });
});
