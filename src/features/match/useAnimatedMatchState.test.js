import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAnimatedMatchState } from "./useAnimatedMatchState.js";

describe("useAnimatedMatchState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("muestra el primer estado recibido sin animación", () => {
    const estado = {
      actual_tic: 10,
      total_tic: 600,
      user1_goals: 0,
      user2_goals: 0,
      ball: {
        x: 10,
        y: 5,
        speed_x: 1,
        speed_y: 0,
      },
      players: [
        {
          player_id: 1,
          x: 5,
          y: 5,
          is_on_field: true,
          team: "A",
        },
      ],
    };

    const { result } = renderHook(() =>
      useAnimatedMatchState(estado)
    );

    expect(result.current).toEqual(estado);
  });

  it("anima la posición de la pelota entre dos estados", () => {
    const estadoInicial = {
      actual_tic: 10,
      total_tic: 600,
      user1_goals: 0,
      user2_goals: 0,
      ball: {
        x: 10,
        y: 5,
        speed_x: 1,
        speed_y: 0,
      },
      players: [],
    };

    const estadoFinal = {
      ...estadoInicial,
      actual_tic: 11,
      ball: {
        x: 20,
        y: 5,
        speed_x: 1,
        speed_y: 0,
      },
    };

    const { result, rerender } = renderHook(
      ({ estado }) => useAnimatedMatchState(estado),
      {
        initialProps: {
          estado: estadoInicial,
        },
      }
    );

    expect(result.current.ball.x).toBe(10);

    rerender({ estado: estadoFinal });

    act(() => {
      vi.mocked(performance.now).mockReturnValue(50);
      vi.advanceTimersByTime(16);
    });

    expect(result.current.ball.x).toBeCloseTo(15);
    expect(result.current.ball.y).toBe(5);

    act(() => {
      vi.mocked(performance.now).mockReturnValue(100);
      vi.advanceTimersByTime(16);
    });

    expect(result.current.ball.x).toBe(20);
  });

  it("anima la posición de los jugadores entre dos estados", () => {
    const estadoInicial = {
      actual_tic: 10,
      total_tic: 600,
      user1_goals: 0,
      user2_goals: 0,
      ball: {
        x: 10,
        y: 5,
        speed_x: 1,
        speed_y: 0,
      },
      players: [
        {
          player_id: 1,
          x: 5,
          y: 5,
          is_on_field: true,
          team: "A",
        },
      ],
    };

    const estadoFinal = {
      ...estadoInicial,
      actual_tic: 11,
      players: [
        {
          player_id: 1,
          x: 15,
          y: 15,
          is_on_field: true,
          team: "A",
        },
      ],
    };

    const { result, rerender } = renderHook(
      ({ estado }) => useAnimatedMatchState(estado),
      {
        initialProps: {
          estado: estadoInicial,
        },
      }
    );

    rerender({ estado: estadoFinal });

    act(() => {
      vi.mocked(performance.now).mockReturnValue(50);
      vi.advanceTimersByTime(16);
    });

    expect(result.current.players[0].x).toBeCloseTo(10);
    expect(result.current.players[0].y).toBeCloseTo(10);

    act(() => {
      vi.mocked(performance.now).mockReturnValue(100);
      vi.advanceTimersByTime(16);
    });

    expect(result.current.players[0].x).toBe(15);
    expect(result.current.players[0].y).toBe(15);
  });

  it("llega al estado objetivo después de 100 ms", () => {
    const estadoInicial = {
      actual_tic: 10,
      total_tic: 600,
      user1_goals: 0,
      user2_goals: 0,
      ball: {
        x: 10,
        y: 5,
        speed_x: 1,
        speed_y: 0,
      },
      players: [],
    };

    const estadoFinal = {
      ...estadoInicial,
      actual_tic: 11,
      user1_goals: 1,
      ball: {
        x: 20,
        y: 10,
        speed_x: 1,
        speed_y: 0,
      },
    };

    const { result, rerender } = renderHook(
      ({ estado }) => useAnimatedMatchState(estado),
      {
        initialProps: {
          estado: estadoInicial,
        },
      }
    );

    rerender({ estado: estadoFinal });

    act(() => {
      vi.mocked(performance.now).mockReturnValue(100);
      vi.advanceTimersByTime(16);
    });

    expect(result.current).toEqual(estadoFinal);
  });

  it("continúa suavemente si llega un nuevo estado antes de terminar la animación anterior", () => {
    const estado1 = {
        actual_tic: 10, total_tic: 600, user1_goals: 0, user2_goals: 0,
        ball: { x: 0, y: 0, speed_x: 0, speed_y: 0 },
        players: [],
    }
    const estado2 = {
        ...estado1,
        actual_tic: 11,
        ball: { x: 100, y: 0, speed_x: 0, speed_y: 0 },
    }
    const estado3 = {
        ...estado1,
        actual_tic: 12,
        ball: { x: 200, y: 0, speed_x: 0, speed_y: 0 },
    }

    const { result, rerender } = renderHook(
        ({ estado }) => useAnimatedMatchState(estado),
        { initialProps: { estado: estado1 } }
    )

    rerender({ estado: estado2 })

    act(() => {
        vi.mocked(performance.now).mockReturnValue(50)
        vi.advanceTimersByTime(16)
    })

    expect(result.current.ball.x).toBeCloseTo(50) // a mitad de camino entre 0 y 100

    // llega un estado nuevo ANTES de terminar la interpolación anterior
    rerender({ estado: estado3 })

    act(() => {
        vi.mocked(performance.now).mockReturnValue(100)
        vi.advanceTimersByTime(16)
    })

    // debería interpolar desde ~50 (donde se interrumpió) hacia 200, no desde 100 ni desde 0
    expect(result.current.ball.x).toBeGreaterThan(50)
    expect(result.current.ball.x).toBeLessThan(200)
    })

});