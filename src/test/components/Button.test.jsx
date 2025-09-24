import { describe, expect, it, vi } from 'vitest';

import Button from '../../components/ui/Button';
import { renderWithProviders, userEvent } from '../utils/test-utils';

describe('Button Component', () => {
  it('renders with default props', () => {
    const { getByRole } = renderWithProviders(<Button>Click me</Button>);
    const button = getByRole('button');

    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
    expect(button).not.toBeDisabled();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    const { getByRole } = renderWithProviders(
      <Button onClick={handleClick}>Click me</Button>
    );

    const button = getByRole('button');
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    const { getByRole } = renderWithProviders(
      <Button loading>Loading...</Button>
    );

    const button = getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('applies variant styles', () => {
    const { getByRole } = renderWithProviders(
      <Button variant="primary">Primary Button</Button>
    );

    const button = getByRole('button');
    expect(button).toHaveClass('bg-amber-600');
  });

  it('handles disabled state', () => {
    const handleClick = vi.fn();
    const { getByRole } = renderWithProviders(
      <Button disabled onClick={handleClick}>Disabled</Button>
    );

    const button = getByRole('button');
    expect(button).toBeDisabled();
  });

  it('renders with icon', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;

    const { getByTestId } = renderWithProviders(
      <Button>
        <TestIcon />
        Button with icon
      </Button>
    );

    expect(getByTestId('test-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { getByRole } = renderWithProviders(
      <Button className="custom-class">Custom</Button>
    );

    const button = getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('supports different sizes', () => {
    const { getByRole } = renderWithProviders(
      <Button size="lg">Large Button</Button>
    );

    const button = getByRole('button');
    // Large size uses px-8 py-4 for touch optimization
    expect(button).toHaveClass('px-8', 'py-4');
  });

  it('supports keyboard navigation', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    const { getByRole } = renderWithProviders(
      <Button onClick={handleClick}>Keyboard Test</Button>
    );

    const button = getByRole('button');
    button.focus();

    expect(button).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);

    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('prevents click when loading', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    const { getByRole } = renderWithProviders(
      <Button loading onClick={handleClick}>Loading Button</Button>
    );

    const button = getByRole('button');
    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    const { getByRole } = renderWithProviders(
      <Button ariaLabel="Custom aria label">Accessible Button</Button>
    );

    const button = getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Custom aria label');
  });
});
