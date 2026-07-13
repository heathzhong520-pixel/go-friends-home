"use client";

import { useMemo, useState } from "react";

type WorkCategory = "全部" | "桌面工具" | "网页应用" | "开发工具";

const works = [
  {
    mark: "N/",
    name: "NEXUS / Desk",
    status: "稳定版",
    category: "桌面工具",
    description: "把零散的工作流收进一个安静、可扩展的桌面工作台。",
    meta: "v2.4.1  ·  macOS · Windows  ·  更新于 2026.07.08",
  },
  {
    mark: "C.",
    name: "Clarity",
    status: "新发布",
    category: "桌面工具",
    description: "一款只做一件事的专注计时器。短暂离线，长久清醒。",
    meta: "v1.8.0  ·  macOS  ·  更新于 2026.06.24",
  },
  {
    mark: "SF",
    name: "SiteFoundry",
    status: "测试版",
    category: "开发工具",
    description: "从内容模型到可部署页面，给个人项目一条更短的路径。",
    meta: "v0.9.6  ·  Web · CLI  ·  更新于 2026.06.02",
  },
  {
    mark: "LH",
    name: "Lighthouse",
    status: "稳定版",
    category: "网页应用",
    description: "轻量级发布台：管理链接、版本与每一个公开的作品。",
    meta: "v1.2.0  ·  Web  ·  更新于 2026.05.19",
  },
] as const;

const docs = [
  {
    mark: "N/",
    name: "NEXUS / Desk",
    type: "工作台",
    intro: "把任务、链接与临时想法收进一个可随时回到的桌面工作台。",
    steps: ["下载并安装 NEXUS / Desk", "创建第一个 Space，命名你的工作场景", "拖入链接、文件或新建一张快速笔记"],
    faq: "Space 会自动保存在本地；专业版可启用多设备同步。",
  },
  {
    mark: "C.",
    name: "Clarity",
    type: "专注计时",
    intro: "用克制的时间块，重新建立专注与休息之间的节奏。",
    steps: ["选择一个专注时长", "隐藏无关提醒并开始计时", "在历史记录里回看自己的节奏"],
    faq: "所有专注记录默认只保存在你的设备上。",
  },
  {
    mark: "SF",
    name: "SiteFoundry",
    type: "发布工具",
    intro: "从一份清晰的内容结构，快速产出可以直接部署的网站。",
    steps: ["创建项目并选择内容模型", "补充页面内容与品牌样式", "预览并发布到你的域名"],
    faq: "支持静态导出，也可以接入现有的自动部署流程。",
  },
  {
    mark: "LH",
    name: "Lighthouse",
    type: "发布台",
    intro: "集中维护每个作品的链接、版本、状态与公开说明。",
    steps: ["添加你的第一个作品", "绑定下载与文档链接", "发布版本并同步更新日志"],
    faq: "团队版支持成员权限、审核流程和批量发布。",
  },
] as const;

const plans = [
  {
    index: "01",
    name: "个人版",
    monthly: 19,
    yearly: 159,
    note: "给正在认真生活、独立工作的人。",
    features: ["1 台个人设备", "所有核心功能", "持续版本更新", "7 天退款保障"],
  },
  {
    index: "02",
    name: "专业版",
    monthly: 39,
    yearly: 329,
    note: "给自由职业者与高频创作者。",
    features: ["最多 3 台个人设备", "完整工具与高级功能", "优先功能更新", "优先邮件支持"],
    featured: true,
  },
  {
    index: "03",
    name: "团队版",
    monthly: 69,
    yearly: 579,
    note: "给需要统一采购与部署的团队。",
    features: ["每席位授权，5 席位起购", "批量成员与权限管理", "发票与采购支持", "专属响应通道"],
  },
] as const;

