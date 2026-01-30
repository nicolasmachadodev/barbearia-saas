"use client";

import { useActionState } from "react";
import { createService, type CreateServiceState } from "./actions";

const initialState: CreateServiceState = {};

export default function ServicesForm() {
  const [state, formAction, pending] = useActionState(
    createService,
    initialState
  );

  return (
    <form
      action={formAction}
      className="rounded-lg border border-white/10 p-4 space-y-3"
    >
      <div className="font-medium">Novo serviço</div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="space-y-1">
          <div className="text-sm opacity-80">Nome</div>
          <input
            name="name"
            className="w-full rounded-md bg-transparent border border-white/10 p-2"
            placeholder="Ex: Corte"
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm opacity-80">Duração (min)</div>
          <input
            name="duration_min"
            type="number"
            className="w-full rounded-md bg-transparent border border-white/10 p-2"
            placeholder="30"
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm opacity-80">Preço (R$)</div>
          <input
            name="price_reais"
            type="number"
            step="0.01"
            className="w-full rounded-md bg-transparent border border-white/10 p-2"
            placeholder="35.00"
          />
        </label>
      </div>

      {state?.error ? (
        <div className="text-sm text-red-500">{state.error}</div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-white/15 px-3 py-2 text-sm"
      >
        {pending ? "Salvando..." : "Adicionar serviço"}
      </button>
    </form>
  );
}
