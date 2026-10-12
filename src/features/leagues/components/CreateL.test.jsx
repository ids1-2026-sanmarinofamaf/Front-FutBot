import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import CreateL from "./CreateL";
import { sendNewL } from "../api";

// --- Mocks de dependencias externas ----------------------------------------
const navigate = vi.fn();
vi.mock("react-router-dom", () => ({ useNavigate: () => navigate }));
vi.mock("../api", () => ({ sendNewL: vi.fn() }));

const joinL = vi.fn();
vi.mock("../LeaguesProvider", () => ({
  useLeaguesSocket: () => ({ joinL }),
}));

const ROSTER = {
  formation: "offensive",
  players: Array.from({ length: 6 }, (_, i) => ({
    player_id: i + 1,
    is_starter: i < 3,
    slot: i < 3 ? ["left", "center", "right"][i] : null,
    initial_behavior_id: i < 3 ? 1 : null,
  })),
};

const INCOMPLETE_ROSTER = {
  formation: "offensive",
  players: ROSTER.players.slice(0, 4),
};

// RosterBuilder simulado para confirmar o cancelar la edición de plantilla
let nextRoster = ROSTER;
vi.mock("../../roster/components/RosterBuilder", () => ({
  RosterBuilder: ({ onSubmit, onCancel }) => (
    <div data-testid="roster-builder">
      <button onClick={() => onSubmit(nextRoster)}>confirmar plantilla</button>
      <button onClick={onCancel}>cancelar plantilla</button>
    </div>
  ),
}));

// --- Helpers ---------------------------------------------------------------
const onClose = vi.fn();
const LEAGUE_ID = 42;

const setup = (props = {}) => {
  const user = userEvent.setup();
  render(<CreateL onClose={onClose} {...props} />);
  return user;
};

const loadRoster = async (user) => {
  await user.click(screen.getByRole("button", { name: "Editar plantilla" }));
  await user.click(screen.getByRole("button", { name: "confirmar plantilla" }));
};

const fillValidForm = async (user, overrides = {}) => {
  await loadRoster(user);
  const nameInput = screen.getByLabelText("Nombre:");
  await user.clear(nameInput);
  await user.type(nameInput, overrides.nombre ?? "Liga Super Liga");
};

