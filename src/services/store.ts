import { reactive, provide, inject, InjectionKey } from 'vue';

export const stateSymbol = Symbol('state') as InjectionKey<{ title: string; }>;
export const createState = () => reactive({ title: "" });

export const useState = () => inject(stateSymbol);
export const provideState = () => provide(
    stateSymbol,
    createState()
);