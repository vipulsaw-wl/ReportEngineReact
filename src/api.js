// ── FinReport Engine — API Client ────────────────────────────────────────────
const BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8080/api';

// ── Token helpers ─────────────────────────────────────────────────────────────
export const token = {
  get:   ()  => localStorage.getItem('finreport_token'),
  set:   (t) => localStorage.setItem('finreport_token', t),
  clear: ()  => {
    localStorage.removeItem('finreport_token');
    localStorage.removeItem('finreport_user');
  },
};

// ── Session expiry callback — set by App.js ───────────────────────────────────
// Pages call this when they get a 401 so App can redirect to login
let _onSessionExpired = null;
export function setSessionExpiredHandler(fn) { _onSessionExpired = fn; }

// ── Core request wrapper ──────────────────────────────────────────────────────
async function request(method, path, body, isFormData = false) {
  const headers = {};
  const t = token.get();
  if (t) headers['Authorization'] = 'Bearer ' + t;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: isFormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new Error('Cannot reach the server at ' + BASE + '. Is Spring Boot running?');
  }

  // Parse response body only if JSON
  let json = {};
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    try { json = await res.json(); } catch { json = {}; }
  }

  if (res.status === 401) {
    // Only treat as session expiry for protected routes (not /v1/auth/**)
    if (!path.startsWith('/v1/auth/')) {
      token.clear();
      if (_onSessionExpired) _onSessionExpired();
    }
    throw new Error(json?.message || 'Session expired. Please log in again.');
  }

  if (res.status === 403) {
    throw new Error(json?.message || 'Access denied. Insufficient permissions.');
  }

  if (!res.ok) {
    throw new Error(json?.message || json?.error || `Server error ${res.status}`);
  }

  // Unwrap ApiResponse<T> wrapper — Spring returns { success, message, data }
  return json?.data !== undefined ? json.data : json;
}

const get    = (path)       => request('GET',    path);
const post   = (path, body) => request('POST',   path, body);
const put    = (path, body) => request('PUT',    path, body);
const patch  = (path, body) => request('PATCH',  path, body);
const del    = (path)       => request('DELETE', path);
const upload = (path, form) => request('POST',   path, form, true);

// =============================================================================
// AUTH  (no JWT needed)
// =============================================================================
export const authApi = {
  totpSetup:      () => post('/v1/auth/totp/setup', {}),
  totpEnable:     (b) => post('/v1/auth/totp/enable', b),
  totpDisable:    (b) => post('/v1/auth/totp/disable', b),
  confirmTotp:    (b) => post('/v1/auth/totp/confirm-login', b),
  getCaptcha: ()      => get('/v1/auth/captcha'),
  login:      (body)  => post('/v1/auth/login', body),
  verifyOtp:  (body)  => post('/v1/auth/otp/verify', body),
  resendOtp:  (email) => post(`/v1/auth/otp/resend?email=${encodeURIComponent(email)}`),
};

// =============================================================================
// PLATFORMS
// =============================================================================
export const platformApi = {
  list:           (page = 0, size = 20, status) =>
    get(`/v1/platforms?page=${page}&size=${size}${status ? '&status=' + status : ''}`),
  get:            (id)         => get(`/v1/platforms/${id}`),
  create:         (body)       => post('/v1/platforms', body),
  updateStatus:   (id, status) => patch(`/v1/platforms/${id}/status`, { status }),
  testConnection: (body)       => post('/v1/platforms/test-connection', body),
};

// =============================================================================
// TEMPLATES
// =============================================================================
export const templateApi = {
  list:   (platformId, page = 0, size = 50) =>
    get(`/v1/templates?page=${page}&size=${size}${platformId ? '&platformId=' + platformId : ''}`),
  get:    (id) => get(`/v1/templates/${id}`),
  upload: (file, platformId, category = 'CUSTOM') => {
    const form = new FormData();
    form.append('file', file);
    form.append('platformId', platformId);
    form.append('category', category);
    return upload('/v1/templates/upload', form);
  },
  archive: (id) => del(`/v1/templates/${id}`),
};

