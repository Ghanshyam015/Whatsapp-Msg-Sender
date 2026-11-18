import { useEffect, useState } from "react";
import api from "../services/api.js";

function Page({ title, description, children }) {
  return <><div className="dash-page-head"><div><span className="dash-eyebrow">WORKSPACE</span><h1>{title}</h1><p>{description}</p></div></div>{children}</>;
}

function Notice({ error, message }) {
  if (error) return <div className="form-alert error-alert" role="alert">{error}</div>;
  if (message) return <div className="form-alert info-alert" role="status">{message}</div>;
  return null;
}

function LoadError({ error, retry }) {
  return <div className="state-box state-error"><strong>Couldn’t load workspace data</strong><p>{error}</p><button className="button button-secondary" onClick={retry}>Try again</button></div>;
}

function AccountsPage() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  async function load() {
    setError("");
    try { setStatus((await api.get("/integrations")).data); }
    catch (requestError) { setError(requestError.response?.data?.error || "Could not load integration status."); }
  }
  useEffect(() => { load(); }, []);
  return <Page title="WhatsApp accounts" description="Check the server-side WhatsApp Business Platform connection.">
    {error ? <LoadError error={error} retry={load} /> : !status ? <div className="state-box">Loading connection status…</div> :
      <section className="module-grid">{[
        ["Cloud API", status.whatsapp.configured ? "Connected" : "Not configured"],
        ["Templates", status.whatsapp.templatesConfigured ? "Available" : "Not configured"],
        ["Webhook verification", status.whatsapp.webhookConfigured ? "Configured" : "Not configured"]
      ].map(([label, value]) => <article className="module-card" key={label}><span className="module-card-label">{label}</span><b>{value}</b><small>Credentials are managed on the backend.</small></article>)}</section>}
    <div className="dash-card integration-help"><h2>Connect a WhatsApp Business account</h2><p>Set WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_BUSINESS_ACCOUNT_ID, and the webhook settings in the server environment. Credentials are never sent to the browser.</p></div>
  </Page>;
}

function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function load() {
    try {
      const [groupResponse, contactResponse] = await Promise.all([api.get("/groups"), api.get("/contacts")]);
      const nextGroups = groupResponse.data.groups || [];
      setGroups(nextGroups);
      setContacts(contactResponse.data.contacts || []);
      setSelectedGroup(current => current || nextGroups[0]?._id || "");
      setError("");
    }
    catch (requestError) { setError(requestError.response?.data?.error || "Could not load groups."); }
  }
  useEffect(() => { load(); }, []);
  async function create(event) {
    event.preventDefault(); setError(""); setMessage("");
    try {
      await api.post("/groups", { name });
      setName(""); setMessage("Group created."); await load();
    } catch (requestError) { setError(requestError.response?.data?.error || "Could not create group."); }
  }
  async function remove(id) {
    setError(""); setMessage("");
    try { await api.delete(`/groups/${id}`); setMessage("Group deleted."); await load(); }
    catch (requestError) { setError(requestError.response?.data?.error || "Could not delete group."); }
  }
  async function assign(event) {
    event.preventDefault(); setError(""); setMessage("");
    try {
      const { data } = await api.post(`/groups/${selectedGroup}/contacts`, { contactIds: selectedContacts });
      setMessage(`${data.updated} contacts added to the group.`); setSelectedContacts([]);
    } catch (requestError) { setError(requestError.response?.data?.error || "Could not assign contacts."); }
  }
  return <Page title="Groups & tags" description="Create workspace groups for organizing contacts.">
    <Notice error={error} message={message} />
    <form className="contact-add-form dash-card" onSubmit={create}><label>Group name<input value={name} onChange={event => setName(event.target.value)} maxLength="80" required /></label><button className="button button-primary">Create group</button></form>
    <section className="module-grid">{groups.map(group => <article className="module-card" key={group._id}><b>{group.name}</b><button className="button button-secondary" onClick={() => remove(group._id)}>Delete</button></article>)}</section>
    {!groups.length && !error && <div className="state-box">No groups yet. Create one to organize your contacts.</div>}
    {groups.length > 0 && <form className="contact-add-form dash-card" onSubmit={assign}>
      <label>Group<select value={selectedGroup} onChange={event => setSelectedGroup(event.target.value)}>{groups.map(group => <option value={group._id} key={group._id}>{group.name}</option>)}</select></label>
      <label>Contacts<select multiple value={selectedContacts} onChange={event => setSelectedContacts(Array.from(event.target.selectedOptions, option => option.value))}>{contacts.map(contact => <option value={contact._id} key={contact._id}>{contact.name || contact.phone}</option>)}</select></label>
      <button className="button button-primary" disabled={!selectedContacts.length}>Add contacts to group</button>
    </form>}
  </Page>;
}

function ScheduledPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [error, setError] = useState("");
  async function load() {
    try {
      const { data } = await api.get("/campaigns");
      setCampaigns((data.campaigns || []).filter(campaign => campaign.scheduledAt && new Date(campaign.scheduledAt) > new Date()));
      setError("");
    } catch (requestError) { setError(requestError.response?.data?.error || "Could not load scheduled campaigns."); }
  }
  useEffect(() => { load(); }, []);
  return <Page title="Scheduled campaigns" description="Campaigns scheduled for a future send time.">
    {error ? <LoadError error={error} retry={load} /> : <section className="dash-card">{campaigns.length ? campaigns.map(campaign =>
      <article className="module-card" key={campaign._id}><b>{campaign.name}</b><span>{campaign.templateName}</span><small>{new Date(campaign.scheduledAt).toLocaleString()}</small></article>
    ) : <div className="state-box">No upcoming campaigns. Choose a future send time when creating a campaign.</div>}</section>}
  </Page>;
}

function HistoryPage() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  async function load() {
    try { setLogs((await api.get("/campaigns/logs")).data.logs || []); setError(""); }
    catch (requestError) { setError(requestError.response?.data?.error || "Could not load message history."); }
  }
  useEffect(() => { load(); }, []);
  return <Page title="Message history" description="Message statuses from campaign jobs and WhatsApp webhooks.">
    {error ? <LoadError error={error} retry={load} /> : <div className="dash-card"><div className="table-scroll"><table className="dash-table"><thead><tr><th>Campaign</th><th>Recipient</th><th>Status</th><th>Updated</th></tr></thead><tbody>
      {logs.map(log => <tr key={log._id}><td>{log.campaignId?.name || "Campaign"}</td><td>{log.phone || "Contact"}</td><td>{log.status}</td><td>{new Date(log.updatedAt).toLocaleString()}</td></tr>)}
    </tbody></table></div>{!logs.length && <div className="state-box">No messages have been queued yet.</div>}</div>}
  </Page>;
}

