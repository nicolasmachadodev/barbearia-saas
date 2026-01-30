"use client";

import { useActionState } from "react";
import {
  createShopAndSetActive,
  type OnboardingState,
} from "./actions";

const initialState: OnboardingState = {};

export function OnboardingForm() {
  const [state, formAction] = useActionState(
    createShopAndSetActive,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error && (
        <p className="rounded bg-red-100 px-3 py-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
          {state.error}
        </p>
      )}
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Nome da barbearia</span>
        <input
          type="text"
          name="name"
          required
          placeholder="Ex: Barbearia do João"
          className="rounded border border-neutral-300 px-3 py-2 text-neutral-900 placeholder:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Slug (identificador único)</span>
        <input
          type="text"
          name="slug"
          required
          placeholder="Ex: barbearia-do-joao"
          pattern="^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$"
          title="Apenas letras minúsculas, números e hífens. Ex: barbearia-do-joao"
          className="rounded border border-neutral-300 px-3 py-2 text-neutral-900 placeholder:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
        />
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          Será normalizado (minúsculas, hífens). Ex: barbearia-do-joao
        </span>
      </label>
      <button
        type="submit"
        className="mt-2 rounded bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        Criar barbearia
      </button>
    </form>
  );
}
