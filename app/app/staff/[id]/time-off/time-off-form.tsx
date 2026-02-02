'use client';

import { useState, useTransition } from 'react';
import { addTimeOff } from './actions';

export default function TimeOffForm({ staffId }: { staffId: string }) {
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        await addTimeOff({
          staffId,
          start_at: startAt,
          end_at: endAt,
          reason: reason.trim() ? reason.trim() : undefined,
        });
        setError(null);
        setReason('');
        // não limpa datas automaticamente (você decide se quer)
      } catch (err: any) {
        setError(err?.message ?? 'Erro ao salvar folga.');
      }
    });
  }

  return (
    <form onSubmit={onSubmit} style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
      <h3 style={{ marginTop: 0 }}>Adicionar folga</h3>

      <div style={{ display: 'grid', gap: 8 }}>
        <label style={{ display: 'grid', gap: 4 }}>
          <span>Início</span>
          <input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            disabled={isPending}
          />
        </label>

        <label style={{ display: 'grid', gap: 4 }}>
          <span>Fim</span>
          <input
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            disabled={isPending}
          />
        </label>

        <label style={{ display: 'grid', gap: 4 }}>
          <span>Motivo (opcional)</span>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: férias, consulta, folga"
            disabled={isPending}
          />
        </label>
      </div>

      {error && <p style={{ color: 'crimson', marginTop: 8, marginBottom: 0 }}>{error}</p>}

      <div style={{ marginTop: 10 }}>
        <button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar folga'}
        </button>
      </div>
    </form>
  );
}
