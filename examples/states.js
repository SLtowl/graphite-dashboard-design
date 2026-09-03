// Local component demonstrations. No persistence, analytics, or external requests.
const byId = id => document.getElementById(id);
const workbench = byId('workbench');
const densityButton = byId('density-toggle');
const workspace = byId('workspace-select');
const nameInput = byId('report-name');
const error = byId('report-error');
const publishButton = byId('publish-report');
const dialog = byId('review-dialog');
let savedName = '';
let validationAttempted = false;
let dialogOpener = null;

densityButton.addEventListener('click', () => {
  const compact = workbench.dataset.density !== 'compact';
  workbench.dataset.density = compact ? 'compact' : 'comfortable';
  densityButton.setAttribute('aria-pressed', String(compact));
  densityButton.classList.toggle('gd-selected', compact);
  byId('density-summary').textContent = compact ? 'Compact' : 'Comfortable';
});

const workspaceLabel = () => workspace.options[workspace.selectedIndex].textContent;
workspace.addEventListener('change', () => {
  byId('workspace-summary').textContent = workspaceLabel();
});

function validateName() {
  const name = nameInput.value.trim();
  const valid = name.length >= 3 && name.length <= 80;
  nameInput.setAttribute('aria-invalid', String(!valid));
  error.hidden = valid;
  error.textContent = valid ? '' : 'Enter a view name between 3 and 80 characters.';
  return valid;
}

byId('report-form').addEventListener('submit', event => {
  event.preventDefault();
  validationAttempted = true;
  if (!validateName()) {
    savedName = '';
    publishButton.disabled = true;
    byId('saved-name').textContent = 'Not saved';
    byId('save-status').textContent = 'View not saved. Check the name above.';
    nameInput.focus();
    return;
  }
  savedName = nameInput.value.trim();
  byId('saved-name').textContent = savedName;
  publishButton.disabled = false;
  byId('save-status').textContent = 'Saved in this page only. You can now review the view.';
});

nameInput.addEventListener('input', () => {
  savedName = '';
  publishButton.disabled = true;
  byId('saved-name').textContent = 'Not saved';
  byId('save-status').textContent = 'Unsaved changes. Save this name before reviewing it.';
  if (validationAttempted) validateName();
});

function openDialog(event) {
  dialogOpener = event.currentTarget;
  byId('dialog-workspace').textContent = workspaceLabel();
  byId('dialog-name').textContent = savedName || 'Not saved';
  dialog.showModal();
}
byId('open-dialog').addEventListener('click', openDialog);
publishButton.addEventListener('click', openDialog);
// Keep Tab on the sole action too; some browsers otherwise focus their chrome.
// Native showModal still handles inert background content and Escape.
dialog.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const focusable = [...dialog.querySelectorAll('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')]
    .filter(element => element.getClientRects().length > 0);
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first) return;
  if (focusable.length === 1 || (event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  }
});
dialog.addEventListener('close', () => {
  byId('dialog-result').textContent = 'Preview closed. Nothing was published.';
  // Native dialogs normally restore focus themselves. The close event can run
  // after the user has already focused another control, so never steal it back.
  if (document.activeElement === document.body || dialog.contains(document.activeElement)) {
    dialogOpener?.focus();
  }
});

const scenarios = {
  current: { title: 'Current data', value: '24,860', coverage: '3 of 3 sources included', detail: 'All sources are available in this example. Last sample: May 18, 2025 at 10:00 UTC.' },
  stale: { title: 'Stale data', value: '23,910', coverage: 'Last known value, not a current total', detail: 'Refresh is overdue. Showing the last successful sample from May 17, 2025 at 10:00 UTC. Do not treat this value as current.' },
  partial: { title: 'Partial data', value: '18,600', coverage: '2 of 3 sources included', detail: 'The regional source is unavailable. This subtotal excludes it; the missing requests are unknown, not zero. Available sources last sampled: May 18, 2025 at 10:00 UTC.' },
  denied: { title: 'No permission', value: 'Not available', coverage: 'Value hidden by access policy', detail: 'Your example role cannot view request totals. Ask a workspace administrator for access. Refresh cannot grant permission.' },
  error: { title: 'Source error', value: 'Not available', coverage: 'No successful sample available', detail: 'The example source could not be loaded. There is no cached total to display. Retry to simulate a successful recovery.' }
};
const scenarioSelect = byId('data-state');
const reloadButton = byId('reload-data');
let refreshTimer;

function renderScenario() {
  const scenario = scenarios[scenarioSelect.value];
  byId('state-title').textContent = scenario.title;
  byId('state-value').textContent = scenario.value;
  byId('state-coverage').textContent = scenario.coverage;
  byId('state-detail').textContent = scenario.detail;
  byId('retry-data').hidden = scenarioSelect.value !== 'error';
  reloadButton.disabled = scenarioSelect.value === 'denied';
}

function finishRefresh() {
  byId('loading-region').setAttribute('aria-busy', 'false');
  scenarioSelect.disabled = false;
  renderScenario();
}

scenarioSelect.addEventListener('change', () => {
  clearTimeout(refreshTimer);
  finishRefresh();
  byId('load-status').textContent = 'Scenario changed. No request was sent.';
});

function refresh(recover = false) {
  if (scenarioSelect.value === 'denied') return;
  byId('loading-region').setAttribute('aria-busy', 'true');
  reloadButton.disabled = true;
  byId('retry-data').disabled = true;
  scenarioSelect.disabled = true;
  byId('load-status').textContent = 'Loading the local sample. Existing values remain visible.';
  refreshTimer = setTimeout(() => {
    if (recover) scenarioSelect.value = 'current';
    finishRefresh();
    byId('retry-data').disabled = false;
    byId('load-status').textContent = recover ? 'Sample recovered. All three example sources are available.' : 'Local refresh complete. The selected scenario is preserved.';
  }, 600);
}
reloadButton.addEventListener('click', () => refresh());
byId('retry-data').addEventListener('click', () => refresh(true));

const searchInput = byId('service-search');
const rows = [...byId('service-rows').rows];
const tableWrap = byId('service-table-wrap');
const tableHint = byId('table-scroll-hint');
function updateTableHint() {
  const overflowing = !tableWrap.hidden && tableWrap.scrollWidth > tableWrap.clientWidth + 1;
  tableHint.hidden = !overflowing;
  if (overflowing) tableWrap.setAttribute('aria-describedby', tableHint.id);
  else tableWrap.removeAttribute('aria-describedby');
}
new ResizeObserver(updateTableHint).observe(tableWrap);
updateTableHint();
function filterServices() {
  const query = searchInput.value.trim().toLocaleLowerCase('en');
  let count = 0;
  rows.forEach(row => {
    const matches = row.cells[0].textContent.toLocaleLowerCase('en').includes(query);
    row.hidden = !matches;
    if (matches) count++;
  });
  byId('empty-results').hidden = count !== 0;
  byId('service-table-wrap').hidden = count === 0;
  byId('results-count').textContent = `${count} ${count === 1 ? 'service' : 'services'}`;
  updateTableHint();
}
searchInput.addEventListener('input', filterServices);
byId('reset-search').addEventListener('click', () => {
  searchInput.value = '';
  filterServices();
  searchInput.focus();
});
