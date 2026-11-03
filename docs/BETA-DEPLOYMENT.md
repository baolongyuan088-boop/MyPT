# 单朋友内测部署准备

当前代码支持独立邀请码身份；并未因此自动完成部署。需要明确服务器/平台和管理员授权。

## 部署参数

- NODE_ENV=production
- MYPT_LOCAL_MODE=0（不能对外运行本机入口）
- MYPT_BETA_MODE=1
- AUTH_SECRET：新生成的线上随机密钥，不与本机共用
- AUTH_URL：实际 HTTPS 内测域名
- AUTH_TRUST_HOST=true：仅在受信任的反向代理后使用
- TURSO_DATABASE_URL：线上独立数据库。持久化 Node 服务器可使用 file:/持久目录/mypt.db；无持久磁盘的平台必须使用远程 libSQL/Turso，不能使用临时本地数据库。
- TURSO_AUTH_TOKEN：仅远程数据库需要
- AI_API_KEY、AI_BASE_URL、AI_MODEL：服务端环境变量；不能打包进客户端。
- MYPT_BETA_INVITE_HASHES：逗号分隔的 SHA-256 邀请码摘要，每位测试者不同
- MYPT_BETA_EXPIRES_AT：邀请与会话的到期时间，ISO 格式

运行 `node scripts/create-beta-invite.mjs` 可生成一位测试者的 7 天邀请。把摘要配置到服务端，把原始邀请码单独交给测试者，勿放到 URL 或 Git。修改摘要后旧会话失效。

## 运行

在独立线上目录安装依赖 `npm ci`。注入上述环境变量，运行 `npm run db:push` 初始化空的线上库，运行 `node --import tsx src/db/seed-exercises.ts` 初始化动作库。不要上传本机 .env.local、.local-ai.json 或 local.db。

`npm run build` 后，用平台进程管理器运行 `npm start`。配置 HTTPS 反向代理和自动重启，内部端口 4000 不应直接暴露。反向代理仅向应用传递受信任的 Host/Forwarded 信息。

入口为 `https://实际域名/zh/signin`。每个邀请码对应独立数据库 user ID，不会读取 local-owner 的数据。默认界面为简体中文，也可切换英文和土耳其语。

## AI 限额与数据

生产环境四种 AI 功能（聊天、饮食解析、训练计划、洞察）共用持久化计数：每身份每日 20 次、整个实例每日 100 次，按 Asia/Shanghai 日期结算；失败调用也计数。数据库事务保证限额检查与计数原子完成，实例上限失败会回滚用户计数。每次最多输出 token 由各功能原有参数限制，额度并非货币预算，仍需在模型平台设置消费限制。

已将 Service Worker 改为仅缓存静态资源，避免共享设备离线读取上一个账号的个人页面。

## 上线验收

无邀请码不能登录；错误、过期、撤销的邀请码不可用；两个邀请码的记录隔离；本机登录入口和 AI 配置接口线上不可用；AI 实际调用成功；限额有效；手机 HTTPS 打开；记录在服务重启后保留。

## EdgeOne 构建兼容性

生产构建显式使用 `next build --webpack`。2026-10-22 的 Turbopack 构建虽在平台显示成功，但线上语言路由报 `Middleware execution failed` / `module factory was not available`。此切换用于规避该打包路径；必须在新部署中重新验证 `/`、`/zh/signin` 和 API，不能仅以构建成功判断修复。

## iPhone 桌面入口

登录页提供“添加到 iPhone 桌面”的 Safari 操作说明，manifest、Apple 图标和独立窗口配置已包含在仓库。饮食记录同步与 AI 仍需要联网，安装桌面图标不会把后端搬到手机上。

长期安装应使用已配置 HTTPS 的自定义域名。EdgeOne 默认项目域名在中国大陆使用系统预览链接，链接有效期为 3 小时，不宜作为长期桌面入口。中国大陆区域绑定的自定义域名需先完成 ICP 备案；全球区域（不含中国大陆）不要求 ICP 备案，仍需实测目标手机网络。参见 [EdgeOne 域名说明](https://pages.edgeone.ai/document/domain-overview)。

2026-11-03 已修正 myptfitness 正式与预览环境的数据库令牌，并补齐已准备的内测邀请摘要和到期时间，保留原 AI 与会话配置。数据库令牌的独立连接验证通过；这不替代生产登录、记录写入和手机验收。数据库令牌与内测邀请都有有效期，长期使用前需安排更新。
