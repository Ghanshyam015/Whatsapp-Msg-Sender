import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import api from "../services/api.js";
import {
  ArrowDown, ArrowRight, ArrowUpRight, BarChart3, Check, ChevronDown, ChevronRight,
  Clock3, MessageSquare, MousePointer2, Play, Send, ShieldCheck, Sparkles, Users,
  Workflow, Zap
} from "lucide-react";

const features = [
  { icon: Send, title: "Campaigns that feel personal", text: "Reach opted-in customers with approved templates, thoughtful timing and useful context." },
  { icon: Users, title: "One clear view of your audience", text: "Bring contacts, consent, groups and tags together in a workspace your whole team can use." },
  { icon: Workflow, title: "Automate the repeatable", text: "Build reliable follow-ups around the moments that matter, without losing the human touch." },
  { icon: BarChart3, title: "Know what’s working", text: "Understand accepted, delivered and read messages with straightforward reporting." },
  { icon: ShieldCheck, title: "Consent comes first", text: "Keep opt-in records visible and respect opt-outs before every campaign." },
  { icon: Zap, title: "Made for momentum", text: "Move from audience to approved message in a few clear, considered steps." },
];
const plans = [
  { name: "Starter", price: "₹499", detail: "For small teams getting started.", items: ["1 WhatsApp account", "Up to 1,000 contacts", "Campaign basics", "Email support"] },
  { name: "Growth", price: "₹1,499", detail: "For teams building real momentum.", items: ["3 WhatsApp accounts", "Up to 10,000 contacts", "Automation & scheduling", "Campaign analytics"], popular: true },
  { name: "Business", price: "₹2,999", detail: "For growing teams with more to do.", items: ["10 WhatsApp accounts", "Up to 50,000 contacts", "Team roles & access", "Priority support"] },
];
const questions = [
  ["Do I need WhatsApp Business Platform access?", "Yes. Whats Send is designed to work with the official WhatsApp Business Platform and approved message templates. Provider credentials belong on your backend, never in the browser."],
  ["Can I message people without opt-in?", "No. Campaign audiences should contain only people who explicitly agreed to receive WhatsApp messages. Respect opt-outs and applicable Meta policies."],
  ["Are these prices inclusive of WhatsApp conversation charges?", "Whats Send plan pricing and Meta conversation charges are separate. Confirm your applicable Meta pricing before sending."],
  ["Can I connect an existing WhatsApp Business account?", "The platform is designed for account connection through the official Meta setup process. Account onboarding requires a configured backend integration."],
];

