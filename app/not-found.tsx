import Link from "next/link";
export default function NotFoundPage() { return <main className="error-page"><p className="section-index">404 / NOT FOUND</p><h1>这里没有你要找的页面。</h1><Link className="button" href="/">返回首页 <span>→</span></Link></main>; }
