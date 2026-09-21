(() => {
  const form = document.getElementById('residentFeedbackForm');
  if (!form) return;
  const $ = id => document.getElementById(id);
  const path = location.pathname;
  const match = path.match(/^\/f\/([a-f0-9]{64})\/?$/i);
  const token = match?.[1].toLowerCase();
  const preview = /^\/feedback(?:\/|\/index.html)?$/.test(path) && new URLSearchParams(location.search).get('preview') === '1';
  const endpoint = 'https://portal.turnlypros.com/api/resident-feedback';
  const sessionKey = token ? `turnly-feedback:${token}` : '';
  let requestId = crypto.randomUUID();
  let ready = false;
  let sending = false;
  let checking = false;
  let previous;
  try { previous = JSON.parse(sessionStorage.getItem(sessionKey)); } catch { /* Storage may be disabled. */ }
  if (/^[a-f0-9-]{36}$/i.test(previous?.requestId || '')) requestId = previous.requestId;
  function saveSession(sent) {
    if (!sessionKey) return;
    try { sessionStorage.setItem(sessionKey, JSON.stringify({ requestId, sent })); } catch { /* In-memory retries still keep the same ID. */ }
  }
  function linkState(title, message, retry = false) {
    $('linkTitle').textContent = title;
    $('linkMessage').textContent = message;
    $('retryLink').hidden = !retry;
  }
  function formMessage(message, error = false) {
    $('residentFeedbackFormMessage').textContent = message;
    $('residentFeedbackFormMessage').classList.toggle('error', error);
  }
  async function callService(body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body), signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || 'We couldn’t connect to the feedback service. Please try again.');
      if (!result || (body.action === 'submit' && result.ok !== true) || (body.action === 'resolve' && typeof result.valid !== 'boolean')) {
        throw new Error('We couldn’t confirm the response. Please try again.');
      }
      return result;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('The connection took too long. Please try again.');
      if (error instanceof TypeError) throw new Error('Check your internet connection and try again. Your feedback is still here.');
      throw error;
    } finally { clearTimeout(timer); }
  }
  function showThanks({ focus = true } = {}) {
    $('residentQuoteLink').href = preview
      ? '/residential/Contact.html?source=resident-feedback&preview=1#contact-form'
      : `/residential/Contact.html?source=resident-feedback#card=${encodeURIComponent(token)}`;
    ready = false;
    form.hidden = true;
    $('residentFeedbackChecking').hidden = true;
    $('retryLink').hidden = true;
    $('residentFeedbackThanks').hidden = false;
    if (preview) {
      $('residentFeedbackThanks').querySelector('.eyebrow').textContent = 'PREVIEW COMPLETE';
      $('thanksMessage').textContent = 'This is the confirmation residents see after sending feedback. This preview did not save a response.';
    }
    if (focus) $('thanksTitle').focus();
  }
  async function initialize() {
    if (checking) return;
    if (preview) {
      $('previewNotice').hidden = false;
      $('connectionLabel').textContent = 'Preview — no card connected';
      $('submitLabel').textContent = 'Preview confirmation';
    } else if (!token) {
      const missing = /^\/feedback(?:\/|\/index.html)?$/.test(path);
      const isQrPath = /^\/f(?:\/|$)/.test(path);
      linkState(missing ? 'Start with your Turnly flyer.' : isQrPath ? 'This feedback link isn’t valid.' : 'We couldn’t find that page.',
        missing ? 'Scan the feedback QR code on your flyer to open the form. It connects your response to the right property automatically.' : isQrPath ? 'Scan the QR code again, or ask your property team for a new flyer.' : 'Use the Turnly logo above to return to our website.');
      if (!missing && !isQrPath) document.title = 'Page Not Found | Turnly';
      return;
    }
    checking = true;
    $('retryLink').hidden = true;
    linkState('Opening your feedback card…', 'Just a moment while we check your link.');
    try {
      const result = preview ? { valid: true } : await callService({ action: 'resolve', token });
      if (!result.valid) { linkState('This flyer is no longer active.', 'Please ask your property team for a new feedback flyer.'); return; }
      if (!preview && previous?.sent) { showThanks({ focus: false }); return; }
      $('residentFeedbackChecking').hidden = true;
      form.hidden = false;
      ready = true;
    } catch (error) { linkState('We couldn’t open your card yet.', error.message, true); }
    finally { checking = false; }
  }
  form.addEventListener('change', event => {
    if (event.target.name !== 'rating') return;
    const rating = Number(event.target.value);
    form.querySelectorAll('.ratings label').forEach((label, i) => label.classList.toggle('filled', i < rating));
    $('ratingCaption').textContent = [ '', 'We’re sorry it missed the mark. Tell us what needs attention.', 'Thanks for being honest. What could we do better?', 'Thanks! Let us know what would make it even better.', 'Glad to hear it. What stood out to you?', 'That’s wonderful to hear. Tell us what made the difference.' ][rating];
    $('commentLabel').textContent = rating <= 2 ? 'What could we do better?' : 'Anything else we should know?';
  });
  form.elements.message.addEventListener('input', () => { $('messageCount').textContent = `${form.elements.message.value.length.toLocaleString()} / 1,800`; });
  $('retryLink').addEventListener('click', initialize);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!ready || sending || !form.reportValidity()) return;
    const rating = Number(form.querySelector('input[name="rating"]:checked')?.value);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) { formMessage('Choose a rating before sending your feedback.', true); return; }
    const areas = Array.from(form.querySelectorAll('input[name="areas"]:checked'), input => input.value);
    const comments = form.elements.message.value.trim();
    const message = [areas.length ? `Areas: ${areas.join(', ')}` : '', comments].filter(Boolean).join('\n\n');
    if (message.length > 2000) { formMessage('Please shorten your comments before sending.', true); return; }
    sending = true;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    $('submitLabel').textContent = 'Sending your feedback…';
    formMessage('');
    saveSession(false);
    try {
      if (!preview) await callService({ action: 'submit', token, request_id: requestId, rating, message, honeypot: form.elements.company.value });
      saveSession(true);
      showThanks();
    } catch (error) { formMessage(error.message, true); }
    finally {
      sending = false;
      button.disabled = false;
      $('submitLabel').textContent = preview ? 'Preview confirmation' : 'Send my feedback';
    }
  });
  void initialize();
})();
