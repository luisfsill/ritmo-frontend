import { api, ApiError } from '@/lib/api';

export interface PendingCommandResponse {
  status: 'pending';
  command_id: string;
  message: string;
}

export interface FrontCommandOut {
  command_id: string;
  tenant_id: string;
  actor_account_id: string | null;
  type: string;
  payload: Record<string, unknown>;
  received_at: string;
  status: string;
  attempts?: number | null;
  retry_at?: string | null;
  last_error?: Record<string, unknown> | null;
  expected_version?: number | null;
  committed_at?: string | null;
  primary_tx_id?: string | null;
  result_snapshot?: Record<string, unknown> | null;
}

export type FrontCommandWaitResult =
  | { kind: 'committed'; command: FrontCommandOut; message: string }
  | { kind: 'failed'; command?: FrontCommandOut; message: string }
  | { kind: 'timeout'; message: string };

export function isPendingResponse(payload: unknown): payload is PendingCommandResponse {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  const candidate = payload as Record<string, unknown>;
  return (
    candidate.status === 'pending' &&
    typeof candidate.command_id === 'string' &&
    candidate.command_id.trim().length > 0 &&
    typeof candidate.message === 'string'
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function humanizeStatus(status: string): string {
  switch (status) {
    case 'committed':
      return 'Comando aplicado com sucesso.';
    case 'dead_letter':
      return 'Comando falhou e foi movido para dead-letter.';
    case 'failed_retryable':
      return 'Comando falhou e será reprocessado automaticamente.';
    case 'committing':
      return 'Comando está sendo aplicado no backend.';
    default:
      return `Status atual do comando: ${status}`;
  }
}

export async function waitFrontCommand(
  commandId: string,
  timeoutMs = 90000,
  intervalMs = 3000,
): Promise<FrontCommandWaitResult> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const command = await api.get<FrontCommandOut>(`/api/v1/front-commands/${encodeURIComponent(commandId)}`);

      if (command.status === 'committed') {
        return { kind: 'committed', command, message: humanizeStatus(command.status) };
      }

      if (command.status === 'dead_letter') {
        return { kind: 'failed', command, message: humanizeStatus(command.status) };
      }
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status !== 404 && apiError.status !== 503) {
        return {
          kind: 'failed',
          message: apiError.message || 'Falha ao consultar status do comando pendente.',
        };
      }
    }

    await sleep(intervalMs);
  }

  return {
    kind: 'timeout',
    message: `Tempo limite ao aguardar confirmação do comando pendente (${commandId}).`,
  };
}
