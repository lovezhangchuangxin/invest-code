# 🎮 Invest-Code - 编程投资游戏

一个基于代码策略的实时投资游戏，玩家通过编写JavaScript代码来实现自动化投资策略，在虚拟市场中竞争获得最高收益。

## ✨ 项目特色

- 🚀 **实时游戏** - 基于WebSocket的实时游戏体验
- 💻 **代码策略** - 使用JavaScript编写投资策略
- 🏆 **排行榜系统** - 实时显示玩家收益排名
- 🎯 **概率投资** - 基于加权随机的投资回报机制
- 🔒 **沙箱执行** - 安全的代码执行环境
- 📊 **数据可视化** - 实时显示投资结果和收益

## 🎯 游戏规则

### 核心机制
- 每个tick（游戏周期）玩家可以投资一定金额
- 投资回报率通过加权随机算法计算（0-10倍）
- 期望收益率约为1.002倍，长期来看略有盈利
- 玩家通过编写`run()`函数返回投资金额

### API接口
游戏为玩家提供以下API：
- `getTick()` - 获取当前游戏周期
- `getGold()` - 获取当前金币数量
- `getConfig()` - 获取概率配置表
- `getMyHistory()` - 获取个人投资历史

### 示例策略
```javascript
function run() {
    const gold = getGold();
    const tick = getTick();
    
    // 简单策略：每次投资10%的金币
    return Math.floor(gold * 0.1);
}
```

## 🛠️ 技术栈

### 前端
- **Vue 3** - 现代化前端框架
- **TypeScript** - 类型安全的JavaScript
- **Element Plus** - UI组件库
- **Monaco Editor** - 代码编辑器
- **Socket.IO Client** - 实时通信
- **Splitpanes** - 可分割面板布局

### 后端
- **Node.js** - 服务器运行环境
- **Koa.js** - Web应用框架
- **TypeScript** - 类型安全的JavaScript
- **Socket.IO** - 实时通信
- **isolated-vm** - 安全的代码沙箱
- **JWT** - 用户认证
- **bcryptjs** - 密码加密

## 📦 项目结构

```
invest-code/
├── packages/
│   ├── frontend/          # Vue3前端应用
│   │   ├── src/
│   │   │   ├── components/ # 组件
│   │   │   ├── pages/     # 页面
│   │   │   ├── api/       # API接口
│   │   │   └── store/     # 状态管理
│   │   └── package.json
│   └── backend/           # Node.js后端服务
│       ├── src/
│       │   ├── app/       # 应用配置
│       │   ├── controller/ # 控制器
│       │   ├── service/   # 业务逻辑
│       │   ├── core/      # 游戏核心
│       │   └── socket/    # WebSocket处理
│       └── package.json
├── config/               # 配置文件
└── package.json          # 根包配置
```

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- pnpm >= 8.0.0

### 安装依赖
```bash
# 安装根依赖
pnpm install

# 安装所有子包依赖
pnpm install --recursive
```

### 环境配置
在 `config/env/` 目录下创建 `.env` 文件：

```env
# JWT密钥
JWT_SECRET=your_jwt_secret

# 游戏配置
GAME_TICK=1000
GAME_MAX_INVEST=100000000
CODE_TIME_LIMIT=20
CODE_MEMORY_LIMIT=32

# 邮件配置（可选）
MAIL_USERNAME=your_email@example.com
MAIL_PASSWORD=your_email_password
```

### 启动项目
```bash
# 启动后端服务
pnpm dev:back

# 启动前端服务（新终端）
pnpm dev:front
```

### 访问应用
- 前端地址：http://localhost:5173
- 后端API：http://localhost:3000

## 🎮 游戏玩法

1. **注册/登录** - 创建账户或登录现有账户
2. **编写策略** - 在代码编辑器中编写投资策略
3. **保存代码** - 点击保存按钮上传策略
4. **观察结果** - 实时查看投资结果和收益
5. **优化策略** - 根据历史数据优化投资策略
6. **竞争排名** - 在排行榜中与其他玩家竞争

## 🔧 开发说明

### 代码沙箱
- 使用 `isolated-vm` 确保代码执行安全
- 限制执行时间和内存使用
- 提供有限的API接口

### 数据持久化
- 游戏数据存储在 `packages/backend/data/game-data.json`
- 支持数据重置功能

### 实时通信
- 基于Socket.IO实现实时数据推送
- 支持tick更新、排行榜更新等事件

## 📈 游戏平衡性

### 概率分布
- 0.0-0.5倍：39%权重（亏损）
- 0.5-1.0倍：29%权重（小幅亏损）
- 1.0-1.5倍：28%权重（小幅盈利）
- 1.5-2.5倍：11%权重（中等盈利）
- 2.5-5.0倍：5%权重（高盈利）
- 5.0-7.5倍：1%权重（超高盈利）

### 平衡机制
- 期望收益率：1.002倍
- 最大单次投资：1亿金币
- 金币自然增长：低金币时自动增长

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开Pull Request

## 📄 许可证

本项目采用 ISC 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

---

⭐ 如果这个项目对你有帮助，请给它一个星标！