function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function load() {
    setLoading(true); setError("");
    try { setTemplates((await api.get("/templates")).data.templates || []); }
    catch (requestError) { setError(requestError.response?.data?.error || "Could not sync templates."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  return <Page title="Message templates" description="Approved WhatsApp templates synced from Meta.">
    <div className="dash-card"><button className="button button-secondary" onClick={load} disabled={loading}>{loading ? "Syncing…" : "Sync templates"}</button>
      {error ? <p className="form-alert error-alert" role="alert">{error}</p> : <div className="table-scroll"><table className="dash-table"><thead><tr><th>Name</th><th>Language</th><th>Status</th><th>Category</th></tr></thead><tbody>{templates.map(template =>
        <tr key={`${template.name}-${template.language}`}><td>{template.name}</td><td>{template.language}</td><td>{template.status}</td><td>{template.category}</td></tr>
      )}</tbody></table>{!templates.length && !loading && <div className="state-box">No templates loaded. Configure WhatsApp Business API credentials to sync.</div>}</div>}
    </div>
  </Page>;
}

function AutomationPage() {
  const [automations, setAutomations] = useState([]);
  const [form, setForm] = useState({ name: "", templateName: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function load() {
    try { setAutomations((await api.get("/automations")).data.automations || []); setError(""); }
    catch (requestError) { setError(requestError.response?.data?.error || "Could not load automations."); }
  }
  useEffect(() => { load(); }, []);
  async function create(event) {
    event.preventDefault(); setError(""); setMessage("");
    try {
      const { data } = await api.post("/automations", { ...form, trigger: "contact.created" });
      setMessage(data.message); setForm({ name: "", templateName: "" }); await load();
    } catch (requestError) { setError(requestError.response?.data?.error || "Could not save automation."); }
  }
  return <Page title="Automation" description="Save contact-created automation rules; execution stays disabled until supported by a connected channel.">
    <Notice error={error} message={message} />
    <form className="contact-add-form dash-card" onSubmit={create}><label>Rule name<input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required /></label><label>Approved template name<input pattern="[a-z0-9_]+" value={form.templateName} onChange={event => setForm({ ...form, templateName: event.target.value })} required /></label><button className="button button-primary">Save disabled rule</button></form>
    <section className="module-grid">{automations.map(rule => <article className="module-card" key={rule._id}><b>{rule.name}</b><span>{rule.trigger} · {rule.templateName}</span><small>{rule.enabled ? "Enabled" : "Saved disabled"}</small></article>)}</section>
  </Page>;
}

function IntegrationsPage() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  async function load() {
    try { setStatus((await api.get("/integrations")).data); setError(""); }
    catch (requestError) { setError(requestError.response?.data?.error || "Could not load integration status."); }
  }
  useEffect(() => { load(); }, []);
  return <Page title="API integration" description="View API and provider readiness without exposing server credentials.">
    {error ? <LoadError error={error} retry={load} /> : !status ? <div className="state-box">Loading integration status…</div> :
      <div className="module-grid">{Object.entries(status).map(([provider, value]) => <article className="module-card" key={provider}><span className="module-card-label">{provider}</span><b>{value.connected || value.configured || value.templatesConfigured ? "Configured" : "Not configured"}</b><small>Credentials remain server-side.</small></article>)}</div>}
    <div className="dash-card integration-help"><h2>Development API URL</h2><p>{import.meta.env.VITE_API_URL || `${window.location.origin}/api`}</p><p>Provider secrets must be set in the backend environment.</p></div>
  </Page>;
}

function TeamPage() {
  const [data, setData] = useState({ members: [], invitations: [] });
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function load() {
    try { setData((await api.get("/team")).data); setError(""); }
    catch (requestError) { setError(requestError.response?.data?.error || "Could not load team members."); }
  }
  useEffect(() => { load(); }, []);
  async function invite(event) {
    event.preventDefault(); setError(""); setMessage("");
    try {
      await api.post("/team/invites", { email, role });
      setMessage("Invitation email sent."); setEmail(""); await load();
    } catch (requestError) { setError(requestError.response?.data?.error || "Could not send invitation."); }
  }
  return <Page title="Team members" description="Invite people to this workspace by email.">
    <Notice error={error} message={message} />
    <form className="contact-add-form dash-card" onSubmit={invite}><label>Email<input type="email" value={email} onChange={event => setEmail(event.target.value)} required /></label><label>Role<select value={role} onChange={event => setRole(event.target.value)}><option value="member">Member</option><option value="admin">Admin</option></select></label><button className="button button-primary">Send invite</button></form>
    <section className="dash-card"><h2>Members</h2>{data.members.map(member => <article className="module-card" key={member._id}><b>{member.name || member.email}</b><span>{member.role} · {member.emailVerified ? "Verified" : "Unverified"}</span></article>)}
      <h2>Pending invitations</h2>{data.invitations.map(invite => <article className="module-card" key={invite._id}><b>{invite.email}</b><span>{invite.role} · expires {new Date(invite.expiresAt).toLocaleDateString()}</span></article>)}
    </section>
  </Page>;
}

function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  async function load() {
    try { setData((await api.get("/analytics")).data); setError(""); }
    catch (requestError) { setError(requestError.response?.data?.error || "Could not load analytics."); }
  }
  useEffect(() => { load(); }, []);
  return <Page title="Analytics" description="Workspace activity from contacts, campaign jobs, and delivery webhooks.">
    {error ? <LoadError error={error} retry={load} /> : !data ? <div className="state-box">Loading analytics…</div> :
      <div className="metric-grid">{Object.entries(data).map(([label, value]) => <article className="metric-card" key={label}><strong>{Number(value).toLocaleString()}</strong><span>{label}</span></article>)}</div>}
  </Page>;
}

function BillingPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function load() {
    try { setData((await api.get("/billing")).data); setError(""); }
    catch (requestError) { setError(requestError.response?.data?.error || "Could not load billing."); }
  }
  useEffect(() => { load(); }, []);
  async function choosePlan(plan) {
    setError(""); setMessage("");
    try {
      const { data: order } = await api.post("/billing/checkout", { plan });
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = resolve;
          script.onerror = () => reject(new Error("Could not load Razorpay checkout."));
          document.body.appendChild(script);
        });
      }
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Whats Send",
        description: `${order.plan} plan`,
        handler: async payment => {
          try {
            await api.post("/billing/verify", {
              orderId: payment.razorpay_order_id,
              paymentId: payment.razorpay_payment_id,
              signature: payment.razorpay_signature
            });
            setMessage("Payment verified and plan updated."); await load();
          }
          catch (requestError) { setError(requestError.response?.data?.error || "Could not verify the payment."); }
        }
      });
      checkout.open();
    } catch (requestError) { setError(requestError.response?.data?.error || requestError.message || "Could not start checkout."); }
  }
  return <Page title="Billing & subscription" description="Review workspace usage and purchase a 30-day plan.">
    <Notice error={error} message={message} />
    {!data ? <div className="state-box">Loading billing…</div> : <>
      <div className="module-grid"><article className="module-card"><span>Current plan</span><b>{data.subscription.plan}</b></article><article className="module-card"><span>Billing status</span><b>{data.subscription.billingStatus}</b></article><article className="module-card"><span>Contacts</span><b>{data.usage.contacts}</b></article><article className="module-card"><span>Messages this month</span><b>{data.usage.messagesThisMonth}</b></article></div>
      <div className="billing-plan-grid">{data.plans.map(plan => <article className="dash-card billing-plan" key={plan.id}><span className="dash-eyebrow">30-DAY PLAN</span><h3>{plan.name}</h3><b>₹{plan.amount.toLocaleString("en-IN")} / month</b><p>Up to {plan.contacts.toLocaleString()} contacts. WhatsApp fees are billed separately.</p><button className="button button-primary" disabled={!data.paymentsConfigured} onClick={() => choosePlan(plan.id)}>{data.paymentsConfigured ? "Choose plan" : "Razorpay not configured"}</button></article>)}</div>
    </>}
  </Page>;
}

