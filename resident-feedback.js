(function () {
  const check = document.getElementById('residentFeedbackChecking');
  const form = document.getElementById('residentFeedbackForm');
  const formMessage = document.getElementById('residentFeedbackFormMessage');
  const thanks = document.getElementById('residentFeedbackThanks');
  if (!check || !form) return;

  const routeParts = location.pathname.split('/').filter(Boolean);
  const isFeedbackRoute = routeParts.length === 2 && routeParts[0] === 'f';
  const token = (isFeedbackRoute ? routeParts[1] : '').toLowerCase();
  const endpoint = 'https://portal.turnlypros.com/api/resident-feedback';
  const requestId = crypto.randomUUID();
  let ready = false;

  function setCheck(text, error = false) {
    check.textContent = text;
    check.classList.toggle('error', error);
  }
  function setFormMessage(text, error = false) {
    formMessage.textContent = text;
    formMessage.classList.toggle('error', error);
  }
  async function callService(body) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'The feedback service is unavailable. Please try again.');
    return result;
  }

  async function initialize() {
    if (!isFeedbackRoute) {
      document.title = 'Page Not Found | Turnly';
      document.querySelector('.resident-feedback-eyebrow').textContent = 'PAGE NOT FOUND';
      document.querySelector('h1').innerHTML = 'We couldn’t find<br /><em>that page.</em>';
      document.querySelector('.resident-feedback-lead').textContent = 'The page you’re looking for may have moved or is no longer available.';
      setCheck('Visit the Turnly website to find the right page.');
      document.getElementById('residentFeedbackBackHome').hidden = false;
      return;
    }
    if (!/^[a-f0-9]{64}$/.test(token)) {
      setCheck('This feedback link is not valid. Please ask your property team for a new QR card.', true);
      return;
    }
    try {
      const result = await callService({ action: 'resolve', token });
      if (!result.valid) {
        setCheck('This QR card is no longer active. Please ask your property team for a new card.', true);
        return;
      }
      check.hidden = true;
      form.hidden = false;
      ready = true;
    } catch (error) {
      setCheck(error.message || 'We could not check this feedback link. Please try again.', true);
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!ready) return;
    if (!form.reportValidity()) return;
    const button = form.querySelector('button[type="submit"]');
    const rating = Number(form.querySelector('input[name="rating"]:checked')?.value || 0);
    const message = String(form.elements.message.value || '').trim();
    const honeypot = String(form.elements.company.value || '');
    button.disabled = true;
    button.textContent = 'Sending…';
    setFormMessage('');
    try {
      await callService({ action: 'submit', token, request_id: requestId, rating, message, honeypot });
      form.hidden = true;
      thanks.hidden = false;
    } catch (error) {
      setFormMessage(error.message || 'We could not save your feedback. Please try again.', true);
      button.disabled = false;
      button.textContent = 'Share feedback';
    }
  });

  void initialize();
})();
