"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AccountLinks } from "../components/account-links";
import { LanguageSwitcher } from "../components/language-switcher";
import { useLocale } from "../components/locale-provider";

type WorkCategory = "all" | "desktop" | "web" | "dev";

const categoryKeys: WorkCategory[] = ["all", "desktop", "web", "dev"];
const sectionLinks = ["#works", "#docs", "#pricing", "#about", "#notes"];

export default function Home() {
  const { dictionary } = useLocale();
  const copy = dictionary.home;
  const [category, setCategory] = useState<WorkCategory>("all");
  const [activeDoc, setActiveDoc] = useState(0);
  const [yearly, setYearly] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(() => {
    const featuredIndex = copy.plans.findIndex((plan) => "featured" in plan && plan.featured);
    return featuredIndex >= 0 ? featuredIndex : 0;
  });
  const [menuOpen, setMenuOpen] = useState(false);

  const visibleWorks = useMemo(
    () => copy.works.filter((work) => category === "all" || work.category === category),
    [category, copy.works],
  );
  const doc = copy.docs[activeDoc];
  const closeMenu = () => setMenuOpen(false);

  return (
    <main id="top">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="GoFriends home" onClick={closeMenu}>
          <span className="brand-mark" aria-hidden="true" />
          <span>GoFriends</span>
        </a>
        <button className="menu-button" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={copy.openNav}>
          {menuOpen ? copy.close : copy.menu}
        </button>
        <nav className={menuOpen ? "nav nav-open" : "nav"} aria-label={copy.mainNav}>
          {copy.nav.map((label, index) => <a href={sectionLinks[index]} onClick={closeMenu} key={sectionLinks[index]}>{label}</a>)}
          <a className="nav-github" href="https://github.com/heathzhong520-pixel" target="_blank" rel="noreferrer">GitHub ↗</a>
          <AccountLinks />
          <LanguageSwitcher />
        </nav>
      </header>

      <section className="hero shell" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><span className="status-dot" />{copy.online}</p>
          <h1 id="hero-title">{copy.headlineTop}<br /><em>{copy.headlineAccent}</em></h1>
          <p className="hero-intro">{copy.intro}</p>
          <div className="hero-actions">
            <a className="button" href="#works">{copy.explore} <span>↓</span></a>
            <a className="button button-ghost" href="#about">{copy.principlesLink} <span>↗</span></a>
          </div>
        </div>
        <div className="terminal-panel" aria-label={copy.developerStatus}>
          <div className="panel-status"><span>{copy.systemStatus}</span><strong>{copy.systemOk}</strong></div>
          <div className="terminal-lines">
            <p>$ whoami</p>
            <strong>gofriends / independent developer</strong>
            <p>$ echo $MISSION</p>
            <q>{copy.mission}</q>
          </div>
          <dl className="hero-stats">
            <div><dt>07</dt><dd>{copy.stats[0]}</dd></div>
            <div><dt>38K</dt><dd>{copy.stats[1]}</dd></div>
            <div><dt>04</dt><dd>{copy.stats[2]}</dd></div>
          </dl>
        </div>
      </section>

      <section className="section shell" id="works">
        <div className="section-heading split-heading">
          <div><p className="section-index">{copy.worksIndex}</p><h2>{copy.worksTitle}</h2></div>
          <div className="filter-tabs" role="group" aria-label={copy.workCategoryLabel}>
            {categoryKeys.map((item) => (
              <button className={category === item ? "active" : ""} type="button" key={item} onClick={() => setCategory(item)}>{copy.workCategories[item]}</button>
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
              <a className="card-action" href={`/products/${work.slug}`}>{dictionary.common.details} <span>→</span></a>
            </article>
          ))}
        </div>
        <a className="inline-link" href="#notes">{copy.allReleases} <span>→</span></a>
      </section>

      <section className="section section-dark shell" id="docs">
        <div className="section-heading docs-heading">
          <div><p className="section-index">{copy.docsIndex}</p><h2>{copy.docsTitle}</h2></div>
          <p>{copy.docsIntro}</p>
        </div>
        <div className="docs-layout">
          <aside className="docs-list" aria-label={copy.productDocs}>
            {copy.docs.map((item, index) => (
              <button type="button" key={item.name} className={activeDoc === index ? "active" : ""} onClick={() => setActiveDoc(index)}>
                <span className="doc-mark">{item.mark}</span><span><strong>{item.name}</strong><small>{item.type}</small></span><span>→</span>
              </button>
            ))}
          </aside>
          <article className="doc-content">
            <div className="doc-title"><span className="work-mark">{doc.mark}</span><div><p>{copy.quickStart}</p><h3>{doc.name}</h3></div></div>
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
          <div><p className="section-index">{copy.pricingIndex}</p><h2>{copy.pricingTitle}</h2><p>{copy.pricingIntro}</p></div>
          <div className="billing-toggle" role="group" aria-label={copy.billingLabel}>
            <button type="button" className={!yearly ? "active" : ""} onClick={() => setYearly(false)}>{copy.monthlyPay}</button>
            <button type="button" className={yearly ? "active" : ""} onClick={() => setYearly(true)}>{copy.yearlyPay} <span>{copy.save}</span></button>
          </div>
        </div>
        <div className="pricing-grid">
          {copy.plans.map((plan, index) => {
            const isSelected = selectedPlan === index;
            return (
              <article
                className={isSelected ? "price-card selected" : "price-card"}
                data-selected={isSelected}
                key={plan.name}
                onClick={() => setSelectedPlan(index)}
              >
                <p className="plan-name">{plan.index} / {plan.name}</p>
                <div className="price"><strong>¥{yearly ? plan.yearly : plan.monthly}</strong><span>/ {yearly ? dictionary.common.year : dictionary.common.month}</span></div>
                <p className="effective">{yearly ? `${copy.approx} ¥${Math.round(plan.yearly / 12)} / ${dictionary.common.month}` : copy.flexibleMonthly}</p>
                <p className="plan-note">{plan.note}</p>
                <ul>{plan.features.map((feature) => <li key={feature}><span>✓</span>{feature}</li>)}</ul>
                <Link className={isSelected ? "button" : "button button-ghost"} href="/products">{copy.viewProducts} <span>→</span></Link>
              </article>
            );
          })}
        </div>
        <div className="pricing-notes"><span>{copy.paymentNote}</span><span>{copy.purchaseHelp} <a href="mailto:hello@gofriends.dev">hello@gofriends.dev</a></span></div>
      </section>

      <section className="section philosophy shell" id="about">
        <div className="philosophy-side">
          <p className="section-index">{copy.philosophyIndex}</p>
          <span className="philosophy-symbol">✣</span>
        </div>
        <div className="philosophy-content">
          <h2>{copy.philosophyTop}<br /><strong>{copy.philosophyAccent}</strong></h2>
          <div className="principles">
            {copy.principles.map((principle, index) => <article key={principle.title}><span>0{index + 1}</span><h3>{principle.title}</h3><p>{principle.body}</p></article>)}
          </div>
        </div>
      </section>

      <footer className="footer shell" id="notes">
        <p className="section-index">{copy.stayInTouch}</p>
        <h2>{copy.contactTop}<br /><em>{copy.contactAccent}</em></h2>
        <a className="button contact-button" href="mailto:hello@gofriends.dev">hello@gofriends.dev <span>↗</span></a>
        <div className="footer-meta"><span>{copy.built}</span><span><a href="/legal/privacy">{copy.legalLinks[0]}</a> · <a href="/legal/terms">{copy.legalLinks[1]}</a> · <a href="/legal/refund">{copy.legalLinks[2]}</a></span><span>v3.0.0</span></div>
      </footer>
    </main>
  );
}
