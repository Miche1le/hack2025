const form = document.getElementById('filters-form');
const feedGrid = document.getElementById('feed-grid');
const loading = document.getElementById('loading');
const emptyState = document.getElementById('empty');
const limitInput = document.getElementById('limit');
const limitValue = document.getElementById('limit-value');
const clearButton = document.getElementById('clear');

const renderCard = (item) => {
  const article = document.createElement('article');
  article.className = 'card';
  article.innerHTML = `
    <div class="card__meta">
      <span class="card__source">${item.source}</span>
      <time datetime="${item.published || ''}">
        ${item.published ? new Date(item.published).toLocaleString('ru-RU') : 'Без даты'}
      </time>
    </div>
    <h3 class="card__title">${item.title}</h3>
    <p class="card__summary">${item.summary}</p>
    <a class="card__link" href="${item.link}" target="_blank" rel="noopener">
      Читать первоисточник
    </a>
  `;
  return article;
};

const serializeForm = (formData) => {
  const params = new URLSearchParams();
  const sources = formData.getAll('sources');
  if (sources.length) {
    params.set('sources', sources.join(','));
  }
  const query = formData.get('q');
  if (query) {
    params.set('q', query);
  }
  const limit = formData.get('limit');
  if (limit) {
    params.set('limit', limit);
  }
  return params.toString();
};

const toggleLoading = (state) => {
  loading.hidden = !state;
  feedGrid.dataset.loading = state;
};

const hideEmptyState = () => {
  emptyState.hidden = true;
};

const showEmptyState = (title, text) => {
  emptyState.hidden = false;
  emptyState.innerHTML = `
    <h3>${title}</h3>
    <p>${text}</p>
  `;
};

const fetchNews = async () => {
  toggleLoading(true);
  hideEmptyState();
  feedGrid.innerHTML = '';
  try {
    const formData = new FormData(form);
    const queryString = serializeForm(formData);
    const response = await fetch(`/api/news?${queryString}`);
    if (!response.ok) {
      throw new Error('Не удалось загрузить новости');
    }
    const data = await response.json();
    if (!data.items.length) {
      showEmptyState('Нет совпадений', 'Попробуйте изменить фильтры или запрос.');
      return;
    }
    hideEmptyState();
    const fragment = document.createDocumentFragment();
    data.items.forEach((item) => {
      fragment.appendChild(renderCard(item));
    });
    feedGrid.appendChild(fragment);
  } catch (error) {
    showEmptyState('Что-то пошло не так', error.message);
  } finally {
    toggleLoading(false);
  }
};

form.addEventListener('submit', (event) => {
  event.preventDefault();
  fetchNews();
});

clearButton.addEventListener('click', () => {
  form.reset();
  limitValue.textContent = limitInput.value;
  form.querySelectorAll('input[name="sources"]').forEach((checkbox) => {
    checkbox.checked = true;
  });
  fetchNews();
});

limitInput.addEventListener('input', () => {
  limitValue.textContent = limitInput.value;
});

// Инициализация
limitValue.textContent = limitInput.value;
fetchNews();
