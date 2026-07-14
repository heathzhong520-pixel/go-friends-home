# GoFriends Home

GoFriends 官网与商业服务端。项目包含产品展示、账号系统、订单支付、订阅授权、私有下载、邮件通知、法律页面、错误监控和端到端测试。

## 已实现功能

- 邮箱注册、邮箱验证、登录、退出、找回与重置密码、用户中心
- MySQL 用户、会话、产品、版本、订单、订阅、授权、支付事件和下载记录
- 支付宝电脑网站支付、微信 Native 扫码支付及签名校验回调
- 阿里云 OSS 私有安装包的五分钟签名下载地址
- 隐私政策、用户协议、退款政策与用户接受记录
- SMTP 邮件、Sentry 服务端错误上报、Umami 访问统计、Playwright E2E
- Docker 多阶段构建，容器启动时自动执行数据库迁移并幂等初始化产品

## 本地开发

需要 Node.js 22.13+ 和 MySQL 8。

```bash
npm install
copy .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

默认打开 `http://localhost:3000`。本地调试支付时可保留 `PAYMENT_TEST_MODE=true`；生产环境必须设为 `false`。

## 检查

```bash
npm test
npm run lint
npm run test:e2e
```

## Docker 部署到阿里云

当前部署入口是 `http://gofren.cn:8081`，`compose.yaml` 将宿主机 8081 端口映射到容器 3000 端口。

```bash
copy .env.example .env
docker compose up -d --build
```

也可以单独构建并推送镜像：

```bash
docker build -t registry.cn-guangzhou.aliyuncs.com/heathgroup/gofriends-home:latest .
docker push registry.cn-guangzhou.aliyuncs.com/heathgroup/gofriends-home:latest
```

容器启动时会运行 `scripts/bootstrap.mjs`，应用 `drizzle/` 中尚未执行的迁移并初始化四个产品。若迁移由独立发布任务负责，可设置 `AUTO_MIGRATE=false`。

## 生产配置

从 `.env.example` 创建只存在于服务器的 `.env`，不要提交密钥。至少需要配置：

- `APP_URL`：生产公开地址。正式开放登录和支付前应改为 HTTPS 地址。
- `DATABASE_URL`：阿里云 RDS MySQL 内网连接串，并限制安全组来源。
- `IP_HASH_SALT`：独立生成的长随机字符串。
- `SMTP_*`：发信服务器；未配置时开发环境只会在日志中输出预览。
- `OSS_*`：私有 OSS Bucket 与最小权限 RAM 访问密钥。
- `ALIPAY_*`：支付宝应用 ID、应用私钥和支付宝公钥。
- `WECHAT_*`：微信支付商户号、证书序列号、商户私钥、平台公钥与 API v3 密钥。
- `SENTRY_DSN`、`NEXT_PUBLIC_UMAMI_*`：可观测性配置。

支付回调地址为：

- `POST /api/payments/alipay/notify`
- `POST /api/payments/wechat/notify`

生产启用前必须在支付宝、微信商户平台使用 HTTPS 域名配置回调，并分别完成沙箱和小额真实支付、重复回调、金额篡改与退款演练。

## 上传真实安装包

把安装包上传到私有 OSS Bucket 后，将对象键、校验值和文件大小写入对应版本。例如：

```sql
UPDATE product_versions
SET oss_object_key = 'releases/nexus-desk/2.4.1/windows/setup.exe',
    checksum_sha256 = '文件的 SHA-256',
    file_size_bytes = 123456789
WHERE product_id = (SELECT id FROM products WHERE slug = 'nexus-desk')
  AND version = '2.4.1'
  AND platform = 'windows';
```

未设置 `oss_object_key` 的版本会明确显示“安装包待上传”，不会提供虚假下载地址。

## 上线前检查

1. 为 `gofren.cn` 配置 HTTPS 证书和反向代理，再把 `APP_URL` 改成 HTTPS。
2. 把 `PAYMENT_TEST_MODE` 设为 `false`，并确认页面不再显示测试支付。
3. 使用 RDS 独立低权限账号，备份数据库；OSS Bucket 保持私有并启用版本控制。
4. 上传安装包并写入对象键、SHA-256 和文件大小。
5. 配置 SMTP、Sentry、Umami，并确认告警和邮件送达。
6. 运行构建、Lint、E2E 和真实支付回调验收。
