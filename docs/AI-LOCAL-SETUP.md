# MyPT 本机 AI 体验

本分支保留上游 MIT 许可。默认界面已支持简体中文，包含饮食、训练、统计、个人资料和 AI 管家；保留英文/土耳其语切换。

## 首次安装

1. `npm ci`
2. 在忽略的 `.env.local` 设置：
   - `AUTH_SECRET`：用 `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` 在本机生成。
   - `AUTH_URL=http://localhost:4000`
   - `AUTH_TRUST_HOST=true`
   - `MYPT_LOCAL_MODE=1`
   - `TURSO_DATABASE_URL=file:local.db`
3. `npm run db:push`
4. `node --import tsx src/db/seed-exercises.ts`
5. `npm run dev`，访问 http://localhost:4000/zh/signin，点击“进入本机体验”。
6. 在连接页输入火山方舟新 API Key 和已开通的 model ID，点击“测试并保存”。只在模型实际返回非空回答后保存。

密钥存放在忽略的 `.local-ai.json`，权限 0600。数据库和 `.env.local` 同样不提交。不要把这些文件上传。

## 接入说明

- 固定使用 `https://ark.cn-beijing.volces.com/api/v3`，模型 ID 由用户从控制台复制，不假定每个账号都开通同一模型。
- 服务端使用 OpenAI 兼容 SDK，聊天、文字饮食解析和训练建议共用配置；改配置后无需重启。
- 测试连接会发送一句不含个人记录的测试消息并产生少量费用。实际教练对话会向所选模型发送当前消息、最近 10 条聊天、个人档案、当天饮食汇总和最近 3 次训练。
- 官方接口文档：https://docs.volcengine.com/docs/ark/chat-api
- 未配置有效密钥时不会生成模拟回复。照片识别和长期偏好记忆尚未实现。

## 边界与验证

本机入口仅在 NODE_ENV=development 且 MYPT_LOCAL_MODE=1 时启用。开发服务绑定 127.0.0.1:4000。不得通过隧道或反向代理公开此模式。生产环境默认使用原版 Google 登录和数据库会话；开启内测模式时使用独立邀请码登录（详见 BETA-DEPLOYMENT.md）；AI 可通过 AI_API_KEY、AI_BASE_URL、AI_MODEL 配置。

`node --import tsx --test tests/ai-local.test.ts` 检查本机/同源限制、生产模式禁用以及错误脱敏；`npx tsc --noEmit` 检查类型；`npm run build` 检查构建。

2026-10-22 已升级 Next.js 及相关依赖，生产依赖审计为 0 项漏洞；开发依赖仍有审计项，未进行强制降级。真实模型联调需要有效密钥。
