# 项目：网页对话框接入 Claude

一个带聊天对话框的网页应用。用户在网页上输入消息，后端调用 Anthropic 的
Claude API 生成回复并返回前端显示。这是一个个人学习项目，作者是 Python 初学者，
请优先保证代码清晰易懂、注释到位，避免过度抽象。

## 技术栈

- 后端：Python + Flask
- 前端：原生 HTML / CSS / JavaScript（不引入前端框架）
- AI：Anthropic Python SDK（`anthropic` 包），Messages API
- 依赖管理：requirements.txt

## 推荐项目结构

```
.
├── app.py              # Flask 后端：路由 + 调用 Claude
├── templates/
│   └── index.html      # 聊天界面
├── static/
│   ├── style.css
│   └── chat.js         # 前端逻辑：收发消息、维护对话历史
├── requirements.txt
├── .env                # 存放 ANTHROPIC_API_KEY（绝不提交 git）
├── .gitignore
└── README.md
```

## 架构与数据流

浏览器 → Flask 后端(`/chat`) → Anthropic API → Claude → 原路返回

- 前端维护整段对话历史（messages 数组），每次请求把完整历史发给后端，
  这样 Claude 才能记住上下文。
- 后端拿到 messages 后原样转发给 `client.messages.create(...)`。

## 安全要求（最重要，务必遵守）

- **API key 只能存在于后端**，从环境变量 / `.env` 读取，绝不写进任何前端代码或 HTML。
- **`.env` 必须加入 `.gitignore`**，绝不把真实 key 提交到版本库。
- 前端只跟本项目自己的 `/chat` 接口通信，永远不直接调用 Anthropic API。
- 提供 `.env.example` 作为模板（不含真实 key）。

## Anthropic SDK 用法要点

- 初始化：`client = anthropic.Anthropic(api_key=...)`
- 调用：`client.messages.create(model=..., max_tokens=..., system=..., messages=[...])`
- `max_tokens` 是必填项。
- 默认模型用 `claude-sonnet-4-6`（性价比、速度好）；如需更强能力可换 `claude-opus-4-8`。
  模型名集中放在一个常量里，方便修改。
- 返回的 `response.content` 是内容块列表，取文本要遍历拼接 `block.text`（`block.type == "text"`）。
- 用 try/except 包裹 API 调用，出错时返回明确的错误信息，方便调试。

## 命令

```bash
poetry install        # 安装依赖（首次或 pyproject.toml 变更后）
poetry run python app.py   # 本地启动，默认 http://localhost:5000
```

## 代码风格

- 关键逻辑写清晰的中文注释，解释「为什么」而不只是「做什么」。
- 函数保持短小、单一职责。
- 不要过度工程化：不引入数据库、用户系统、复杂状态管理，除非我明确要求。
- 前端不引入构建工具或框架，保持纯静态文件能直接运行。

## 注意事项

- Flask 自带服务器（`app.run`）仅用于本地开发，不要当成生产部署方案。
  生产部署的事等我明确提出再处理（届时用 gunicorn 等）。
- 当前先实现「整段回复一次性返回」的基础版本。
- 流式输出（逐字打字效果，`client.messages.stream` + SSE）是后续可选增强，
  没有我的明确要求时不要先实现。

## 做这些之前先问我

- 引入任何新的依赖、框架或外部服务
- 改动项目结构
- 任何涉及部署、付费、密钥配置的操作
