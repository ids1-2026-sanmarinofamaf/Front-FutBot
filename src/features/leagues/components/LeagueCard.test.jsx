import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LeagueCard } from "./LeagueCard";

describe("LeagueCard", () => {
  const defaultLeague = {
    league_id: 1,
    name: "Liga Test",
    current_participants: 3,
    capacity: 8,
    privacy: "PUBLICA",
    state: "POR_COMENZAR",
  };

  it("renderiza los datos de la liga", () => {
    render(<LeagueCard league={defaultLeague} />);
    expect(screen.getByText("Liga Test")).toBeInTheDocument();
    expect(screen.getByText(/Usuarios: 3 de 8/i)).toBeInTheDocument();
    expect(screen.getByText(/Privacidad: Pública/i)).toBeInTheDocument();
    expect(screen.getByText(/estado: POR_COMENZAR/i)).toBeInTheDocument();
  });

  it("muestra la privacidad PRIVADA", () => {
    render(<LeagueCard league={{ ...defaultLeague, privacy: "PRIVADA" }} />);
    expect(screen.getByText(/Privacidad: Privada/i)).toBeInTheDocument();
  });

  it("muestra los botones Unirse y Ver", () => {
    render(<LeagueCard league={defaultLeague} />);
    expect(screen.getByRole("button", { name: "Unirse" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Ver" })).toBeEnabled();
  });

  it("deshabilita Unirse si la liga está llena, pero permite Ver", () => {
    render(<LeagueCard league={{ ...defaultLeague, current_participants: 8 }} />);
    expect(screen.getByRole("button", { name: "Unirse" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Ver" })).toBeEnabled();
  });

  it("deshabilita Unirse si la liga ya está JUGANDO, pero permite Ver", () => {
    render(<LeagueCard league={{ ...defaultLeague, state: "JUGANDO" }} />);
    expect(screen.getByRole("button", { name: "Unirse" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Ver" })).toBeEnabled();
  });

  it("invoca onJoin y onView con la liga", () => {
    const onJoin = vi.fn();
    const onView = vi.fn();
    render(<LeagueCard league={defaultLeague} onJoin={onJoin} onView={onView} />);

    fireEvent.click(screen.getByRole("button", { name: "Unirse" }));
    fireEvent.click(screen.getByRole("button", { name: "Ver" }));

    expect(onJoin).toHaveBeenCalledWith(defaultLeague);
    expect(onView).toHaveBeenCalledWith(defaultLeague);
  });

  it("no falla al hacer click sin callbacks", () => {
    render(<LeagueCard league={defaultLeague} />);
    fireEvent.click(screen.getByRole("button", { name: "Unirse" }));
    fireEvent.click(screen.getByRole("button", { name: "Ver" }));
  });
});

