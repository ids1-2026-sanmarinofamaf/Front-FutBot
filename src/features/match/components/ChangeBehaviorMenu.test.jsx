import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ChangeBehaviorMenu } from "./ChangeBehaviorMenu";

describe("ChangeBehaviorMenu", () => {
  const targetPlayer = {
    player_id: 1,
    name: "Lionel",
    number: 1,
    currentBehaviorId: null,
  };

  const sampleBehaviors = [
    { behavior_id: 1, name: "Default", is_default: true },
    { behavior_id: 2, name: "Presión Alta", is_default: false },
    { behavior_id: 3, name: "Contraataque", is_default: false },
  ];

  it("no renderiza nada cuando player es null", () => {
    const { container } = render(
      <ChangeBehaviorMenu
        player={null}
        behaviors={sampleBehaviors}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("muestra el nombre y el número del jugador objetivo", () => {
    render(
      <ChangeBehaviorMenu
        player={targetPlayer}
        behaviors={sampleBehaviors}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Cambiar comportamiento" })
    ).toBeInTheDocument();
    expect(screen.getByText("Lionel")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
  });

  it("muestra el estado de carga y deshabilita Confirmar mientras isLoading es true", () => {
    render(
      <ChangeBehaviorMenu
        player={targetPlayer}
        behaviors={[]}
        isLoading={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(
      screen.getByText("Cargando comportamientos...")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirmar" })
    ).toBeDisabled();
  });

  it("muestra mensaje cuando no hay comportamientos disponibles", () => {
    render(
      <ChangeBehaviorMenu
        player={targetPlayer}
        behaviors={[]}
        isLoading={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(
      screen.getByText("No hay comportamientos disponibles.")
    ).toBeInTheDocument();
  });

  it("lista los comportamientos creados por el usuario y los por defecto", () => {
    render(
      <ChangeBehaviorMenu
        player={targetPlayer}
        behaviors={sampleBehaviors}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);

    expect(screen.getByText("Default")).toBeInTheDocument();
    expect(screen.getByText("Presión Alta")).toBeInTheDocument();
    expect(screen.getByText("Contraataque")).toBeInTheDocument();
    expect(screen.getByText("Por defecto")).toBeInTheDocument();
    expect(screen.getAllByText("Personalizado")).toHaveLength(2);
  });

  it("permite seleccionar un comportamiento y confirmar el cambio", () => {
    const onConfirm = vi.fn();

    render(
      <ChangeBehaviorMenu
        player={targetPlayer}
        behaviors={sampleBehaviors}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );

    const confirmBtn = screen.getByRole("button", { name: "Confirmar" });
    expect(confirmBtn).toBeDisabled();

    const optionPresion = screen.getByRole("option", { name: /Presión Alta/i });
    fireEvent.click(optionPresion);

    expect(optionPresion).toHaveAttribute("aria-selected", "true");
    expect(confirmBtn).not.toBeDisabled();

    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith(2);
  });

  it("preselecciona currentBehaviorId si el jugador ya tiene uno conocido", () => {
    const onConfirm = vi.fn();

    render(
      <ChangeBehaviorMenu
        player={{ ...targetPlayer, currentBehaviorId: 3 }}
        behaviors={sampleBehaviors}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );

    const optionContra = screen.getByRole("option", { name: /Contraataque/i });
    expect(optionContra).toHaveAttribute("aria-selected", "true");

    const confirmBtn = screen.getByRole("button", { name: "Confirmar" });
    expect(confirmBtn).not.toBeDisabled();

    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledWith(3);
  });

  it("llama a onCancel al presionar el botón Cancelar", () => {
    const onCancel = vi.fn();

    render(
      <ChangeBehaviorMenu
        player={targetPlayer}
        behaviors={sampleBehaviors}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("muestra alerta de error y bloquea botones cuando isSubmitting es true", () => {
    render(
      <ChangeBehaviorMenu
        player={{ ...targetPlayer, currentBehaviorId: 1 }}
        behaviors={sampleBehaviors}
        isSubmitting={true}
        error="No se pudo cambiar el comportamiento"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No se pudo cambiar el comportamiento"
    );
    expect(
      screen.getByRole("button", { name: "Guardando..." })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Cancelar" })
    ).toBeDisabled();
  });
});

