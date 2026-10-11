// Keep conversation state in this browser tab, never store the API key here.
const $ = (id) => document.getElementById(id);
let history = [], catalog = [], busy = false;
const money = (n) => '₹' + Number(n).toLocaleString('en-IN');
const icons = {
  laptop: '<rect x="13" y="17" width="54" height="38" rx="3"/><path d="M7 62h66l-6-7H13zM30 62h20"/>',
  headphones: '<path d="M18 45V34a22 22 0 0 1 44 0v11"/><rect x="13" y="36" width="13" height="26" rx="6"/><rect x="54" y="36" width="13" height="26" rx="6"/>',
  smartphone: '<rect x="24" y="8" width="33" height="63" rx="6"/><path d="M34 14h13M36 64h9"/><circle cx="32" cy="23" r="2"/>',
  other: '<rect x="14" y="17" width="52" height="43" rx="7"/><path d="M30 69h20M40 60v9M22 26h36"/>'
};
function element(tag, className, text) {
  const node = document.createElement(tag); node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function renderProducts(products, recommendations = false) {
  $('products').replaceChildren();
  $('catalog-title').textContent = recommendations ? 'Your closest matches' : 'Explore the catalog';
  $('catalog-label').textContent = recommendations ? 'RANKED BY RELEVANCE · WITHIN YOUR FILTERS' : 'A FEW PLACES TO START';
  $('count').textContent = `${products.length} products`;
  for (const p of products) {
    const card = element('article', 'product-card');
    const art = element('div', 'product-art');
    // SVG paths come from the fixed local icon list, never from model output.
    art.innerHTML = `<svg viewBox="0 0 80 80" aria-hidden="true">${icons[p.category] || icons.other}</svg>`;
    art.append(element('span', 'product-category', p.category));
    card.append(art, element('h3', '', p.name), element('div', 'features', p.features.split(';').slice(0, 3).join(' · ')));
    const bottom = element('div', 'product-bottom');
    bottom.append(element('span', 'price', money(p.price_inr)), element('span', 'rating', `★ ${p.rating}`));
    const meta = element('div', 'product-meta');
    meta.append(element('span', '', `${p.stock} in stock`), element('span', '', p.product_id));
    card.append(bottom, meta); $('products').append(card);
  }
  if (!products.length) $('products').append(element('p', 'filter-note', 'No products fit these filters. Try increasing your budget.'));
}
function preview() {
  const budget = Number($('budget').value), category = $('category').value;
  renderProducts(catalog.filter(p => p.price_inr <= budget && (category === 'all' || p.category === category)).slice(0, 3));
}
function message(role, text) {
  const node = element('div', `message ${role}`);
  node.append(element('strong', '', role === 'user' ? 'YOU' : 'COMMERCE COPILOT'), document.createTextNode(text));
  $('conversation').append(node); return node;
}
function setBusy(value) {
  busy = value;
  document.querySelectorAll('button, select, input').forEach(x => x.disabled = value);
  $('status').textContent = value ? 'Finding your matches and asking Gemini…' : 'Ask naturally. Follow-up questions welcome.';
}
$('chat-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const question = $('question').value.trim();
  if (busy || !question) return;
  const budget = Number($('budget').value);
  if (!Number.isFinite(budget) || budget < 0 || budget > 1000000) { $('error').textContent = 'Choose a budget between ₹0 and ₹10,00,000.'; return; }
  $('error').textContent = ''; const userBubble = message('user', question); setBusy(true);
  try {
    const response = await fetch('/api/chat', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({question, budget, category:$('category').value, history}), signal:AbortSignal.timeout(180000)});
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Something went wrong. Please retry.');
    message('assistant', result.answer);
    history.push({role:'user',content:question},{role:'assistant',content:result.answer});
    history = history.slice(-6); $('question').value = '';
    renderProducts(result.products, true);
    $('conversation').lastElementChild.scrollIntoView({behavior:'smooth',block:'start'});
  } catch (error) {
    userBubble.remove();
    $('error').textContent = error.name === 'TimeoutError' ? 'The request took too long. Please try again.' : error.message;
  } finally { setBusy(false); }
});
$('question').addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); $('chat-form').requestSubmit(); }
});
$('budget').addEventListener('input', () => { $('budget-range').value = $('budget').value; preview(); });
$('budget-range').addEventListener('input', () => { $('budget').value = $('budget-range').value; preview(); });
$('category').addEventListener('change', preview);
$('clear').addEventListener('click', () => { history = []; $('conversation').replaceChildren(); $('error').textContent = ''; $('question').value = ''; preview(); });
document.querySelectorAll('[data-query]').forEach(button => button.addEventListener('click', () => {
  $('category').value = button.dataset.category; $('question').value = button.dataset.query; preview(); $('question').focus();
}));
fetch('/api/catalog').then(async response => {
  const result = await response.json(); if (!response.ok) throw new Error(result.error);
  catalog = result.products;
  [...new Set(catalog.map(p => p.category))].sort().forEach(category => {
    const option = document.createElement('option'); option.value = category; option.textContent = category[0].toUpperCase() + category.slice(1); $('category').append(option);
  }); preview();
}).catch(error => { $('catalog-error').textContent = error.message || 'Could not load catalog.'; });
