import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import {
  Activity, ArrowDownToLine, ArrowRight, BarChart3, CalendarDays, Check, ChevronDown,
  CircleHelp, Clock3, FileUp, Filter, MessageSquare, Plus, RefreshCw, Search, Send,
  Settings2, ShieldCheck, Users, X, Zap
} from "lucide-react";
import api from "../services/api.js";
import IntegratedModule from "./IntegratedModules.jsx";

function PageTitle({ eyebrow="WORKSPACE", title, description, action }) {
  return <div className="dash-page-head"><div><span className="dash-eyebrow">{eyebrow}</span><h1>{title}</h1>{description&&<p>{description}</p>}</div>{action}</div>;
}
function Button({ children, className="", ...props }) { return <button className={`button button-secondary dash-button ${className}`} {...props}>{children}</button>; }
function DataState({ loading, error, empty, children }) {
  if (loading) return <div className="state-box"><span className="spinner" /> Loading workspace data…</div>;
  if (error) return <div className="state-box state-error"><strong>Couldn’t load workspace data</strong><p>{error}</p></div>;
  if (empty) return <div className="state-box"><span className="empty-icon"><MessageSquare size={20} /></span><strong>Nothing here just yet</strong><p>Once you add data, it’ll show up here.</p></div>;
  return children;
}
function DashboardHome() {
  const [stats,setStats]=useState(null), [integrations,setIntegrations]=useState(null), [billing,setBilling]=useState(null);
  const [loading,setLoading]=useState(true), [error,setError]=useState("");
  async function load() {
    setLoading(true); setError("");
    try {
      const [analytics,campaigns,integrationsResponse,billingResponse]=await Promise.all([
        api.get("/analytics"), api.get("/campaigns"), api.get("/integrations"), api.get("/billing")
      ]);
      setStats({ ...analytics.data, campaigns: campaigns.data.campaigns || [] });
      setIntegrations(integrationsResponse.data);
      setBilling(billingResponse.data);
    } catch (e) { setError(e.response?.data?.error||"Check that the API server is running and try again."); }
    finally { setLoading(false); }
  }
  useEffect(()=>{load()},[]);
  const accepted=stats?.accepted||0;
  const delivered=stats?.delivered||0;
  const read=stats?.read||0;
  const failed=stats?.failed||0;
  return <>
    <PageTitle eyebrow="WORKSPACE" title="Workspace overview" description="Live activity and messaging health for your workspace." action={<Button onClick={load}><RefreshCw size={15} /> Refresh</Button>} />
    {error&&<div className="form-alert error-alert dash-error" role="alert">{error}</div>}
    <div className="metric-grid">{[[Users,"Total contacts",stats?.contacts||0],[Send,"Messages accepted",accepted],[Check,"Delivered messages",delivered],[Activity,"Read messages",read],[X,"Failed messages",failed]].map(([Icon,label,value])=><div className="metric-card" key={label}><div className="metric-top"><span className="metric-icon"><Icon size={17} /></span></div><strong>{loading?"—":Number(value).toLocaleString()}</strong><span>{label}</span></div>)}</div>
    <div className="dash-columns">
      <section className="dash-card performance-card"><div className="card-heading"><div><h2>Campaign performance</h2><p>Live workspace message totals</p></div></div><div className="performance-summary"><span><i className="dot-blue" /> Accepted <b>{accepted.toLocaleString()}</b></span><span><i className="dot-lightblue" /> Delivered <b>{delivered.toLocaleString()}</b></span><span>Read <b>{read.toLocaleString()}</b></span></div><p className="data-note">Time-series charts will appear when event aggregation is configured.</p></section>
      <section className="dash-card account-status"><div className="card-heading"><div><h2>WhatsApp account</h2><p>Server connection status</p></div><Link to="/app/accounts" className="card-more">View <ArrowRight size={14} /></Link></div><div className="account-empty"><span className="account-icon"><MessageSquare size={20} /></span><b>{integrations?.whatsapp.configured ? "Cloud API configured" : "Not configured"}</b><p>{integrations?.whatsapp.configured ? "Server credentials are available for the WhatsApp Cloud API." : "Configure Cloud API credentials in the backend before sending campaigns."}</p><Link to="/app/accounts" className="button button-primary button-small">View connection <ArrowRight size={14} /></Link></div></section>
    </div>
    <div className="dash-columns lower-dash"><section className="dash-card"><div className="card-heading"><div><h2>Recent campaigns</h2><p>Your latest campaign activity</p></div><Link className="card-more" to="/app/campaigns">View all <ArrowRight size={14} /></Link></div><CampaignTable campaigns={stats?.campaigns.slice(0,4)||[]} loading={loading} error={error} /></section><section className="dash-card plan-card-dash"><div className="card-heading"><div><h2>Plan & usage</h2><p>Live account totals</p></div><Link to="/app/billing" className="card-more">Manage <ArrowRight size={14} /></Link></div><div className="plan-used"><span>Messages this month</span><b>{billing?.usage.messagesThisMonth ?? "—"}</b></div><p className="usage-detail">{billing?.usage.contacts ?? "—"} contacts · {billing?.subscription.plan || "Plan unavailable"}</p><div className="plan-current"><span className="plan-badge">{billing?.subscription.billingStatus || "—"}</span><span>{billing?.subscription.plan || "—"} <small>subscription</small></span></div></section></div>
    <div className="quick-actions"><span>QUICK ACTIONS</span><Link to="/app/contacts"><Plus size={16} /> Add contact</Link><Link to="/app/create-campaign"><Send size={16} /> Create campaign</Link><Link to="/app/accounts"><MessageSquare size={16} /> WhatsApp account</Link></div>
  </>;
}
function CampaignTable({ campaigns, loading, error }) {
  return <DataState loading={loading} error={error} empty={!campaigns.length}><div className="table-scroll"><table className="dash-table"><thead><tr><th>Campaign</th><th>Status</th><th>Audience</th><th>Accepted</th></tr></thead><tbody>{campaigns.map((c,i)=><tr key={c._id||c.name}><td><span className="campaign-avatar">{c.name?.[0]||"C"}</span><span className="campaign-name">{c.name}<small>{c.templateName}</small></span></td><td><span className={`status-pill status-${c.status==="processing"?"running":c.status}`}>{c.status||"queued"}</span></td><td>{Number(c.total||0).toLocaleString()}</td><td>{Number(c.accepted||0).toLocaleString()}</td></tr>)}</tbody></table></div></DataState>;
}
function ContactsPage() {
  const [contacts,setContacts]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[query,setQuery]=useState(""),[form,setForm]=useState({name:"",phone:"",consentSource:"Website signup"}),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[showForm,setShowForm]=useState(false),[preview,setPreview]=useState(null);
  const inputRef=useRef(null);
  async function load(){setLoading(true);setError("");try{const {data}=await api.get("/contacts");setContacts(data.contacts||[]);}catch(e){setError(e.response?.data?.error||"Could not load contacts.");}finally{setLoading(false);}}
  useEffect(()=>{load()},[]);
  const filtered=useMemo(()=>contacts.filter(c=>`${c.name||""} ${c.phone||""}`.toLowerCase().includes(query.toLowerCase())),[contacts,query]);
  async function add(e){e.preventDefault();setBusy(true);setMessage("");try{await api.post("/contacts",{...form,optedIn:true,consentedAt:new Date().toISOString()});setForm({name:"",phone:"",consentSource:"Website signup"});setMessage("Contact saved with opt-in details.");setShowForm(false);await load();}catch(e){setMessage(e.response?.data?.error||"Could not save contact.");}finally{setBusy(false);}}
  async function optOut(contact){if(!window.confirm(`Opt ${contact.name||contact.phone} out of WhatsApp messages?`))return;try{await api.post(`/contacts/${contact._id}/opt-out`);await load();}catch(e){setMessage(e.response?.data?.error||"Could not update consent.");}}
  function downloadCsv(){const rows=[["Name","Phone","Opted in","Consent source","Consented at"],...filtered.map(c=>[c.name||"",c.phone,c.optedIn?"Yes":"No",c.consentSource||"",c.consentedAt||""])];const csv=rows.map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));const a=document.createElement("a");a.href=url;a.download="whats-send-contacts.csv";a.click();URL.revokeObjectURL(url);}
  async function parseFile(file){const text=await file.text();let rows=[];if(file.name.toLowerCase().endsWith(".json")){try{const parsed=JSON.parse(text);rows=Array.isArray(parsed)?parsed:parsed.contacts||[];}catch{setMessage("Could not read JSON. Provide an array of contact objects.");return;}}else{const lines=text.trim().split(/\r?\n/);const headers=lines.shift()?.split(",").map(x=>x.trim().toLowerCase().replaceAll(/["']/g,""))||[];rows=lines.map(line=>{const values=line.split(",").map(x=>x.trim().replace(/^"|"$/g,""));return Object.fromEntries(headers.map((h,i)=>[h,values[i]||""]));});}
    setPreview(rows.map(r=>({name:r.name||"",phone:String(r.phone||"").replace(/\D/g,""),optedIn:r.optedIn===true||String(r.optedIn).toLowerCase()==="true"||String(r.optedIn).toLowerCase()==="yes",consentSource:r.consentSource||"",consentedAt:r.consentedAt||""})));
  }
  async function importContacts(){if(!preview)return;setBusy(true);try{const {data}=await api.post("/contacts/import",{contacts:preview});setMessage(`Import complete: ${data.imported} saved, ${data.skipped} skipped (valid opt-in and consent source required).`);setPreview(null);await load();}catch(e){setMessage(e.response?.data?.error||"Import failed.");}finally{setBusy(false);}}
  return <><PageTitle eyebrow="AUDIENCE" title="Contacts" description="Manage your audience and keep consent visible at every step." action={<><Button onClick={downloadCsv}><ArrowDownToLine size={15} /> Export</Button><button className="button button-primary dash-button" onClick={()=>setShowForm(!showForm)}><Plus size={16} /> Add contact</button></>} />
    <div className="consent-banner"><ShieldCheck size={17} /><span><b>Permission first.</b> Only opted-in contacts can be added to campaign audiences. Record how and when they agreed.</span></div>
    {message&&<div className="form-alert info-alert dash-error" role="status">{message}<button aria-label="Dismiss" onClick={()=>setMessage("")}><X size={14} /></button></div>}
    {showForm&&<section className="dash-card contact-add"><div className="card-heading"><div><h2>Add opted-in contact</h2><p>Only add people who explicitly agreed to WhatsApp messages.</p></div><button className="icon-button" onClick={()=>setShowForm(false)} aria-label="Close"><X size={17} /></button></div><form className="contact-add-form" onSubmit={add}><label>Name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Contact name" /></label><label>Phone number<input required pattern="[0-9]{8,15}" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="919876543210" /><small>Country code, digits only</small></label><label>Consent source<input required value={form.consentSource} onChange={e=>setForm({...form,consentSource:e.target.value})} placeholder="Website signup" /></label><button disabled={busy} className="button button-primary">{busy?"Saving…":"Save opted-in contact"}</button></form></section>}
    <section className="dash-card contacts-card"><div className="contacts-toolbar"><div><h2>All contacts <span className="count-chip">{contacts.length}</span></h2><p>Search your audience and manage opt-in status.</p></div><div className="contact-tools"><label className="table-search"><Search size={16} /><input placeholder="Search name or phone" value={query} onChange={e=>setQuery(e.target.value)} /></label><Button onClick={()=>inputRef.current?.click()}><FileUp size={15} /> Import</Button><input ref={inputRef} type="file" accept=".csv,.json" hidden onChange={e=>e.target.files?.[0]&&parseFile(e.target.files[0])} /></div></div>
      {preview&&<div className="import-preview"><div><b>Import preview</b><span>{preview.length} rows · only opted-in contacts with consent details will be imported</span></div><Button onClick={()=>setPreview(null)}>Cancel</Button><button className="button button-primary button-small" onClick={importContacts} disabled={busy}>{busy?"Importing…":"Confirm import"}</button><div className="table-scroll import-table"><table className="dash-table"><thead><tr><th>Name</th><th>Phone</th><th>Opt-in</th><th>Consent source</th></tr></thead><tbody>{preview.slice(0,5).map((c,i)=><tr key={i}><td>{c.name||"—"}</td><td>{c.phone}</td><td>{c.optedIn?"Yes":"No"}</td><td>{c.consentSource||"Missing"}</td></tr>)}</tbody></table></div></div>}
      <DataState loading={loading} error={error} empty={!filtered.length}><div className="table-scroll"><table className="dash-table"><thead><tr><th><input type="checkbox" aria-label="Select all contacts" /></th><th>Contact</th><th>Phone number</th><th>Opt-in status</th><th>Consent source</th><th>Added</th><th /></tr></thead><tbody>{filtered.map(c=><tr key={c._id}><td><input type="checkbox" aria-label={`Select ${c.name||c.phone}`} /></td><td><span className="contact-avatar">{(c.name||c.phone||"?")[0].toUpperCase()}</span><span className="campaign-name">{c.name||"Unnamed contact"}<small>Contact</small></span></td><td>{c.phone}</td><td><span className={`consent-pill ${c.optedIn?"consent-yes":"consent-no"}`}><i />{c.optedIn?"Opted in":"Opted out"}</span></td><td>{c.consentSource||"—"}</td><td>{c.createdAt?new Date(c.createdAt).toLocaleDateString():"—"}</td><td>{c.optedIn&&<button className="table-action" onClick={()=>optOut(c)}>Opt out</button>}</td></tr>)}</tbody></table></div><div className="table-footer">Showing {filtered.length} of {contacts.length} contacts<span>Page 1 of 1</span></div></DataState>
    </section>
  </>;
}
function CampaignsPage({create=false}) {
  const [campaigns,setCampaigns]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[form,setForm]=useState({name:"",templateName:"",languageCode:"en_US",scheduledAt:""}),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
  async function load(){setLoading(true);try{const {data}=await api.get("/campaigns");setCampaigns(data.campaigns||[]);setError("");}catch(e){setError(e.response?.data?.error||"Could not load campaigns.");}finally{setLoading(false);}}
  useEffect(()=>{load()},[]);
  async function submit(e){e.preventDefault();setBusy(true);setMessage("");try{const payload={...form,scheduledAt:form.scheduledAt?new Date(form.scheduledAt).toISOString():undefined};const {data}=await api.post("/campaigns",payload);setMessage(data.campaign.status==="scheduled"?`Campaign scheduled for ${new Date(data.campaign.scheduledAt).toLocaleString()}.`:`Campaign queued for ${data.campaign.total} opted-in contacts.`);setForm({name:"",templateName:"",languageCode:"en_US",scheduledAt:""});await load();}catch(e){setMessage(e.response?.data?.error||"Could not create campaign.");}finally{setBusy(false);}}
  return <><PageTitle eyebrow="MESSAGING" title={create?"Create campaign":"Campaigns"} description="Send approved WhatsApp templates to people who opted in." action={!create&&<Link className="button button-primary dash-button" to="/app/create-campaign"><Plus size={16} /> Create campaign</Link>} />
    <div className="consent-banner"><ShieldCheck size={17} /><span><b>Template-first, opt-in only.</b> Campaigns use approved templates and only contacts with recorded permission.</span></div>
    {message&&<div className={`form-alert ${message.startsWith("Campaign ")?"info-alert":"error-alert"} dash-error`} role="status">{message}</div>}
    {create&&<section className="dash-card campaign-create"><div className="card-heading"><div><h2>Campaign details</h2><p>Provide the exact approved template name and language from WhatsApp Manager.</p></div></div><form onSubmit={submit}><label>Campaign name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. November product update" /></label><label>Approved template name<input required pattern="[a-z0-9_]+" value={form.templateName} onChange={e=>setForm({...form,templateName:e.target.value})} placeholder="e.g. monthly_update" /></label><label>Template language<input required value={form.languageCode} onChange={e=>setForm({...form,languageCode:e.target.value})} placeholder="en_US" /></label><label>Schedule for (optional)<input type="datetime-local" value={form.scheduledAt} min={new Date().toISOString().slice(0,16)} onChange={e=>setForm({...form,scheduledAt:e.target.value})} /></label><div className="template-note"><MessageSquare size={16} /><span>This starter supports approved templates without dynamic variables. Review the audience and template in WhatsApp Manager before sending.</span></div><button className="button button-primary" disabled={busy}><Send size={15} />{busy?"Queueing…":form.scheduledAt?"Schedule campaign":"Queue campaign"}</button></form></section>}
    <section className="dash-card"><div className="card-heading"><div><h2>{create?"Campaign history":"All campaigns"}</h2><p>Campaign acceptance does not guarantee delivery.</p></div><Button onClick={load}><RefreshCw size={15} /> Refresh</Button></div><CampaignTable campaigns={campaigns} loading={loading} error={error} /></section>
  </>;
}
const dashboardModules={
  accounts:{title:"WhatsApp accounts",eyebrow:"CHANNELS",desc:"Connect and manage your official WhatsApp Business Platform accounts.",icon:MessageSquare,items:[["Account connection","Not connected"],["Cloud API credentials","Configure on backend"],["Webhook status","Not configured"]],action:"Account connection is not available until the backend onboarding API is configured."},
  groups:{title:"Groups & tags",eyebrow:"AUDIENCE",desc:"Organize contacts with useful segments for more relevant communication.",icon:Users,items:[["Customer group","Audience segmentation"],["Tags","Contact labels"],["Dynamic segments","Coming with API integration"]],action:"Group and tag management needs a tenant-scoped contacts API."},
  scheduled:{title:"Scheduled campaigns",eyebrow:"MESSAGING",desc:"Review upcoming sends and keep timing under control.",icon:CalendarDays,items:[["Upcoming","No scheduled campaigns"],["Timezone","Workspace settings"],["Queue","Campaign scheduler API not connected"]],action:"Scheduling is not yet available in the server API."},
  history:{title:"Message history",eyebrow:"MESSAGING",desc:"Track message status and review delivery events from your campaigns.",icon:Activity,items:[["Accepted","Status from Meta API"],["Delivered","Requires webhook events"],["Read","Requires webhook events"]],action:"Message history is available per campaign in the backend; workspace-wide filtering is not implemented."},
  templates:{title:"Message templates",eyebrow:"MESSAGING",desc:"Use approved Meta templates and keep language and status easy to review.",icon:MessageSquare,items:[["Template sync","Meta template API not connected"],["Approval status","Managed in WhatsApp Manager"],["Variable mapping","Not supported by current API"]],action:"Template synchronization requires a configured server-side Meta integration."},
  automation:{title:"Automation",eyebrow:"WORKFLOWS",desc:"Create helpful, timely follow-ups with clear triggers and guardrails.",icon:Zap,items:[["Event-based triggers","API connection needed"],["Scheduled messages","Scheduler integration needed"],["Automation history","Not available"]],action:"Automation endpoints are not present in the current backend."},
  integrations:{title:"API integration",eyebrow:"DEVELOPERS",desc:"Connect your tools without putting credentials in browser code.",icon:Settings2,items:[["API base URL",import.meta.env.VITE_API_URL||"http://localhost:4000/api"],["API credentials","Managed on backend"],["Webhooks","Configure HTTPS endpoint"]],action:"Keep Meta, database and payment credentials on your server. Tenant-scoped API access must be enforced by the backend."},
  team:{title:"Team members",eyebrow:"WORKSPACE",desc:"Manage access for the people who help care for your customer conversations.",icon:Users,items:[["Workspace owner","Signed-in administrator"],["Roles","Role API not connected"],["Invitations","Not available"]],action:"Team invitation and role management need backend support."},
  analytics:{title:"Analytics",eyebrow:"INSIGHTS",desc:"Understand accepted, delivered and read messages over time.",icon:BarChart3,items:[["Campaign performance","Requires delivery webhooks"],["Audience trends","Contact insights API needed"],["Exports","Available in contacts"]],action:"Analytics below the campaign level require webhook aggregation APIs."},
  billing:{title:"Billing & subscription",eyebrow:"WORKSPACE",desc:"Review plan options and subscription usage.",icon:Activity,items:[["Current plan","Growth · demo preview"],["Monthly usage","Billing API not connected"],["Invoices","No billing provider connected"]],action:"Razorpay checkout and subscription management are not connected. No payment will be initiated."},
  settings:{title:"Workspace settings",eyebrow:"PREFERENCES",desc:"Set up your business workspace and keep operational details up to date.",icon:Settings2,items:[["Workspace name","Studio North"],["Messaging preferences","Consent-first"],["Security","Session is backed by server JWT"]],action:"Workspace settings and tenant onboarding require tenant-aware backend APIs."},
  support:{title:"Help & support",eyebrow:"SUPPORT",desc:"Find guidance for setup, compliance and campaign workflows.",icon:CircleHelp,items:[["Getting started","Read the setup guide"],["Messaging compliance","Review opt-in requirements"],["Support tickets","Ticket API not connected"]],action:"Support ticket submission is not connected to a backend."},
  admin:{title:"Platform administration",eyebrow:"ADMIN PORTAL",desc:"Protected platform controls are shown as a preview. The current API has no tenant or admin-role model.",icon:ShieldCheck,items:[["Businesses","Tenant API not configured"],["Subscriptions","Billing API not configured"],["Audit logs","Audit API not configured"]],action:"Do not use this preview for administrative actions. Enforce role checks and tenant isolation on every server API."},
};
export default function DashboardPages() {
  const location=useLocation();
  return <Routes>
    <Route path="dashboard" element={<DashboardHome />} />
    <Route path="contacts" element={<ContactsPage />} />
    <Route path="campaigns" element={<CampaignsPage />} />
    <Route path="create-campaign" element={<CampaignsPage create />} />
    {Object.keys(dashboardModules).map(path=><Route key={path} path={path} element={<IntegratedModule slug={path} />} />)}
    <Route path="*" element={<Navigate to="/app/dashboard" replace state={{from:location.pathname}} />} />
  </Routes>;
}