// =============================================================================
// SFTP CONFIGS
// =============================================================================
export const sftpApi = {
  list:       (platformId)    => get(`/v1/sftp-configs?platformId=${platformId}`),
  create:     (body)          => post('/v1/sftp-configs', body),
  update:     (id, body)      => put(`/v1/sftp-configs/${id}`, body),
  delete:     (id)            => del(`/v1/sftp-configs/${id}`),
  test:       (id)            => post(`/v1/sftp-configs/${id}/test`),
  testInline: (body)          => post('/v1/sftp-configs/test', body),
};

// =============================================================================
// SCHEDULED REPORTS
// =============================================================================
export const scheduleApi = {
  list:   (platformId, active, page = 0, size = 20) =>
    get(`/v1/scheduled-reports?platformId=${platformId}&page=${page}&size=${size}` +
        (active != null ? '&active=' + active : '')),
  get:    (id)    => get(`/v1/scheduled-reports/${id}`),
  create: (body)  => post('/v1/scheduled-reports', body),
  update: (id, b) => put(`/v1/scheduled-reports/${id}`, b),
  pause:  (id)    => patch(`/v1/scheduled-reports/${id}/pause`),
  resume: (id)    => patch(`/v1/scheduled-reports/${id}/resume`),
  delete: (id)    => del(`/v1/scheduled-reports/${id}`),
  runNow: (id)    => post(`/v1/scheduled-reports/${id}/run-now`),
};

// =============================================================================
// RUN HISTORY
// =============================================================================
export const historyApi = {
  list:      (platformId, status, page = 0, size = 20) =>
    get(`/v1/run-history?platformId=${platformId}&page=${page}&size=${size}` +
        (status ? '&status=' + status : '')),
  get:       (id)         => get(`/v1/run-history/${id}`),
  summary:   (platformId) => get(`/v1/run-history/summary?platformId=${platformId}`),
  retrigger: (id)         => post(`/v1/run-history/${id}/retrigger`),
};

// =============================================================================
// QUERY RUNNER
// =============================================================================
export const queryApi = {
  execute:        (platformId, sql, maxRows) =>
    post('/v1/query-runner/execute', { platformId, sql, maxRows: maxRows || 500 }),
  testConnection: (platformId) =>
    post(`/v1/query-runner/test-connection?platformId=${platformId}`),
};

// =============================================================================
// SCHEMA DISCOVERY
// =============================================================================
export const schemaApi = {
  listTables:          (platformId)                    => get(`/v1/schema/tables?platformId=${platformId}`),
  listColumns:         (platformId, tableName)         => get(`/v1/schema/columns?platformId=${platformId}&tableName=${encodeURIComponent(tableName)}`),
  getMerchantsAndBanks:(platformId, maxRows = 200)     => get(`/v1/schema/merchants-banks?platformId=${platformId}&maxRows=${maxRows}`),
  queryNamedTables:    (platformId, mt, bt, maxRows = 200) =>
    get(`/v1/schema/merchants-banks/query?platformId=${platformId}` +
        (mt ? `&merchantTable=${encodeURIComponent(mt)}` : '') +
        (bt ? `&bankTable=${encodeURIComponent(bt)}`     : '') +
        `&maxRows=${maxRows}`),
};

// =============================================================================
// BULK REPORT SCHEDULES
// =============================================================================
export const bulkApi = {
  list:      (platformId, page = 0, size = 20) =>
    get(`/v1/bulk-schedules?platformId=${platformId}&page=${page}&size=${size}`),
  get:       (id)    => get(`/v1/bulk-schedules/${id}`),
  create:    (body)  => post('/v1/bulk-schedules', body),
  pause:     (id)    => patch(`/v1/bulk-schedules/${id}/pause`),
  resume:    (id)    => patch(`/v1/bulk-schedules/${id}/resume`),
  delete:    (id)    => del(`/v1/bulk-schedules/${id}`),
  runNow:    (id)    => post(`/v1/bulk-schedules/${id}/run-now`),
  runStatus: (id)    => get(`/v1/bulk-schedules/${id}/run-status`),
};
