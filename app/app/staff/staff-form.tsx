"use client";

import { useActionState } from "react";
import { createStaff, type CreateStaffState } from "./actions";

const initialState: CreateStaffState = {};

export default function StaffForm() {
  const [state, formAction, pending] = useActionState(createStaff, initialState);

  return (
    <form
      action={formAction}
      className="rounded-lg border border-white/10 p-4 space-y-3"
    >
      <div className="font-medium">Novo profissional</div>

      <label className="space-y-1 block">
        <div className="text-sm opacity-80">Nome</div>
        <input
          name="name"
          className="w-full rounded-md bg-transparent border border-white/10 p-2"
          placeholder="Ex: João"
        />
      </label>

      {state?.error ? (
        <div className="text-sm text-red-500">{state.error}</div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-white/15 px-3 py-2 text-sm"
      >
        {pending ? "Salvando..." : "Adicionar profissional"}
      </button>
    </form>
  );
}
