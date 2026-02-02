import Link from 'next/link';
import TimeOffForm from './time-off-form';
import { deleteTimeOff } from './actions';
import { createClient } from '@/src/lib/supabase/server';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: staffId } = await params;
  const supabase = await createClient();

  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('id, name')
    .eq('id', staffId)
    .single();

  if (staffError || !staff) {
    return (
      <div style={{ padding: 16 }}>
        <p>Erro ao carregar profissional: {staffError?.message ?? 'Não encontrado'}</p>
        <Link href="/app/staff">Voltar</Link>
      </div>
    );
  }

  const { data: rows, error: rowsError } = await supabase
    .from('staff_time_off')
    .select('id, start_at, end_at, reason')
    .eq('staff_id', staffId)
    .order('start_at', { ascending: true });

  if (rowsError) {
    return (
      <div style={{ padding: 16 }}>
        <p>Erro ao carregar folgas: {rowsError.message}</p>
        <Link href={`/app/staff/${staffId}`}>Voltar</Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 16, padding: 16 }}>
      <div>
        <Link href={`/app/staff/${staffId}`}>← Voltar</Link>
        <h1>Folgas</h1>
        <p>
          Profissional: <strong>{staff.name}</strong>
        </p>
      </div>

      <TimeOffForm staffId={staffId} />

      <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
        <h3 style={{ marginTop: 0 }}>Períodos cadastrados</h3>

        {rows && rows.length > 0 ? (
          <ul style={{ paddingLeft: 18, display: 'grid', gap: 10 }}>
            {rows.map((r: any) => (
              <li key={r.id} style={{ display: 'grid', gap: 4 }}>
                <div>
                  <strong>Início:</strong> {String(r.start_at)}
                </div>
                <div>
                  <strong>Fim:</strong> {String(r.end_at)}
                </div>
                {r.reason ? (
                  <div>
                    <strong>Motivo:</strong> {r.reason}
                  </div>
                ) : null}

                <form
                  action={async () => {
                    'use server';
                    await deleteTimeOff({ staffId, timeOffId: r.id });
                  }}
                >
                  <button type="submit">Remover</button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: 0, opacity: 0.8 }}>Nenhuma folga cadastrada ainda.</p>
        )}
      </div>
    </div>
  );
}
