import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CodeEditor } from './CodeEditor';

// Guardamos las props que recibe Monaco para poder revisarlas en cada test
let editorProps;

vi.mock('@monaco-editor/react', () => ({
  default: (props) => {
    editorProps = props;
    return <div data-testid="monaco-editor" />;
  },
}));

describe('CodeEditor Component', () => {
  beforeEach(() => {
    editorProps = null;
  });

  it('configura Monaco para Python con tema oscuro y el valor recibido', () => {
    render(<CodeEditor value="def play(): pass" />);

    expect(editorProps.language).toBe('python');
    expect(editorProps.theme).toBe('vs-dark');
    expect(editorProps.value).toBe('def play(): pass');
  });

  it('es editable por defecto (readOnly en false)', () => {
    render(<CodeEditor value="" />);

    expect(editorProps.options.readOnly).toBe(false);
  });

  it('pasa readOnly en true a Monaco cuando se indica', () => {
    render(<CodeEditor value="" readOnly />);

    expect(editorProps.options.readOnly).toBe(true);
  });

  it('llama a onChange con el nuevo código cuando Monaco cambia', () => {
    const mockOnChange = vi.fn();
    render(<CodeEditor value="" onChange={mockOnChange} />);

    editorProps.onChange('return wait()');

    expect(mockOnChange).toHaveBeenCalledWith('return wait()');
  });

  it('convierte undefined en string vacío al llamar a onChange', () => {
    const mockOnChange = vi.fn();
    render(<CodeEditor value="" onChange={mockOnChange} />);

    editorProps.onChange(undefined);

    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('no falla si Monaco cambia y no se pasó onChange', () => {
    render(<CodeEditor value="" readOnly />);

    expect(() => editorProps.onChange('x')).not.toThrow();
  });
});

