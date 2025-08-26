# shared-components

内置共享组件库，遵循 docs/frontend-spec-new.md 规范：
- 样式方案：CSS Modules（每个组件使用 *.module.css）
- 导入方式：推荐
  - 从包根入口：import { Button } from 'shared-components'
  - 或从组件聚合：import { Button } from '@shared/components'
- 类型与导出：每个组件目录提供 index.ts 导出组件与类型

目录结构示例
shared-components/
├─ components/
│  ├─ Button/
│  │  ├─ Button.tsx
│  │  ├─ Button.module.css
│  │  ├─ types.ts
│  │  └─ index.ts
│  └─ CopyrightInfo/
│     ├─ CopyrightInfo.tsx
│     ├─ CopyrightInfo.module.css
│     └─ index.ts (可选)
├─ hooks/            # 公共Hooks（可选）
├─ utils/            # 公共工具（已存在 index.ts）
├─ interfaces/       # 接口定义
├─ managers/         # 管理器
└─ index.ts          # 包根导出

使用示例
import { Button } from '@shared/components';
import { CopyrightInfo } from 'shared-components';

组件规范要点
- 组件样式统一通过 *.module.css 管理，TSX 中以 styles['class'] 方式引用
- Props 使用 interface 明确定义，导出类型供业务复用
- 组件应附带 README（见模板），并提供基础示例

维护建议
- 新组件请遵循上述结构并补充测试与文档
- 公共导出入口：组件聚合在 shared-components/components/index.ts，包根导出在 shared-components/index.ts