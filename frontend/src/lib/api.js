let authToken = null;
export const setAuthToken = (t) => { authToken = t; };

export function apiFetch(url, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    return fetch(url, { ...options, headers });
}