export default function Home() {
  const [category, setCategory] = useState<WorkCategory>("全部");
  const [activeDoc, setActiveDoc] = useState(0);
  const [yearly, setYearly] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const visibleWorks = useMemo(
    () => works.filter((work) => category === "全部" || work.category === category),
    [category],
  );
  const doc = docs[activeDoc];

  const closeMenu = () => setMenuOpen(false);

  return (
    <main id="top">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="GoFriends home" onClick={closeMenu}>
          <span className="brand-mark">●</span>
          <span>GoFriends</span>
        </a>
        <button className="menu-button" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="打开导航">
          {menuOpen ? "关闭" : "菜单"}
        </button>
        <nav className={menuOpen ? "nav nav-open" : "nav"} aria-label="主导航">
          <a href="#works" onClick={closeMenu}>作品库</a>
          <a href="#docs" onClick={closeMenu}>文档</a>
          <a href="#pricing" onClick={closeMenu}>订阅方案</a>
          <a href="#about" onClick={closeMenu}>关于我</a>
          <a href="#notes" onClick={closeMenu}>更新日志</a>
          <a className="nav-github" href="https://github.com/heathzhong520-pixel" target="_blank" rel="noreferrer">GitHub ↗</a>
          <button className="nav-text-button" type="button">登录</button>
          <button className="button button-small" type="button">注册</button>
          <button className="language" type="button">◎ EN</button>
        </nav>
      </header>

      <section className="hero shell" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><span className="status-dot" />独立开发者 · 在线</p>
          <h1 id="hero-title">做有用的<br /><em>数字工具。</em></h1>
          <p className="hero-intro">我是 GoFriends 背后的独立开发者。这里收录我持续打磨的网站、桌面应用与小工具——为真实的问题，做清晰的解法。</p>
          <div className="hero-actions">
            <a className="button" href="#works">探索作品 <span>↓</span></a>
            <a className="button button-ghost" href="#about">我的开发原则 <span>↗</span></a>
          </div>
        </div>
        <div className="terminal-panel" aria-label="开发者状态">
          <div className="panel-status"><span>系统状态</span><strong>运行正常</strong></div>
          <div className="terminal-lines">
            <p>$ whoami</p>
            <strong>gofriends / independent developer</strong>
            <p>$ echo $MISSION</p>
            <q>做值得长期使用的软件。</q>
          </div>
          <dl className="hero-stats">
            <div><dt>07</dt><dd>已发布</dd></div>
            <div><dt>38K</dt><dd>DOWNLOADS</dd></div>
            <div><dt>04</dt><dd>YEARS</dd></div>
          </dl>
        </div>
      </section>

      <section className="section shell" id="works">
        <div className="section-heading split-heading">
          <div><p className="section-index">01 / 精选发布</p><h2>正在生长的作品库</h2></div>
          <div className="filter-tabs" role="group" aria-label="作品分类">
            {(["全部", "桌面工具", "网页应用", "开发工具"] as WorkCategory[]).map((item) => (
              <button className={category === item ? "active" : ""} type="button" key={item} onClick={() => setCategory(item)}>{item}</button>
            ))}
          </div>
        </div>
        <div className="work-grid">
          {visibleWorks.map((work) => (
            <article className="work-card" key={work.name}>
              <span className="work-mark">{work.mark}</span>
              <div className="work-body">
                <div className="work-title"><h3>{work.name}</h3><span className="badge">{work.status}</span></div>
                <p>{work.description}</p>
                <small>{work.meta}</small>
              </div>
              <button type="button" className="card-action">下载 <span>↓</span></button>
            </article>
          ))}
        </div>
        <a className="inline-link" href="#notes">查看所有发布记录 <span>→</span></a>
      </section>

      <section className="section section-dark shell" id="docs">
        <div className="section-heading docs-heading">
          <div><p className="section-index">02 / 文档</p><h2>先看文档，再开始构建。</h2></div>
          <p>为每个 GoFriends 工具准备了清晰的入门路径、核心操作与常见问题。</p>
        </div>
        <div className="docs-layout">
          <aside className="docs-list" aria-label="产品文档">
            {docs.map((item, index) => (
              <button type="button" key={item.name} className={activeDoc === index ? "active" : ""} onClick={() => setActiveDoc(index)}>
                <span className="doc-mark">{item.mark}</span><span><strong>{item.name}</strong><small>{item.type}</small></span><span>→</span>
              </button>
            ))}
          </aside>
          <article className="doc-content">
            <div className="doc-title"><span className="work-mark">{doc.mark}</span><div><p>快速开始</p><h3>{doc.name}</h3></div></div>
            <p className="doc-intro">{doc.intro}</p>
            <ol>
              {doc.steps.map((step, index) => <li key={step}><span>0{index + 1}</span><p>{step}</p></li>)}
            </ol>
            <div className="faq"><strong>FAQ</strong><p>{doc.faq}</p></div>
          </article>
        </div>
      </section>

      <section className="section shell" id="pricing">
        <div className="section-heading pricing-heading">
          <div><p className="section-index">02 / 订阅方案</p><h2>持续订阅，持续更新。</h2><p>所有方案均为订阅制，包含持续功能更新与技术支持。选择年付，享受更低的有效月价。</p></div>
          <div className="billing-toggle" role="group" aria-label="支付周期">
            <button type="button" className={!yearly ? "active" : ""} onClick={() => setYearly(false)}>按月支付</button>
            <button type="button" className={yearly ? "active" : ""} onClick={() => setYearly(true)}>按年支付 <span>省 30%</span></button>
          </div>
        </div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article className={plan.featured ? "price-card featured" : "price-card"} key={plan.name}>
              <p className="plan-name">{plan.index} / {plan.name}</p>
              <div className="price"><strong>¥{yearly ? plan.yearly : plan.monthly}</strong><span>/ {yearly ? "年" : "月"}</span></div>
              <p className="effective">{yearly ? `约 ¥${Math.round(plan.yearly / 12)} / 月` : "按月灵活订阅"}</p>
              <p className="plan-note">{plan.note}</p>
              <ul>{plan.features.map((feature) => <li key={feature}><span>✓</span>{feature}</li>)}</ul>
              <button className={plan.featured ? "button" : "button button-ghost"} type="button">订阅{plan.name} <span>→</span></button>
            </article>
          ))}
        </div>
        <div className="pricing-notes"><span>支持支付宝 / 微信支付 / 对公转账 · 订阅可随时取消</span><span>需要发票、教育优惠或团队采购？ <a href="mailto:hello@gofriends.dev">hello@gofriends.dev</a></span></div>
      </section>

      <section className="section philosophy shell" id="about">
        <div className="philosophy-side">
          <p className="section-index">03 / 开发方式</p>
          <span className="philosophy-symbol">✣</span>
        </div>
        <div className="philosophy-content">
          <h2>不追逐更多功能。<br />我追逐<strong>更少摩擦。</strong></h2>
          <div className="principles">
            <article><span>01</span><h3>先判断</h3><p>从问题的根部开始，而不是堆砌界面。</p></article>
            <article><span>02</span><h3>再取舍</h3><p>把不必要的复杂度留在工作台之外。</p></article>
            <article><span>03</span><h3>持续打磨</h3><p>发布不是终点，反馈才是下一次开始。</p></article>
          </div>
        </div>
      </section>

      <footer className="footer shell" id="notes">
        <p className="section-index">保持联系</p>
        <h2>有想法，或者发现了问题？<br /><em>直接来找我。</em></h2>
        <a className="button contact-button" href="mailto:hello@gofriends.dev">hello@gofriends.dev <span>↗</span></a>
        <div className="footer-meta"><span>© 2026 GoFriends · Built independently.</span><span>隐私优先</span><span>v3.0.0</span></div>
      </footer>
    </main>
  );
}
