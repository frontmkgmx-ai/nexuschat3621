export type NexusAgentActionType =
  | 'navigate'
  | 'form'
  | 'confirm'
  | 'action_result';

export type NexusAgentAction = {
  version: 1;
  type: NexusAgentActionType;
  id: string;
  title?: string;
  message?: string;
  route?: 'CHATS' | 'CONTACTS' | 'INPAGE' | 'COMMUNITIES' | 'NEWS' | 'SETTINGS';
  fields?: Array<{
    name: string;
    label: string;
    type: 'text' | 'email' | 'tel' | 'textarea';
    required?: boolean;
  }>;
  action?: string;
  payload?: Record<string, unknown>;
  requiresConfirmation?: boolean;
};

const PREFIX = 'NEXUS_ACTION:';
const ROUTES = new Set<NexusAgentAction['route']>([
  'CHATS', 'CONTACTS', 'INPAGE', 'COMMUNITIES', 'NEWS', 'SETTINGS',
]);
const ACTIONS = new Set([
  'send_message',
  'start_call',
  'publish_status',
  'delete_status',
  'update_settings',
  'open_form',
]);

export function parseNexusAgentAction(text: string): NexusAgentAction | null {
  if (!text.startsWith(PREFIX)) return null;
  try {
    const value = JSON.parse(text.slice(PREFIX.length));
    if (!value || value.version !== 1 || typeof value.id !== 'string') return null;
    if (!['navigate', 'form', 'confirm', 'action_result'].includes(value.type)) return null;
    if (value.route && !ROUTES.has(value.route)) return null;
    if (value.action && !ACTIONS.has(value.action)) return null;
    if (value.fields && (!Array.isArray(value.fields) || value.fields.length > 10)) return null;
    return value as NexusAgentAction;
  } catch {
    return null;
  }
}

export function makeActionMessage(action: Omit<NexusAgentAction, 'version'>): string {
  return `${PREFIX}${JSON.stringify({ version: 1, ...action })}`;
}

export function isAllowedAgentRoute(route: string): route is NonNullable<NexusAgentAction['route']> {
  return ROUTES.has(route as NexusAgentAction['route']);
}

export function isAllowedAgentAction(action: string): boolean {
  return ACTIONS.has(action);
}

export { PREFIX };
