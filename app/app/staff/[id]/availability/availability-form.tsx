'use client';

import { useState, useTransition } from 'react';
import { addWeeklyAvailability } from './actions';

const DOW_LABEL: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
};

export default function AvailabilityForm({ staffId }: { staffId: string }) {
  const [dow, setDow] = useState<number>(1);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('18:00');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validação simples no client (a validação real também está no server)
    if (!start || !end) {
      setError('Preencha start e end.');
      return;
    }
    if (start >= end) {
      setError('O horário inicial deve ser menor que o horário final.');
      return;
    }

    startTransition(async () => {
      try {
        await addWeeklyAvailability({
          staffId,
          dow,
          start_time: start,
          end_time: end,
        });
        // limpa erro, mantém inputs
        setError(null);
      } catch (err: any) {
        setError(err?.message ?? 'Erro ao salvar disponibilidade.');
      }
    });
  }

  return (
    <form onSubmit={onSubmit} style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
      <h3 style={{ marginTop: 0 }}>Adicionar faixa</h3>

      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'end' }}>
        <label style={{ display: 'grid', gap: 4 }}>
          <span>Dia</span>
          <select
            value={dow}
            onChange={(e) => setDow(Number(e.target.value))}
            disabled={isPending}
          >
            {Object.entries(DOW_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'grid', gap: 4 }}>
          <span>Início</span>
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} disabled={isPending} />
        </label>

        <label style={{ display: 'grid', gap: 4 }}>
          <span>Fim</span>
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} disabled={isPending} />
        </label>
      </div>

      {error && (
        <p style={{ color: 'crimson', marginTop: 8, marginBottom: 0 }}>
          {error}
        </p>
      )}

      <div style={{ marginTop: 10 }}>
        <button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar faixa'}
        </button>
      </div>
    </form>
  );
}
