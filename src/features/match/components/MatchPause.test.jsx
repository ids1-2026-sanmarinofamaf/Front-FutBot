import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, act, cleanup } from "@testing-library/react"
import { MatchPause } from "./MatchPause"

describe("MatchPause", () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it("no muestra nada cuando no hay una pausa activa", () => {
    const { container } = render(<MatchPause pausa={null} />)

    expect(container.firstChild).toBeNull()
  })

  it("muestra COOLING BREAK durante una pausa de hidratación", () => {
    render(
      <MatchPause
        pausa={{ pause_type: "hydration", duration: 10 }}
      />
    )

    expect(screen.getByText("COOLING BREAK")).toBeInTheDocument()
    expect(screen.queryByText("ENTRETIEMPO")).not.toBeInTheDocument()
    expect(document.querySelector("video")).not.toBeInTheDocument()
  })

  it("muestra ENTRETIEMPO y reproduce el video durante el entretiempo", () => {
    render(
      <MatchPause
        pausa={{ pause_type: "halftime", duration: 20 }}
      />
    )

    const video = document.querySelector("video")

    expect(screen.getByText("ENTRETIEMPO")).toBeInTheDocument()
    expect(video).toBeInTheDocument()
    expect(video).toHaveAttribute(
      "src",
      "/assets/propaganda_san_marino.mp4"
    )
    expect(video).toHaveAttribute("autoplay")
    expect(video.muted).toBe(true)
    expect(video).toHaveAttribute("playsinline")
  })

  it("oculta el video después de 5 segundos y mantiene ENTRETIEMPO", () => {
    vi.useFakeTimers()

    render(
      <MatchPause
        pausa={{ pause_type: "halftime", duration: 20 }}
      />
    )

    expect(document.querySelector("video")).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(document.querySelector("video")).not.toBeInTheDocument()
    expect(screen.getByText("ENTRETIEMPO")).toBeInTheDocument()
  })

  it("oculta el contenido cuando termina la pausa", () => {
    const { rerender } = render(
      <MatchPause
        pausa={{ pause_type: "hydration", duration: 10 }}
      />
    )

    expect(screen.getByText("COOLING BREAK")).toBeInTheDocument()

    rerender(<MatchPause pausa={null} />)

    expect(screen.queryByText("COOLING BREAK")).not.toBeInTheDocument()
  })

  it("no muestra contenido para un tipo de pausa desconocido", () => {
    const { container } = render(
      <MatchPause pausa={{ pause_type: "unknown" }} />
    )

    expect(container.firstChild).toBeNull()
  })

  it("reinicia el temporizador si cambia la pausa de entretiempo", () => {
    vi.useFakeTimers()

    const { rerender } = render(
      <MatchPause
        pausa={{ pause_type: "halftime", duration: 20 }}
      />
    )

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    rerender(
      <MatchPause
        pausa={{ pause_type: "halftime", duration: 20 }}
      />
    )

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(document.querySelector("video")).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(document.querySelector("video")).not.toBeInTheDocument()
    expect(screen.getByText("ENTRETIEMPO")).toBeInTheDocument()
  })
})
