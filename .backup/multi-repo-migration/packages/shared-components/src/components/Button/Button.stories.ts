import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { ButtonVariant, ButtonSize } from './types';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '基础按钮组件，支持多种变体、尺寸和状态。',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger'] as ButtonVariant[],
      description: '按钮变体样式',
      table: {
        defaultValue: { summary: 'primary' },
        type: { summary:极速赛车开奖直播历史记录 },
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'] as ButtonSize[],
      description: '按钮尺寸',
      table: {
        defaultValue: { summary: 'md' },
        type: { summary: 'ButtonSize' },
      },
    },
    disabled: {
      control: 'boolean',
      description: '禁用状态',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    loading: {
      control: 'boolean',
      description: '加载状态',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    children: {
      control: 'text',
      description: '按钮文本内容',
    },
    onClick: {
      action: 'clicked',
      description: '点击事件回调',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof Button>;

// 基础按钮示例
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Danger Button',
  },
};

// 尺寸示例
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    children: 'Medium Button',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
    children: 'Extra Large Button',
  },
};

// 状态示例
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading Button',
  },
};

// 组合示例
export const PrimaryLarge极速赛车开奖直播历史记录 Story = {
  args: {
    variant: 'primary',
    size: 'lg',
    children: 'Primary Large Button',
  },
};

export const OutlineSmall: Story = {
  args: {
    variant: 'outline',
    size: 'sm',
    children: 'Outline Small Button',
  },
};

// 交互示例
export const WithClickHandler: Story = {
  args: {
    children: 'Click Me',
    onClick: () => console.log('Button clicked!'),
  },
};

// 完整配置示例
export const FullFeatured: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    disabled: false,
    loading: false,
    children: 'Complete Button',
    className: 'custom-button-class',
    onClick: () => alert('Button clicked!'),
  },
};
