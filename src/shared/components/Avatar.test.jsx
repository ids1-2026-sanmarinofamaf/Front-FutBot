import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Avatar } from "./Avatar"

describe("Avatar", () => {
  it("renderiza una imagen con el nombre como alt", () => {
    render(<Avatar avatar="abc123" name="Luca" clubId={1} />)
    expect(screen.getByRole("img", { name: "Luca" })).toBeInTheDocument()
  })

  it("usa el avatar en base64 cuando se recibe uno", () => {
    render(<Avatar avatar="abc123" name="Luca" clubId={1} />)
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "data:image/png;base64,abc123"
    )
  })

  it.each([["default"], [""], [null], [undefined]])(
    "usa un avatar por defecto cuando avatar es %p",
    (avatar) => {
      render(<Avatar avatar={avatar} name="Luca" clubId={1} />)
      expect(screen.getByRole("img")).toHaveAttribute(
        "src",
        "/assets/defaultAvatars/2.png"
      )
    }
  )

  it.each([
    [0, 1],
    [1, 2],
    [5, 6],
    [6, 1], // da la vuelta
    [13, 2],
  ])("clubId %i elige el avatar por defecto %i", (clubId, expected) => {
    render(<Avatar avatar="default" name="Luca" clubId={clubId} />)
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      `/assets/defaultAvatars/${expected}.png`
    )
  })

  it("nunca elige un índice fuera del rango 1..6", () => {
    for (let clubId = 0; clubId < 100; clubId++) {
      const { unmount } = render(
        <Avatar avatar="default" name="x" clubId={clubId} />
      )
      const n = Number(
        screen.getByRole("img").getAttribute("src").match(/(\d+)\.png$/)[1]
      )
      expect(n).toBeGreaterThanOrEqual(1)
      expect(n).toBeLessThanOrEqual(6)
      unmount()
    }
  })

  it("aplica las clases de estilo esperadas", () => {
    render(<Avatar avatar="default" name="Luca" clubId={1} />)
    expect(screen.getByRole("img")).toHaveClass(
      "w-12",
      "h-12",
      "rounded-full",
      "object-cover"
    )
  })
})