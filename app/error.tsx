"use client";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="error-page"><p className="section-index">SYSTEM ERROR</p><h1>服务暂时遇到问题。</h1><p>错误已经记录，请稍后重试。</p><button className="button" type="button" onClick={reset}>重新加载 <span>↻</span></button></main>; }
