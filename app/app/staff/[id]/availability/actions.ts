'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/src/lib/supabase/server';
import { getActiveShopId } from '@/src/lib/shop';

function assertTimeOrder(start: string, end: string) {
  if (!start || !end) throw new Error('Preencha start_time e end_time.');
  // Comparação funciona para "HH:MM" e "HH:MM:SS"
  if (start >= end) throw new Error('O horário inicial deve ser menor que o horário final.');
}

export async function addWeeklyAvailability(input: {
  staffId: string;
  dow: number;
  start_time: string;
  end_time: string;
}) {
  const supabase = await createClient();
  const shopId = await getActiveShopId();

  if (!shopId) throw new Error('Barbearia ativa não encontrada.');
  if (!input.staffId) throw new Error('Staff inválido.');
  if (input.dow < 0 || input.dow > 6) throw new Error('Dia da semana inválido.');

  assertTimeOrder(input.start_time, input.end_time);

  const { error } = await supabase.from('staff_weekly_availability').insert({
    shop_id: shopId,
    staff_id: input.staffId,
    dow: input.dow,
    start_time: input.start_time,
    end_time: input.end_time,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/app/staff/${input.staffId}/availability`);
}

export async function deleteWeeklyAvailability(input: {
  staffId: string;
  availabilityId: string;
}) {
  const supabase = await createClient();

  if (!input.staffId) throw new Error('Staff inválido.');
  if (!input.availabilityId) throw new Error('Disponibilidade inválida.');

  const { error } = await supabase
    .from('staff_weekly_availability')
    .delete()
    .eq('id', input.availabilityId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/app/staff/${input.staffId}/availability`);
}