function SettingsPage() {
  const [form, setForm] = useState({ name: "", timezone: "UTC" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    api.get("/workspace").then(({ data }) => setForm({ name: data.workspace.name, timezone: data.workspace.timezone }))
      .catch(requestError => setError(requestError.response?.data?.error || "Could not load workspace settings."));
  }, []);
  async function save(event) {
    event.preventDefault(); setError(""); setMessage("");
    try { const { data } = await api.patch("/workspace", form); setForm({ name: data.workspace.name, timezone: data.workspace.timezone }); setMessage("Workspace settings saved."); }
    catch (requestError) { setError(requestError.response?.data?.error || "Could not save workspace settings."); }
  }
  return <Page title="Workspace settings" description="Update workspace identity and timezone.">
    <Notice error={error} message={message} />
    <form className="contact-add-form dash-card" onSubmit={save}><label>Workspace name<input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required /></label><label>Timezone<input value={form.timezone} onChange={event => setForm({ ...form, timezone: event.target.value })} required /></label><button className="button button-primary">Save settings</button></form>
  </Page>;
}

function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", topic: "Technical support", message: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function load() {
    try { setTickets((await api.get("/support")).data.tickets || []); }
    catch (requestError) { setError(requestError.response?.data?.error || "Could not load support requests."); }
  }
  useEffect(() => { load(); }, []);
  async function submit(event) {
    event.preventDefault(); setError(""); setMessage("");
    try {
      const { data } = await api.post("/support", form);
      setMessage(`Support request received (${data.ticket.id}).`); setForm(current => ({ ...current, message: "" })); await load();
    } catch (requestError) { setError(requestError.response?.data?.error || "Could not submit the support request."); }
  }
  return <Page title="Help & support" description="Send a support request and review requests from this workspace.">
    <Notice error={error} message={message} />
    <form className="contact-add-form dash-card" onSubmit={submit}><label>Name<input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required /></label><label>Email<input type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} required /></label><label>Topic<select value={form.topic} onChange={event => setForm({ ...form, topic: event.target.value })}><option>Getting started</option><option>Plans and billing</option><option>Technical support</option><option>Something else</option></select></label><label>Message<textarea rows="4" minLength="10" value={form.message} onChange={event => setForm({ ...form, message: event.target.value })} required /></label><button className="button button-primary">Submit request</button></form>
    <section className="dash-card"><h2>Recent requests</h2>{tickets.map(ticket => <article className="module-card" key={ticket._id}><b>{ticket.topic}</b><span>{ticket.status} · {new Date(ticket.createdAt).toLocaleString()}</span><p>{ticket.message}</p></article>)}</section>
  </Page>;
}

function AdminPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [error, setError] = useState("");
  async function load() {
    try { setWorkspaces((await api.get("/admin/workspaces")).data.workspaces || []); setError(""); }
    catch (requestError) { setError(requestError.response?.data?.error || "Could not load platform workspaces."); }
  }
  useEffect(() => { load(); }, []);
  return <Page title="Platform administration" description="Protected platform-level workspace overview.">
    {error ? <LoadError error={error} retry={load} /> : <section className="dash-card">{workspaces.map(workspace => <article className="module-card" key={workspace._id}><b>{workspace.name}</b><span>{workspace.owner?.email || "No owner"} · {workspace.plan}</span><small>{new Date(workspace.createdAt).toLocaleDateString()}</small></article>)}</section>}
  </Page>;
}

export default function IntegratedModule({ slug }) {
  const pages = {
    accounts: AccountsPage, groups: GroupsPage, scheduled: ScheduledPage, history: HistoryPage,
    templates: TemplatesPage, automation: AutomationPage, integrations: IntegrationsPage,
    team: TeamPage, analytics: AnalyticsPage, billing: BillingPage, settings: SettingsPage,
    support: SupportPage, admin: AdminPage
  };
  const Component = pages[slug];
  return Component ? <Component /> : null;
}
