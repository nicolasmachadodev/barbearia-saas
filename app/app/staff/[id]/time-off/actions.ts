'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/src/lib/supabase/server';
import { getActiveShopId } from '@/src/lib/shop';

function assertDateOrder(startAt: string, endAt: string) {
  if (!startAt || !endAt) throw new Error('Preencha início e fim.');
  const s = new Date(startAt).getTime();
  const e = new Date(endAt).getTime();
  if (Number.isNaN(s) || Number.isNaN(e)) throw new Error('Datas inválidas.');
  if (s >= e) throw new Error('O início deve ser antes do fim.');
}

export async function addTimeOff(input: {
  staffId: string;
  start_at: string; // ISO
  end_at: string;   // ISO
  reason?: string;
}) {
  const supabase = await createClient();
  const shopId = await getActiveShopId();

  if (!shopId) throw new Error('Barbearia ativa não encontrada.');
  if (!input.staffId) throw new Error('Staff inválido.');

  assertDateOrder(input.start_at, input.end_at);

  const { error } = await supabase.from('staff_time_off').insert({
    shop_id: shopId,
    staff_id: input.staffId,
    start_at: input.start_at,
    end_at: input.end_at,
    reason: input.reason ?? null,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/app/staff/${input.staffId}/time-off`);
}

export async function deleteTimeOff(input: { staffId: string; timeOffId: string }) {
  const supabase = await createClient();

  if (!input.timeOffId) throw new Error('Folga inválida.');

  const { error } = await supabase
    .from('staff_time_off')
    .delete()
    .eq('id', input.timeOffId);

  if (error) throw new Error(error.message);

  revalidatePath(`/app/staff/${input.staffId}/time-off`);
}
