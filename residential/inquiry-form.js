(() => {
  const form = document.getElementById('contactForm');
  const phone = document.getElementById('phone');
  const status = document.getElementById('formStatus');
  const success = document.getElementById('formSuccess');
  const button = form.querySelector('button[type="submit"]');
  let sending = false;
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
      source_url: window.location.href,
      name: value('name'), email: value('email'), phone: value('phone'), city: value('city'),
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
      const response = await fetch('https://portal.turnlypros.com/api/website-inquiries', {
        method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) throw new Error(result.error || 'Unable to send your request.');
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
