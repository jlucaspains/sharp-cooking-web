import { reactive, provide, inject, InjectionKey } from 'vue';

interface MenuOption {
    text?: string;
    svg?: string;
    action?: (() => void) | (() => Promise<void>);
    children?: MenuOption[];
}

interface State {
    title: string;
    menuOptions?: MenuOption[];
    indexScrollY: number;
  }

export const stateSymbol = Symbol('state') as InjectionKey<State>;
export const createState = () => reactive({ title: "", menuOptions: [], indexScrollY: 0 });

export const useState = () => inject(stateSymbol);
export const provideState = () => provide(
    stateSymbol,
    createState()
);