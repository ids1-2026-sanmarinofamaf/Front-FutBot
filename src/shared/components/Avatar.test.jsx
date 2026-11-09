import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Avatar } from "./Avatar"

describe("Avatar", () => {
  it("renderiza una imagen con el nombre como alt", () => {
    render(<Avatar avatar="abc123" name="Luca" />)
    expect(screen.getByRole("img", { name: "Luca" })).toBeInTheDocument()
  })

  it("usa el avatar en base64 cuando se recibe uno", () => {
    render(<Avatar avatar="abc123" name="Luca" />)
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "data:image/png;base64,abc123"
    )
  })

  it("aplica las clases de estilo esperadas", () => {
    render(<Avatar avatar="YWJj" name="Luca" />)
    expect(screen.getByRole("img")).toHaveClass(
      "w-12",
      "h-12",
      "rounded-full",
      "object-cover"
    )
  })
  it("permite reemplazar el tamaño conservando los estilos y el avatar recibido", () => {
    render(<Avatar avatar="YWJj" name="Club" className="w-28 h-28" />)
    expect(screen.getByRole('img')).toHaveClass('w-28', 'h-28', 'rounded-full')
    expect(screen.getByRole('img')).not.toHaveClass('w-12', 'h-12')
    expect(screen.getByRole('img')).toHaveAttribute('src', 'data:image/png;base64,YWJj')
  })

})