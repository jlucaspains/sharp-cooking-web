import { reactive, provide, inject, InjectionKey } from 'vue';

interface MenuOption {
    svg: string;
}

interface State {
    title: string;
    menuOptions?: MenuOption[];
  }

export const stateSymbol = Symbol('state') as InjectionKey<State>;
export const createState = () => reactive({ title: "", menuOptions: [] });

export const useState = () => inject(stateSymbol);
export const provideState = () => provide(
    stateSymbol,
    createState()
);