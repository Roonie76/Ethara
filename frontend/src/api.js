import { auth } from './firebase';

const API_ORIGIN = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const BASE = API_ORIGIN ? `${API_ORIGIN}/api` : '/api';

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Projects
  getProjects:   ()             => request('GET',    '/projects'),
  createProject: (b)            => request('POST',   '/projects', b),
  updateProject: (id, b)        => request('PATCH',  `/projects/${id}`, b),
  deleteProject: (id)           => request('DELETE', `/projects/${id}`),

  // Tasks
  getTasks:      ()             => request('GET',    '/tasks'),
  createTask:    (b)            => request('POST',   '/tasks', b),
  updateTask:    (id, b)        => request('PATCH',  `/tasks/${id}`, b),
  updateStatus:  (id, status)   => request('PATCH',  `/tasks/${id}/status`, { status }),
  deleteTask:    (id)           => request('DELETE', `/tasks/${id}`),

  // Users
  getUsers:      ()             => request('GET',    '/users'),
  inviteUser:    (b)            => request('POST',   '/users/invite', b),
  updateRole:    (id, role)     => request('PATCH',  `/users/${id}/role`, { role }),
  removeUser:    (id)           => request('DELETE', `/users/${id}`),
};
