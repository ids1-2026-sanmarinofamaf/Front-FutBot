import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FGCard } from "./FGCard";
import { joinFGAsPlayer } from "../api";

const navigate = vi.fn();
const joinFG = vi.fn();
const showToast = vi.fn();
const hideToast = vi.fn();
const socketState = { joinedFGIds: [] };

vi.mock("react-router-dom", () => ({
    useNavigate: () => navigate,
}));

vi.mock("../api", () => ({
    joinFGAsPlayer: vi.fn(),
}));

vi.mock("../FriendlyGamesProvider", () => ({
    useFriendlyGamesSocket: () => ({
        joinFG,
        joinedFGIds: socketState.joinedFGIds,
    }),
}));

vi.mock("../../../shared/hooks", () => ({
    useToast: () => ({
        toast: { id: 1 },
        showToast,
        hideToast,
    }),
}));

const game = {
    friendly_game_id: 4,
    creator_club_name: "Club de prueba",
    current_participants: 1,
    capacity: 6,
    state: "waiting",
};

const roster = {
    formation: "offensive",
    players: Array.from({ length: 6 }, (_, index) => ({ player_id: index + 1 })),
};

const renderCard = (currentRoster = roster) =>
    render(<FGCard game={game} roster={currentRoster} />);

beforeEach(() => {
    vi.clearAllMocks();
    socketState.joinedFGIds = [];
    joinFGAsPlayer.mockResolvedValue({});
});

afterEach(cleanup);

describe("FGCard", () => {
    it("deshabilita Unirse si la plantilla es null", () => {
        renderCard(null);

        expect(screen.getByRole("button", { name: "Unirse" })).toBeDisabled();
    });

    it("permite unirse y abre el socket después de una respuesta exitosa", async () => {
        const user = userEvent.setup();
        renderCard();

        await user.click(screen.getByRole("button", { name: "Unirse" }));

        expect(joinFGAsPlayer).toHaveBeenCalledWith(game.friendly_game_id, roster);
        expect(joinFG).toHaveBeenCalledWith(game.friendly_game_id);
        expect(screen.getByRole("alert")).toHaveTextContent("Ya puedes ir al lobby");
    });

    it("recupera la participación existente y notifica que puede entrar al lobby", async () => {
        const user = userEvent.setup();
        const error = new Error("ya participa");
        error.code = "ALREADY_PARTICIPATING";
        joinFGAsPlayer.mockRejectedValue(error);
        renderCard();

        await user.click(screen.getByRole("button", { name: "Unirse" }));

        expect(joinFG).toHaveBeenCalledWith(game.friendly_game_id);
        expect(screen.getByRole("alert")).toHaveTextContent("Ya participabas, puedes ir al lobby");
    });

    it("navega al lobby si el usuario ya está unido", async () => {
        const user = userEvent.setup();
        socketState.joinedFGIds = [game.friendly_game_id];
        render(<FGCard game={game} roster={roster} />);
        await user.click(screen.getByRole("button", { name: "Entrar al lobby" }));

        expect(navigate).toHaveBeenCalledWith(`/friendly/lobby/${game.friendly_game_id}`);
        expect(joinFGAsPlayer).not.toHaveBeenCalled();
    });
});
