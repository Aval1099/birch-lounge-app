import Button from './Button';
import { Plus, Save, Trash2 } from 'lucide-react';

export default {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component with multiple variants, sizes, and states.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
      description: 'Visual style variant of the button',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the button',
    },
    loading: {
      control: 'boolean',
      description: 'Shows loading spinner and disables button',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button',
    },
    children: {
      control: 'text',
      description: 'Button content',
    },
  },
};

export const Default = {
  args: {
    children: 'Default Button',
  },
};

export const Primary = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Ghost = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

export const Danger = {
  args: {
    variant: 'danger',
    children: 'Danger Button',
  },
};

export const WithIcon = {
  args: {
    variant: 'primary',
    children: (
      <>
        <Plus className="w-4 h-4" />
        Add Item
      </>
    ),
  },
};

export const Loading = {
  args: {
    variant: 'primary',
    loading: true,
    children: 'Loading...',
  },
};

export const Disabled = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

export const Sizes = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const AllVariants = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="primary" disabled>Primary Disabled</Button>
        <Button variant="secondary" loading>Secondary Loading</Button>
        <Button variant="ghost">
          <Save className="w-4 h-4" />
          With Icon
        </Button>
        <Button variant="danger">
          <Trash2 className="w-4 h-4" />
          Delete
        </Button>
      </div>
    </div>
  ),
};
