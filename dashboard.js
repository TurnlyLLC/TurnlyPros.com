const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginCard = document.getElementById("loginCard");
const app = document.getElementById("app");
const loginBtn = document.getElementById("loginBtn");
const signOutBtn = document.getElementById("signOutBtn");
const loginStatus = document.getElementById("loginStatus");
const leadsBody = document.getElementById("leadsBody");
const refreshBtn = document.getElementById("refreshBtn");
const statusFilter = document.getElementById("statusFilter");

loginBtn.addEventListener("click", login);
signOutBtn.addEventListener("click", signOut);
refreshBtn.addEventListener("click", loadLeads);
statusFilter.addEventListener("change", loadLeads);

init();

async function init(){
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    showApp();
    await loadLeads();
  }
}

async function login(){
  loginStatus.textContent = "Logging in...";

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    loginStatus.textContent = error.message;
    return;
  }

  loginStatus.textContent = "";
  showApp();
  await loadLeads();
}

async function signOut(){
  await supabaseClient.auth.signOut();
  loginCard.classList.remove("hidden");
  app.classList.add("hidden");
  signOutBtn.classList.add("hidden");
}

function showApp(){
  loginCard.classList.add("hidden");
  app.classList.remove("hidden");
  signOutBtn.classList.remove("hidden");
}

async function loadLeads(){
  leadsBody.innerHTML = `<tr><td colspan="8">Loading...</td></tr>`;

  let query = supabaseClient
    .from("commercial_leads")
    .select("*")
    .order("created_at", { ascending:false })
    .limit(100);

  if (statusFilter.value) {
    query = query.eq("lead_status", statusFilter.value);
  }

  const { data, error } = await query;

  if (error) {
    leadsBody.innerHTML = `<tr><td colspan="8">Error: ${escapeHtml(error.message)}</td></tr>`;
    return;
  }

  updateStats(data || []);

  if (!data || data.length === 0) {
    leadsBody.innerHTML = `<tr><td colspan="8">No leads found.</td></tr>`;
    return;
  }

  leadsBody.innerHTML = data.map(renderLeadRow).join("");

  document.querySelectorAll("[data-save]").forEach(btn => {
    btn.addEventListener("click", () => saveLead(btn.dataset.save));
  });
}

function renderLeadRow(lead){
  const created = new Date(lead.created_at).toLocaleString();

  return `
    <tr>
      <td>${created}</td>
      <td>
        <strong>${escapeHtml(lead.name)}</strong><br/>
        <span class="muted">${escapeHtml(lead.city || "")}</span>
      </td>
      <td>${escapeHtml(lead.facility_type || "")}</td>
      <td>${escapeHtml(lead.service_interest || "")}</td>
      <td>
        <a href="mailto:${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</a><br/>
        <a href="tel:${escapeHtml(lead.phone)}">${escapeHtml(lead.phone)}</a>
      </td>
      <td>
        <select id="status-${lead.id}">
          ${statusOptions(lead.lead_status)}
        </select>
      </td>
      <td>
        <textarea id="notes-${lead.id}" placeholder="Internal notes...">${escapeHtml(lead.internal_notes || "")}</textarea>
        ${lead.message ? `<p class="muted"><strong>Message:</strong> ${escapeHtml(lead.message)}</p>` : ""}
      </td>
      <td><button data-save="${lead.id}">Save</button></td>
    </tr>
  `;
}

function statusOptions(current){
  const statuses = [
    "new",
    "contacted",
    "walkthrough_scheduled",
    "walkthrough_completed",
    "quote_sent",
    "contract_sent",
    "won",
    "lost",
    "not_a_fit"
  ];

  return statuses
    .map(s => `<option value="${s}" ${s === current ? "selected" : ""}>${s.replaceAll("_", " ")}</option>`)
    .join("");
}

async function saveLead(id){
  const lead_status = document.getElementById(`status-${id}`).value;
  const internal_notes = document.getElementById(`notes-${id}`).value;

  const patch = {
    lead_status,
    internal_notes
  };

  if (lead_status === "contacted") patch.contacted_at = new Date().toISOString();
  if (lead_status === "walkthrough_scheduled") patch.walkthrough_scheduled_at = new Date().toISOString();
  if (lead_status === "quote_sent") patch.quote_sent_at = new Date().toISOString();
  if (lead_status === "won") patch.won_at = new Date().toISOString();
  if (lead_status === "lost") patch.lost_at = new Date().toISOString();

  const { error } = await supabaseClient
    .from("commercial_leads")
    .update(patch)
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  await loadLeads();
}

function updateStats(leads){
  document.getElementById("statNew").textContent = leads.filter(l => l.lead_status === "new").length;
  document.getElementById("statWalkthrough").textContent = leads.filter(l => l.lead_status === "walkthrough_scheduled").length;
  document.getElementById("statQuotes").textContent = leads.filter(l => l.lead_status === "quote_sent").length;
  document.getElementById("statWon").textContent = leads.filter(l => l.lead_status === "won").length;
}

function escapeHtml(value){
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
