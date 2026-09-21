(() => {
  const form = document.getElementById('contactForm');
  const phone = document.getElementById('phone');
  const status = document.getElementById('formStatus');
  const success = document.getElementById('formSuccess');
  const button = form.querySelector('button[type="submit"]');
  let sending = false;
  const params = new URLSearchParams(location.search);
  const fromFeedback = params.get('source') === 'resident-feedback';
  const preview = fromFeedback && params.get('preview') === '1';
  const notice = document.getElementById('quoteContextNotice');
  const community = document.getElementById('quoteCommunity');
  let feedbackToken = '';
  const touched = new Set();
  form.addEventListener('input', event => touched.add(event.target.id));
  form.addEventListener('change', event => touched.add(event.target.id));
  function contextNotice(message) { notice.hidden = false; notice.textContent = message; }
  if (fromFeedback) {
    const candidate = new URLSearchParams(location.hash.slice(1)).get('card');
    if (/^[a-f0-9]{64}$/.test(candidate || '')) {
      feedbackToken = candidate;
      try { sessionStorage.setItem('turnly-quote-card', candidate); } catch {}
    } else if (!preview) {
      try { feedbackToken = sessionStorage.getItem('turnly-quote-card') || ''; } catch {}
    }
    // Keep the QR secret out of query strings, referrers, and saved lead notes.
    history.replaceState(null, '', location.pathname + location.search + '#contact-form');
    document.getElementById('contact-form').scrollIntoView();
    if (preview) contextNotice('Preview only: this form will not save a quote request.');
    else if (feedbackToken) {
      contextNotice('Loading the home details from your flyer…');
      fetch('https://portal.turnlypros.com/api/resident-feedback', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'quote_context', token: feedbackToken }),
        credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(15000)
      }).then(async response => {
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error('Context unavailable');
        const context = result.context;
        if (!context) { feedbackToken = ''; contextNotice('Your flyer details are unavailable. Please enter your home details below.'); return; }
        community.textContent = `Community: ${context.property_name}`;
        community.hidden = false;
        let filled = 0;
        for (const [field,id] of [['bedrooms','bedrooms'],['bathrooms','bathrooms'],['square_feet','squareFeet']]) {
          const input = document.getElementById(id);
          if (context[field] != null && !touched.has(id) && !input.value) { input.value = String(context[field]); filled++; }
        }
        contextNotice(filled ? 'We carried over the home-size details saved with your flyer. Please confirm or edit them, then add your contact information and address.' : 'Your community is connected. Home size wasn’t saved with this flyer, so please fill it in below.');
      }).catch(() => contextNotice('We couldn’t load your flyer details. You can still enter your home details and request a quote.'));
    } else contextNotice('Tell us about your home and the cleaning you’re looking for.');
  }
  phone.addEventListener('input', () => phone.setCustomValidity(''));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    const digits = phone.value.replace(/\D/g, '');
    phone.setCustomValidity(/^(1\d{10}|\d{10})$/.test(digits) ? '' : 'Please enter a valid 10-digit phone number.');
    if (!form.reportValidity()) return;
    const value = id => document.getElementById(id).value.trim();
    const payload = {
      client_type: 'residential',
      source: 'residential_website_contact_form',
      source_url: location.origin + location.pathname + (fromFeedback ? '?source=resident-feedback' : ''),
      name: value('name'), email: value('email'), phone: value('phone'), city: value('city'),
      street_address: value('streetAddress'), unit_number: value('unitNumber'), state: value('state').toUpperCase(), postal_code: value('postalCode'),
      feedback_token: feedbackToken || undefined,
      facility_type: value('size'), service_interest: value('tier') || 'Residential cleaning',
      bedrooms: value('bedrooms'), bathrooms: value('bathrooms'), square_feet: value('squareFeet'),
      frequency: value('frequency'), message: value('message'),
      sms_consent: document.getElementById('smsConsent').checked,
      _gotcha: form.elements._gotcha.value
    };
    sending = true;
    button.disabled = true;
    button.textContent = 'Sending…';
    status.textContent = 'Sending your request…';
    try {
      if (preview) {
        form.classList.add('hidden'); success.classList.remove('hidden');
        success.querySelector('.success-title').textContent = 'Preview complete.';
        success.querySelector('.success-text').textContent = 'No quote request was saved. Residents using a live flyer can submit their details here.';
        status.textContent = ''; return;
      }
      const response = await fetch('https://portal.turnlypros.com/api/website-inquiries', {
        method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) throw new Error(result.error || 'Unable to send your request.');
      try { sessionStorage.removeItem('turnly-quote-card'); } catch {}
      form.reset();
      form.classList.add('hidden');
      success.classList.remove('hidden');
      success.setAttribute('tabindex','-1');
      success.focus();
      status.textContent = '';
    } catch (error) {
      status.textContent = 'We couldn’t confirm your request. Please try again or email admin@turnlypros.com.';
    } finally {
      sending = false;
      button.disabled = false;
      button.textContent = 'Send inquiry';
    }
  });
})();
