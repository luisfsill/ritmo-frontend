import { api } from './api';

export interface EmergencyIncident {
  id: string;
  severity: 'warning' | 'critical';
  status: 'open' | 'resolved';
  title: string;
  message: string;
  scope_json: Record<string, unknown> | null;
  opened_by_user_id: string | null;
  resolved_by_user_id: string | null;
  opened_at: string;
  resolved_at: string | null;
  created_at: string;
}

export interface EmergencyDispatchResult {
  incident_id: string;
  queued: number;
  skipped: number;
}

export const emergencyApi = {
  listIncidents: (status?: string) =>
    api.get<EmergencyIncident[]>(
      status
        ? `/api/v1/emergency/incidents?status=${encodeURIComponent(status)}`
        : '/api/v1/emergency/incidents'
    ),
  createIncident: (payload: {
    severity: 'warning' | 'critical';
    title: string;
    message: string;
    dispatch: boolean;
    scope_json?: Record<string, unknown> | null;
  }) => api.post<EmergencyIncident>('/api/v1/emergency/incidents', payload),
  resolveIncident: (incidentId: string, note?: string) =>
    api.post<EmergencyIncident>(`/api/v1/emergency/incidents/${encodeURIComponent(incidentId)}/resolve`, { note }),
  testDispatch: (incidentId: string) =>
    api.post<EmergencyDispatchResult>('/api/v1/emergency/test-dispatch', { incident_id: incidentId }),
};