beforeEach(() => {
  vi.clearAllMocks();
  nextRoster = ROSTER;
  sendNewL.mockResolvedValue({ id_liga: LEAGUE_ID });
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(cleanup);

describe("CreateL", () => {
  describe("render inicial", () => {
    it("muestra el título, valores por defecto y botones principales", () => {
      setup();

      expect(screen.getByRole("heading", { name: "Crear Liga" })).toBeInTheDocument();
      expect(screen.getByLabelText("Nombre:")).toHaveValue("");
      expect(screen.getByLabelText("Duración de cada partido (segundos):")).toHaveValue(100);
      expect(screen.getByLabelText("Cantidad de jugadores:")).toHaveValue(3);
      expect(screen.getByLabelText("Privada:")).not.toBeChecked();

      expect(screen.getByRole("button", { name: "Editar plantilla" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "CREAR" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cerrar opciones" })).toBeInTheDocument();
    });

    it("no muestra el campo de contraseña ni el constructor de plantilla al inicio", () => {
      setup();

      expect(screen.queryByLabelText("Contraseña:")).not.toBeInTheDocument();
      expect(screen.queryByTestId("roster-builder")).not.toBeInTheDocument();
      expect(screen.queryByText("Liga creada")).not.toBeInTheDocument();
    });

    it("muestra aviso de plantilla faltante y el botón CREAR deshabilitado", () => {
      setup();

      expect(
        screen.getByText("Para crear la liga debes elegir tu propia plantilla primero")
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "CREAR" })).toBeDisabled();
    });
  });

  describe("prop inicial de plantilla (roster)", () => {
    it("no muestra aviso de plantilla faltante si recibe un roster inicial completo", () => {
      setup({ roster: ROSTER });

      expect(
        screen.queryByText("Para crear la liga debes elegir tu propia plantilla primero")
      ).not.toBeInTheDocument();
    });

    it("mantiene CREAR deshabilitado hasta ingresar un nombre, incluso con roster inicial", async () => {
      const user = setup({ roster: ROSTER });
      const createButton = screen.getByRole("button", { name: "CREAR" });

      expect(createButton).toBeDisabled();

      await user.type(screen.getByLabelText("Nombre:"), "Torneo Apertura");

      expect(createButton).toBeEnabled();
    });

    it("muestra aviso si el roster inicial tiene menos de 6 jugadores", () => {
      setup({ roster: INCOMPLETE_ROSTER });

      expect(
        screen.getByText("Para crear la liga debes elegir tu propia plantilla primero")
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "CREAR" })).toBeDisabled();
    });
  });

  describe("validación de campos del formulario", () => {
    it("permite ingresar un nombre y habilita CREAR cuando el resto es válido", async () => {
      const user = setup();
      await fillValidForm(user);

      expect(screen.getByLabelText("Nombre:")).toHaveValue("Liga Super Liga");
      expect(screen.getByRole("button", { name: "CREAR" })).toBeEnabled();
    });

    it("deshabilita CREAR si el nombre está compuesto sólo de espacios en blanco", async () => {
      const user = setup();
      await loadRoster(user);

      const nameInput = screen.getByLabelText("Nombre:");
      await user.type(nameInput, "    ");

      expect(screen.getByRole("button", { name: "CREAR" })).toBeDisabled();
    });

    describe("duración del partido", () => {
      it("permite cambiar la duración", async () => {
        const user = setup();
        const input = screen.getByLabelText("Duración de cada partido (segundos):");

        await user.clear(input);
        await user.type(input, "150");

        expect(input).toHaveValue(150);
      });

      it("deshabilita CREAR si la duración es menor a 1", async () => {
        const user = setup();
        await fillValidForm(user);
        const input = screen.getByLabelText("Duración de cada partido (segundos):");

        fireEvent.change(input, { target: { value: "0" } });

        expect(screen.getByRole("button", { name: "CREAR" })).toBeDisabled();
      });

      it("deshabilita CREAR si la duración supera 300", async () => {
        const user = setup();
        await fillValidForm(user);
        const input = screen.getByLabelText("Duración de cada partido (segundos):");

        fireEvent.change(input, { target: { value: "301" } });

        expect(screen.getByRole("button", { name: "CREAR" })).toBeDisabled();
      });

      it("deshabilita CREAR si la duración no es un número entero", async () => {
        const user = setup();
        await fillValidForm(user);
        const input = screen.getByLabelText("Duración de cada partido (segundos):");

        fireEvent.change(input, { target: { value: "100.5" } });

        expect(screen.getByRole("button", { name: "CREAR" })).toBeDisabled();
      });

      it("previene teclas no numéricas pero permite números, navegación y atajos", () => {
        setup();
        const input = screen.getByLabelText("Duración de cada partido (segundos):");

        const letterEvent = fireEvent.keyDown(input, { key: "a" });
        expect(letterEvent).toBe(false);

        const numberEvent = fireEvent.keyDown(input, { key: "5" });
        expect(numberEvent).toBe(true);

        const backspaceEvent = fireEvent.keyDown(input, { key: "Backspace" });
        expect(backspaceEvent).toBe(true);

        const shortcutEvent = fireEvent.keyDown(input, { key: "v", ctrlKey: true });
        expect(shortcutEvent).toBe(true);
      });
    });

    describe("cantidad de jugadores", () => {
      it("permite cambiar la cantidad de jugadores", async () => {
        const user = setup();
        const input = screen.getByLabelText("Cantidad de jugadores:");

        await user.clear(input);
        await user.type(input, "12");

        expect(input).toHaveValue(12);
      });

      it("deshabilita CREAR si la cantidad es menor a 3", async () => {
        const user = setup();
        await fillValidForm(user);
        const input = screen.getByLabelText("Cantidad de jugadores:");

        fireEvent.change(input, { target: { value: "2" } });

        expect(screen.getByRole("button", { name: "CREAR" })).toBeDisabled();
      });

      it("deshabilita CREAR si la cantidad supera 22", async () => {
        const user = setup();
        await fillValidForm(user);
        const input = screen.getByLabelText("Cantidad de jugadores:");

        fireEvent.change(input, { target: { value: "23" } });

        expect(screen.getByRole("button", { name: "CREAR" })).toBeDisabled();
      });

      it("deshabilita CREAR si la cantidad no es un número entero", async () => {
        const user = setup();
        await fillValidForm(user);
        const input = screen.getByLabelText("Cantidad de jugadores:");

        fireEvent.change(input, { target: { value: "4.5" } });

        expect(screen.getByRole("button", { name: "CREAR" })).toBeDisabled();
      });

      it("previene teclas no numéricas pero permite números y teclas permitidas", () => {
        setup();
        const input = screen.getByLabelText("Cantidad de jugadores:");

        const letterEvent = fireEvent.keyDown(input, { key: "x" });
        expect(letterEvent).toBe(false);

        const digitEvent = fireEvent.keyDown(input, { key: "8" });
        expect(digitEvent).toBe(true);

        const enterEvent = fireEvent.keyDown(input, { key: "Enter" });
        expect(enterEvent).toBe(true);
      });
    });

    describe("liga privada y contraseña", () => {
      it("muestra el campo de contraseña al tildar Privada y deshabilita CREAR si está vacía", async () => {
        const user = setup();
        await fillValidForm(user);

        const privateCheckbox = screen.getByLabelText("Privada:");
        await user.click(privateCheckbox);

        expect(privateCheckbox).toBeChecked();
        expect(screen.getByLabelText("Contraseña:")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "CREAR" })).toBeDisabled();
      });

      it("habilita CREAR una vez completada una contraseña válida", async () => {
        const user = setup();
        await fillValidForm(user);

        await user.click(screen.getByLabelText("Privada:"));
        const passwordInput = screen.getByLabelText("Contraseña:");
        await user.type(passwordInput, "clave123");

        expect(passwordInput).toHaveValue("clave123");
        expect(screen.getByRole("button", { name: "CREAR" })).toBeEnabled();
      });

      it("deshabilita CREAR si la contraseña tiene solo espacios en blanco", async () => {
        const user = setup();
        await fillValidForm(user);

        await user.click(screen.getByLabelText("Privada:"));
        const passwordInput = screen.getByLabelText("Contraseña:");
        await user.type(passwordInput, "   ");

        expect(screen.getByRole("button", { name: "CREAR" })).toBeDisabled();
      });

      it("al destildar Privada se oculta y resetea la contraseña, re-habilitando CREAR", async () => {
        const user = setup();
        await fillValidForm(user);

        const privateCheckbox = screen.getByLabelText("Privada:");
        await user.click(privateCheckbox);
        await user.type(screen.getByLabelText("Contraseña:"), "clave123");
        expect(screen.getByRole("button", { name: "CREAR" })).toBeEnabled();

        await user.click(privateCheckbox);

        expect(screen.queryByLabelText("Contraseña:")).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "CREAR" })).toBeEnabled();
      });
    });
  });

  describe("constructor de plantilla (RosterBuilder)", () => {
    it("muestra el constructor al presionar Editar plantilla y oculta el botón", async () => {
      const user = setup();

      await user.click(screen.getByRole("button", { name: "Editar plantilla" }));

      expect(screen.getByTestId("roster-builder")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Editar plantilla" })).not.toBeInTheDocument();
    });

    it("cancelar en el constructor lo oculta y restaura el botón Editar plantilla", async () => {
      const user = setup();
      await user.click(screen.getByRole("button", { name: "Editar plantilla" }));

      await user.click(screen.getByRole("button", { name: "cancelar plantilla" }));

      expect(screen.queryByTestId("roster-builder")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Editar plantilla" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "CREAR" })).toBeDisabled();
    });

    it("confirmar una plantilla de 6 jugadores oculta el constructor y la advertencia", async () => {
      const user = setup();

      await loadRoster(user);

      expect(screen.queryByTestId("roster-builder")).not.toBeInTheDocument();
      expect(
        screen.queryByText("Para crear la liga debes elegir tu propia plantilla primero")
      ).not.toBeInTheDocument();
    });

    it("confirmar una plantilla con menos de 6 jugadores mantiene CREAR deshabilitado", async () => {
      nextRoster = INCOMPLETE_ROSTER;
      const user = setup();

      await loadRoster(user);

      expect(screen.getByRole("button", { name: "CREAR" })).toBeDisabled();
      expect(
        screen.getByText("Para crear la liga debes elegir tu propia plantilla primero")
      ).toBeInTheDocument();
    });
  });

  describe("acciones de cerrar", () => {
    it("el botón × ejecuta onClose", async () => {
      const user = setup();

      await user.click(screen.getByRole("button", { name: "Cerrar opciones" }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("el botón Cancelar ejecuta onClose", async () => {
      const user = setup();

      await user.click(screen.getByRole("button", { name: "Cancelar" }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("envío y creación de liga (handleSubmit)", () => {
    it("envía todos los parámetros a sendNewL al enviar el formulario", async () => {
      const user = setup();
      await fillValidForm(user, { nombre: "Torneo de Verano" });

      const durationInput = screen.getByLabelText("Duración de cada partido (segundos):");
      await user.clear(durationInput);
      await user.type(durationInput, "120");

      const usersInput = screen.getByLabelText("Cantidad de jugadores:");
      await user.clear(usersInput);
      await user.type(usersInput, "6");

      await user.click(screen.getByLabelText("Privada:"));
      await user.type(screen.getByLabelText("Contraseña:"), "mypassword");

      await user.click(screen.getByRole("button", { name: "CREAR" }));

      expect(sendNewL).toHaveBeenCalledTimes(1);
      expect(sendNewL).toHaveBeenCalledWith({
        nombre: "Torneo de Verano",
        duracion_partido: 120,
        max_usuarios: 6,
        es_privada: true,
        password: "mypassword",
        roster: ROSTER,
      });
    });

    it("muestra estado de carga durante el envío y previene dobles envíos", async () => {
      let resolvePromise;
      sendNewL.mockImplementation(() => new Promise((resolve) => {
        resolvePromise = resolve;
      }));

      const user = setup();
      await fillValidForm(user);

      const createBtn = screen.getByRole("button", { name: "CREAR" });
      await user.click(createBtn);

      expect(screen.getByRole("button", { name: "CREANDO..." })).toBeDisabled();
      expect(sendNewL).toHaveBeenCalledTimes(1);

      // Intentar clickear mientras se procesa no dispara otro envío
      await user.click(screen.getByRole("button", { name: "CREANDO..." }));
      expect(sendNewL).toHaveBeenCalledTimes(1);

      resolvePromise({ id_liga: LEAGUE_ID });
      expect(await screen.findByText("Liga creada")).toBeInTheDocument();
    });

    it("abre el socket de la liga creada llamando a joinL con su id_liga", async () => {
      const user = setup();
      await fillValidForm(user);

      await user.click(screen.getByRole("button", { name: "CREAR" }));
      await screen.findByText("Liga creada");

      expect(joinL).toHaveBeenCalledTimes(1);
      expect(joinL).toHaveBeenCalledWith(LEAGUE_ID);
    });

    it("no llama a joinL si el backend responde sin id_liga", async () => {
      sendNewL.mockResolvedValue({});
      const user = setup();
      await fillValidForm(user);

      await user.click(screen.getByRole("button", { name: "CREAR" }));
      await screen.findByRole("alert");

      expect(joinL).not.toHaveBeenCalled();
    });

    it("no llama a joinL si falla la creación", async () => {
      sendNewL.mockRejectedValue(new Error("Network Error"));
      const user = setup();
      await fillValidForm(user);

      await user.click(screen.getByRole("button", { name: "CREAR" }));
      await screen.findByRole("alert");

      expect(joinL).not.toHaveBeenCalled();
    });

    it("muestra la confirmación de éxito cuando el backend retorna un id_liga válido", async () => {
      const user = setup();
      await fillValidForm(user);

      await user.click(screen.getByRole("button", { name: "CREAR" }));

      expect(await screen.findByText("Liga creada")).toBeInTheDocument();
      expect(screen.getByText("¿Quieres redirigirte al lobby de tu liga?")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Volver a la lista" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Lobby" })).toBeInTheDocument();
    });

    it("muestra alerta si el backend retorna una respuesta sin id_liga", async () => {
      sendNewL.mockResolvedValue({});
      const user = setup();
      await fillValidForm(user);

      await user.click(screen.getByRole("button", { name: "CREAR" }));

      expect(await screen.findByRole("alert")).toHaveTextContent("Respuesta invalida del servidor");
      expect(screen.getByRole("alert")).toHaveTextContent("Fallo en comunicación con servidor");
      expect(screen.queryByText("Liga creada")).not.toBeInTheDocument();
    });

    it("muestra alerta de parámetros faltantes si sendNewL arroja 'Missing body requirement'", async () => {
      sendNewL.mockRejectedValue("Missing body requirement");
      const user = setup();
      await fillValidForm(user);

      await user.click(screen.getByRole("button", { name: "CREAR" }));

      expect(await screen.findByRole("alert")).toHaveTextContent("Felicidades, rompiste el formulario");
      expect(screen.getByRole("alert")).toHaveTextContent("Error al crear, faltan parametros necesarios.");
    });

    it("muestra alerta de error genérico si sendNewL arroja otro fallo", async () => {
      sendNewL.mockRejectedValue(new Error("Network Error"));
      const user = setup();
      await fillValidForm(user);

      await user.click(screen.getByRole("button", { name: "CREAR" }));

      expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo enviar solicitud al servidor");
      expect(screen.getByRole("alert")).toHaveTextContent("Error al crear, intente en otro momento.");
    });

    it("limpia la alerta al modificar cualquier campo después del error", async () => {
      sendNewL.mockRejectedValue(new Error("Server error"));
      const user = setup();
      await fillValidForm(user);

      await user.click(screen.getByRole("button", { name: "CREAR" }));
      expect(await screen.findByRole("alert")).toBeInTheDocument();

      await user.type(screen.getByLabelText("Nombre:"), " nuevo");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("modal de confirmación de liga creada", () => {
    const createLeague = async () => {
      const user = setup();
      await fillValidForm(user);
      await user.click(screen.getByRole("button", { name: "CREAR" }));
      await screen.findByText("Liga creada");
      return user;
    };

    it("Volver a la lista cierra el modal invocando onClose sin navegar", async () => {
      const user = await createLeague();

      await user.click(screen.getByRole("button", { name: "Volver a la lista" }));

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(navigate).not.toHaveBeenCalled();
    });

    it("Lobby cierra el modal y redirige a la ruta del lobby con el id de la liga", async () => {
      const user = await createLeague();

      await user.click(screen.getByRole("button", { name: "Lobby" }));

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(`/league/lobby/${LEAGUE_ID}`);
    });
  });
});