function Brand({ light = false }) {
  return <Link className={`brand${light ? " brand-light" : ""}`} to="/" aria-label="Whats Send home"><span className="brand-mark"><MessageSquare size={18} /></span><span>whats<span className="brand-blue">send</span></span></Link>;
}
function Header() {
  const [menu, setMenu] = useState(false);
  return <header className="site-header"><div className="site-nav-wrap">
    <Brand />
    <button className="mobile-nav-toggle" aria-label="Toggle navigation" onClick={() => setMenu(!menu)}>{menu ? "Close" : "Menu"}</button>
    <nav className={`site-nav${menu ? " nav-open" : ""}`}>
      <NavLink to="/features" onClick={() => setMenu(false)}>Features</NavLink>
      <NavLink to="/pricing" onClick={() => setMenu(false)}>Pricing</NavLink>
      <div className="resources-menu"><button onClick={() => setMenu(!menu)}>Resources <ChevronDown size={14} /></button><div className="resources-popover"><Link to="/docs">Documentation</Link><Link to="/faq">FAQ</Link><Link to="/about">About Whats Send</Link></div></div>
      <div className="nav-mobile-actions"><Link to="/login">Log in</Link><Link className="button button-primary button-small" to="/register">Get started <ArrowRight size={14} /></Link></div>
    </nav>
    <div className="nav-actions"><Link className="nav-login" to="/login">Log in</Link><Link className="button button-primary button-small" to="/register">Get started <ArrowRight size={14} /></Link></div>
  </div></header>;
}
function Footer() {
  return <footer className="site-footer"><div className="footer-main">
    <div className="footer-brand"><Brand light /><p>Better business conversations,<br />all in one considered workspace.</p><span className="footer-tagline">Connect. Communicate. Grow.</span></div>
    <div className="footer-col"><strong>Product</strong><Link to="/features">Features</Link><Link to="/pricing">Pricing</Link><Link to="/register">Get started</Link><Link to="/login">Log in</Link></div>
    <div className="footer-col"><strong>Explore</strong><Link to="/about">About us</Link><Link to="/docs">Documentation</Link><Link to="/faq">FAQ</Link><Link to="/contact">Contact</Link></div>
    <div className="footer-col"><strong>Legal</strong><Link to="/privacy">Privacy policy</Link><Link to="/terms">Terms of service</Link><Link to="/refund">Refund policy</Link></div>
  </div><div className="footer-bottom"><span>© 2025 Whats Send. All rights reserved.</span><span>Built for better conversations.</span></div></footer>;
}
function PublicShell({ children }) {
  return <><Header />{children}<Footer /></>;
}
function Eyebrow({ children }) { return <span className="eyebrow"><i />{children}</span>; }
function HeroProduct() {
  return <div className="hero-product" aria-label="Whats Send product preview">
    <div className="mock-window">
      <div className="mock-sidebar"><span className="mock-logo"><MessageSquare size={15} /></span><i className="mock-nav-active"><BarChart3 size={15} /></i><i><Users size={15} /></i><i><Send size={15} /></i><i><Workflow size={15} /></i><span className="mock-user">SN</span></div>
      <div className="mock-main">
        <div className="mock-topline"><span>Workspace / Overview</span><span className="mock-avatar">SN</span></div>
        <div className="mock-title"><div><b>Good morning, Sarah</b><small>Here’s what’s happening with your conversations.</small></div><button><ArrowDown size={12} /> Last 30 days</button></div>
        <div className="mock-stats">
          {[["Messages sent","12,840","+18.6%",Send],["Delivery rate","98.4%","+2.3%",Check],["Active contacts","4,256","+12.8%",Users]].map(([label, value, delta, Icon]) => <div className="mock-stat" key={label}><span>{label}<Icon size={13} /></span><b>{value}</b><small>{delta} <em>vs last month</em></small></div>)}
        </div>
        <div className="mock-chart-card"><div className="mock-chart-head"><span><b>Campaign performance</b><small>Messages delivered over time</small></span><span className="mock-legend"><i /> Delivered <i /> Read</span></div><svg viewBox="0 0 640 180" role="img" aria-label="Example campaign performance chart"><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#1769c2" stopOpacity=".17" /><stop offset="1" stopColor="#1769c2" stopOpacity="0" /></linearGradient></defs><path d="M25 130 C70 118 75 110 110 116 S158 93 196 103 S250 77 284 90 S330 60 372 77 S425 54 462 66 S520 30 560 49 S602 31 620 25 L620 165 L25 165 Z" fill="url(#chartFill)" /><path d="M25 130 C70 118 75 110 110 116 S158 93 196 103 S250 77 284 90 S330 60 372 77 S425 54 462 66 S520 30 560 49 S602 31 620 25" fill="none" stroke="#1769c2" strokeWidth="3" /><path d="M25 148 C70 140 75 136 110 138 S158 119 196 130 S250 109 284 115 S330 97 372 108 S425 83 462 96 S520 67 560 78 S602 60 620 55" fill="none" stroke="#56a8f4" strokeWidth="2" strokeDasharray="5 5" />{[42,148,254,360,466,572].map((x,i)=><text key={x} x={x} y="178" fill="#94a3b8" fontSize="10">{["1 May","6 May","11 May","16 May","21 May","26 May"][i]}</text>)}</svg></div>
      </div>
    </div>
    <div className="float-card float-delivered"><span className="float-icon"><Check size={16} /></span><span><b>Campaign delivered</b><small>98.4% delivery rate</small></span><span className="float-spark">↗</span></div>
    <div className="float-card float-message"><span className="float-icon blue"><MessageSquare size={15} /></span><span><b>New conversation</b><small>Just now · from +91 •••• 2841</small></span></div>
  </div>;
}
function Home() {
  return <PublicShell><main>
    <section className="hero-section"><div className="hero-grid"><div className="hero-copy"><Eyebrow>THE BUSINESS MESSAGING WORKSPACE</Eyebrow><h1>One platform.<br />All your business<br /><span>conversations.</span></h1><p>Bring WhatsApp campaigns, customer conversations, and the people behind them together—without losing the human touch.</p><div className="hero-actions"><Link className="button button-primary" to="/register">Get started free <ArrowRight size={17} /></Link><Link className="button button-quiet" to="/features"><span className="play-icon"><Play size={11} fill="currentColor" /></span> Explore features</Link></div><div className="hero-note"><ShieldCheck size={15} /><span>Consent-first messaging, built around the official WhatsApp Business Platform.</span></div></div><HeroProduct /></div>
      <div className="hero-trust"><span>MADE FOR TEAMS WHO PUT CUSTOMERS FIRST</span><div className="trust-logos"><span>north<span>star</span></span><span className="trust-serif">atelier</span><span><i className="trust-square" /> madewell</span><span className="trust-serif">the good co.</span><span><i className="trust-orbit" /> orchard</span></div><small>Illustrative placeholders — not customer endorsements</small></div>
    </section>
    <section className="section section-white"><div className="section-heading"><Eyebrow>LESS BUSYWORK. MORE GOOD WORK.</Eyebrow><h2>Every conversation,<br />a little more connected.</h2><p>From the first opt-in to the next campaign, the important pieces work better together.</p></div><div className="feature-grid">{features.map(({icon: Icon,title,text},i)=><article className="feature-card" key={title}><span className="feature-icon">{<Icon size={19} />}</span><span className="feature-number">0{i+1}</span><h3>{title}</h3><p>{text}</p><Link to="/features">Discover more <ArrowRight size={14} /></Link></article>)}</div></section>
    <section className="section how-section"><div className="how-copy"><Eyebrow>A BETTER WAY TO GET STARTED</Eyebrow><h2>From hello<br />to <span>here’s what’s next.</span></h2><p>A thoughtfully simple flow for your team, with the right guardrails built in from day one.</p><Link className="text-link" to="/docs">See how it works <ArrowRight size={15} /></Link></div><div className="steps-list">{[["01","Connect your account","Set up your official WhatsApp Business Platform connection."],["02","Bring your audience","Import contacts and keep consent easy to see and manage."],["03","Send with confidence","Choose an approved template, review your audience, and go."]].map(([n,t,d])=><div className="step-item" key={n}><span className="step-num">{n}</span><div><h3>{t}</h3><p>{d}</p></div><ChevronRight size={17} /></div>)}</div></section>
    <section className="section preview-section"><div className="preview-text"><Eyebrow>CAMPAIGNS, WITH CONTEXT</Eyebrow><h2>Less guesswork.<br /><span>More meaningful sends.</span></h2><p>Know who you’re reaching, what they’ve agreed to receive, and how your message is doing—before and after you hit send.</p><ul className="check-list"><li><Check size={15} /> Audience filters built for opted-in contacts</li><li><Check size={15} /> Template-first campaign review</li><li><Check size={15} /> Delivery and read status at a glance</li></ul><Link className="text-link" to="/features">Explore campaign tools <ArrowRight size={15} /></Link></div><div className="campaign-preview"><div className="campaign-window"><div className="campaign-top"><span>Campaigns <small>› Spring collection</small></span><span className="campaign-status"><i /> Completed</span></div><div className="campaign-main"><div className="campaign-meta"><small>CAMPAIGN OVERVIEW</small><b>Something lovely is on its way 🌿</b><span>Sent to opted-in customers · 24 May 2025</span></div><div className="campaign-kpis">{[["Audience","2,840"],["Delivered","2,791"],["Read","1,904"]].map(([a,b])=><div key={a}><small>{a}</small><b>{b}</b></div>)}</div><div className="campaign-message"><span className="campaign-message-avatar">N</span><div><b>North & Pine</b><p>Our new season edit is here. A little something for your everyday ↓</p><small>WhatsApp approved template · en</small></div></div><div className="campaign-bottom"><span><i /> Delivery rate</span><b>98.3%</b><div className="campaign-progress"><i /></div></div></div></div></div></section>
    <section className="section analytics-section"><div className="analytics-frame"><div className="analytics-head"><div><span>YOUR WORKSPACE <i>DEMO PREVIEW</i></span><h3>Conversations that move forward</h3></div><span className="analytics-period">Last 30 days <ChevronDown size={13} /></span></div><div className="analytics-body"><div className="analytics-chart"><div className="analytics-numbers"><span><b>18,492</b><small>Messages sent</small></span><span className="analytics-growth">↗ 14.8% <small>vs previous period</small></span></div><div className="bar-chart">{[30,46,39,62,54,76,51,67,42,81,61,92,68,85,58,74,95,66,79,56,86,71,100,81,91,67,76,98].map((v,i)=><i key={i} style={{height:`${v}%`}} />)}</div><div className="chart-months"><span>01 May</span><span>15 May</span><span>30 May</span></div></div><div className="analytics-breakdown"><small>MESSAGE STATUS</small>{[["Delivered","91.8%","green"],["Read","68.2%","blue"],["Failed","1.6%","red"]].map(([l,v,c])=><div className="breakdown-row" key={l}><span><i className={`dot-${c}`} />{l}</span><b>{v}</b></div>)}</div></div><p className="demo-caption">Illustrative product preview — sample data shown.</p></div><div className="analytics-aside"><Eyebrow>A CLEARER PICTURE</Eyebrow><h2>Make the next<br />message <span>count.</span></h2><p>Simple, useful reporting gives your team a better read on the conversations you’re having.</p><Link className="text-link" to="/features">See analytics features <ArrowRight size={15} /></Link></div></section>
    <section className="section pricing-preview"><div className="pricing-header"><div><Eyebrow>PRICING THAT GROWS WITH YOU</Eyebrow><h2>Start with what you need.</h2></div><Link className="text-link" to="/pricing">Compare all plans <ArrowRight size={15} /></Link></div><div className="pricing-grid">{plans.map(plan=><PlanCard key={plan.name} plan={plan} />)}</div><p className="pricing-footnote">Meta WhatsApp conversation charges are billed separately. <Link to="/pricing">See plan details.</Link></p></section>
    <section className="section quote-section"><div className="quote-mark">“</div><blockquote>It’s helped us make customer communication feel less like a process, and more like the kind of service we want to be known for.</blockquote><div className="quote-credit"><span className="quote-avatar">A</span><span><b>Sample customer story</b><small>Illustrative testimonial · Placeholder content</small></span></div></section>
    <FAQPreview />
    <section className="final-cta"><div><Eyebrow>YOUR NEXT BETTER CONVERSATION STARTS HERE</Eyebrow><h2>Good conversations<br />grow good businesses.</h2><p>Bring the pieces together and give your team a better place to start.</p><Link className="button button-white" to="/register">Get started free <ArrowRight size={16} /></Link><small>No card required to explore the demo.</small></div><div className="cta-decoration"><div><MessageSquare size={30} /></div><i><Check size={17} /></i><span className="cta-dot cta-dot-one" /><span className="cta-dot cta-dot-two" /></div></section>
  </main></PublicShell>;
}
function PlanCard({ plan }) {
  return <article className={`plan-card${plan.popular ? " plan-popular" : ""}`}>{plan.popular && <span className="popular-label">MOST POPULAR</span>}<h3>{plan.name}</h3><p>{plan.detail}</p><div className="plan-price">{plan.price}<span> / month</span></div><span className="plan-billing">Billed monthly · GST may apply</span><Link className={plan.popular ? "button button-primary" : "button button-outline"} to="/register">Choose {plan.name} <ArrowRight size={14} /></Link><ul>{plan.items.map(i=><li key={i}><Check size={14} />{i}</li>)}</ul></article>;
}
function FAQPreview() {
  const [open, setOpen] = useState(0);
  return <section className="section faq-section"><div className="faq-intro"><Eyebrow>GOOD TO KNOW</Eyebrow><h2>A few things<br />you might be wondering.</h2><p>Still have a question? We’re happy to help.</p><Link className="text-link" to="/contact">Talk to our team <ArrowRight size={15} /></Link></div><div className="faq-list">{questions.slice(0,3).map(([q,a],i)=><div className={`faq-item${open===i?" faq-open":""}`} key={q}><button onClick={() => setOpen(open===i?-1:i)} aria-expanded={open===i}>{q}<ChevronDown size={17} /></button>{open===i&&<p>{a}</p>}</div>)}</div></section>;
}
function PricingPage() {
  return <PublicShell><main><section className="inner-hero"><Eyebrow>STRAIGHTFORWARD, THOUGHTFUL PRICING</Eyebrow><h1>A plan that fits<br /><span>the way you grow.</span></h1><p>Start with the essentials. Add more room as your customer conversations grow.</p></section><section className="section pricing-grid pricing-page-grid">{plans.map(plan=><PlanCard key={plan.name} plan={plan} />)}<article className="plan-card enterprise-card"><span className="enterprise-icon"><Sparkles size={18} /></span><h3>Enterprise</h3><p>For complex teams and custom needs.</p><div className="enterprise-price">Let’s talk</div><span className="plan-billing">Flexible pricing built around you</span><Link className="button button-outline" to="/contact">Talk to sales <ArrowUpRight size={14} /></Link><ul>{["Custom messaging volumes","Dedicated onboarding","Advanced team controls","Priority account support"].map(i=><li key={i}><Check size={14} />{i}</li>)}</ul></article></section><div className="pricing-disclaimer">Prices shown in INR per month. Meta WhatsApp conversation charges and applicable taxes are billed separately. Plan limits are illustrative and subject to confirmation at checkout. Payments are not connected in this demo.</div><section className="section section-white"><div className="section-heading"><Eyebrow>FLEXIBLE BY DESIGN</Eyebrow><h2>Questions about plans?</h2><p>We’ll help you find a good fit for how your team works.</p><Link className="button button-primary" to="/contact">Get in touch <ArrowRight size={15} /></Link></div></section></main></PublicShell>;
}
function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", topic: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      const { data } = await api.post("/support", form);
      setNotice(`Thanks for reaching out. Your request was received (${data.ticket.id}).`);
      setForm({ name: "", email: "", topic: "", message: "" });
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Could not send your request. Please try again.");
    } finally { setBusy(false); }
  }
  return <form className="contact-form" onSubmit={submit}>
    <label>Your name<input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required placeholder="Name" /></label>
    <label>Work email<input type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} required placeholder="you@company.com" /></label>
    <label>How can we help?<select value={form.topic} onChange={event => setForm({ ...form, topic: event.target.value })} required><option value="" disabled>Choose a topic</option><option>Getting started</option><option>Plans and billing</option><option>Technical support</option><option>Something else</option></select></label>
    <label>Message<textarea rows="4" minLength="10" value={form.message} onChange={event => setForm({ ...form, message: event.target.value })} required placeholder="A little context goes a long way…" /></label>
    {error && <p className="form-alert error-alert" role="alert">{error}</p>}
    {notice && <p className="form-alert info-alert" role="status">{notice}</p>}
    <button className="button button-primary" disabled={busy}>{busy ? "Sending…" : "Send message"} <ArrowRight size={15} /></button>
  </form>;
}
function ContentPage({ type }) {
  const pages = {
    features: { label:"THE WHATS SEND WORKSPACE", title:"Everything in its right place.", text:"A calmer, clearer way to plan, send and learn from your business conversations.", blocks:features },
    about: { label:"OUR POINT OF VIEW", title:"Business messaging can feel more human.", text:"Whats Send is being built around a simple idea: thoughtful customer communication should be easier to manage, and easier to get right.", blocks:[{icon:MessageSquare,title:"Connect.",text:"Bring your business conversations into one organized workspace."},{icon:Users,title:"Communicate.",text:"Build customer relationships through relevant, permission-based messaging."},{icon:BarChart3,title:"Grow.",text:"Learn from each interaction and make your next one even more useful."}] },
    contact: { label:"WE’RE HERE TO HELP", title:"Let’s make something click.", text:"Tell us what you’re working on and the Whats Send team will be in touch.", blocks:[] },
    docs: { label:"WHATS SEND DOCUMENTATION", title:"A clearer path from setup to send.", text:"Practical guidance for connecting your workspace and building a compliant messaging workflow.", blocks:[] },
    faq: { label:"QUESTIONS, ANSWERED", title:"Good to know before you get going.", text:"The practical details about accounts, messaging, plans and how Whats Send works.", blocks:[] },
    privacy: { label:"LAST UPDATED: 17 NOVEMBER 2026", title:"Privacy policy", text:"This page is a product template. Publish a reviewed, jurisdiction-specific privacy notice before collecting personal information.", blocks:[] },
    terms: { label:"LAST UPDATED: 17 NOVEMBER 2026", title:"Terms of service", text:"These draft terms are informational placeholders and are not legal advice. Have counsel review them before offering the service.", blocks:[] },
    refund: { label:"LAST UPDATED: 17 NOVEMBER 2026", title:"Refund policy", text:"This draft policy is a placeholder. Confirm your billing model and applicable consumer laws before accepting payments.", blocks:[] },
  };
  const page=pages[type] || pages.features;
  return <PublicShell><main><section className="inner-hero"><Eyebrow>{page.label}</Eyebrow><h1>{page.title}</h1><p>{page.text}</p></section>
    {type==="features" && <section className="section section-white"><div className="feature-grid">{page.blocks.map(({icon:Icon,title,text},i)=><article className="feature-card" key={title}><span className="feature-icon"><Icon size={19} /></span><span className="feature-number">0{i+1}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>}
    {type==="about" && <section className="section section-white"><div className="story-grid">{page.blocks.map(({icon:Icon,title,text})=><article key={title}><span className="feature-icon"><Icon size={19} /></span><h2>{title}</h2><p>{text}</p></article>)}</div><div className="about-note"><ShieldCheck size={20} /><p><b>Built on trust, not shortcuts.</b><br />Whats Send is designed for the official WhatsApp Business Platform. It is not affiliated with or endorsed by Meta.</p></div></section>}
    {type==="contact" && <section className="section section-white contact-layout"><div><h2>Tell us a little about it.</h2><p>For product questions, account setup, or a conversation about your team’s needs.</p><div className="contact-detail"><MessageSquare size={18} /><span><b>Product & setup</b><small>Get help finding your way around Whats Send.</small></span></div><div className="contact-detail"><Clock3 size={18} /><span><b>We’ll get back to you</b><small>Typical response time: 1–2 business days.</small></span></div></div><ContactForm /></section>}
    {type==="docs" && <section className="section section-white docs-layout"><aside className="docs-toc"><b>Getting started</b><a href="#overview">Overview</a><a href="#connect">Connect WhatsApp</a><a href="#audience">Prepare your audience</a><a href="#campaign">Create a campaign</a><a href="#api">API & security</a></aside><div className="docs-article"><article id="overview"><span className="docs-step">01 — OVERVIEW</span><h2>Before your first campaign</h2><p>Whats Send is a workspace for WhatsApp Business messaging. To send messages, you need an active Meta Business account, a connected WhatsApp Business Platform phone number, and an approved template.</p><div className="docs-callout"><ShieldCheck size={18} /><span>Only message people who explicitly opted in. Use approved templates for business-initiated conversations and honor opt-outs.</span></div></article><article id="connect"><span className="docs-step">02 — CONNECTION</span><h2>Connect your WhatsApp account</h2><p>Set up your app and WhatsApp Business Account in Meta for Developers. Keep the access token, phone number ID, app secret and webhook verification token on your server only.</p><ol><li>Create a Business app and add WhatsApp.</li><li>Configure backend environment variables for the Cloud API.</li><li>Set up your HTTPS webhook callback and verify it.</li><li>Subscribe to message status updates to track delivery.</li></ol></article><article id="audience"><span className="docs-step">03 — AUDIENCE</span><h2>Prepare your audience</h2><p>Import contacts with international-format phone numbers and documented opt-in. The current starter API accepts JSON imports of up to 5,000 records. Invalid or non-consenting rows are skipped.</p></article><article id="campaign"><span className="docs-step">04 — CAMPAIGNS</span><h2>Send an approved template</h2><p>Use the exact approved template name and language code from WhatsApp Manager. Review the opted-in audience before queueing a campaign. A successful API response means accepted by Meta—not delivered.</p></article><article id="api"><span className="docs-step">05 — SECURITY</span><h2>API & security</h2><p>The API base URL can be set with <code>VITE_API_URL</code>. Bearer tokens are sent by the client API module. For production, implement tenant-scoped authorization on every server route, strong session handling, rate limits and audit logging.</p></article></div></section>}
    {type==="faq" && <section className="section section-white"><FAQPreview /></section>}
    {["privacy","terms","refund"].includes(type) && <section className="section legal-copy"><h2>About this policy</h2><p>{type==="privacy" ? "This template should describe the personal data your service collects, how it is used, retention and deletion practices, subprocessors, international transfers, user rights and a clear contact route." : type==="terms" ? "Your final terms should describe eligibility, accounts, acceptable use, WhatsApp and Meta policy responsibilities, billing, intellectual property, availability, limitation of liability and termination." : "Your final refund terms should make eligibility, cancellation timing, billing periods, taxes, exceptions and the process for requesting a refund clear to customers."}</p><h2>Messaging and customer choice</h2><p>Whats Send is intended for consent-based communication through the official WhatsApp Business Platform. Businesses are responsible for obtaining valid opt-in, using approved templates where required, complying with applicable law and promptly honoring opt-out requests.</p><h2>Questions</h2><p>Contact <Link to="/contact">our team</Link> for policy questions. These draft pages are not a substitute for legal review.</p></section>}
    {type!=="contact" && type!=="docs" && <section className="inner-cta"><h2>Ready to make conversations easier?</h2><Link className="button button-primary" to="/register">Get started free <ArrowRight size={15} /></Link></section>}
  </main></PublicShell>;
}
export default function PublicPages() {
  const { pathname } = useLocation();
  const path = pathname.replace(/^\/|\/$/g,"");
  if (!path || path==="home") return <Home />;
  if (path==="pricing") return <PricingPage />;
  return <ContentPage type={path} />;
}
