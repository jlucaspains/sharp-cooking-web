import { reactive, provide, inject, InjectionKey } from 'vue';

interface MenuOption {
    text?: string;
    svg?: string;
    action?: (() => void) | (() => Promise<void>);
    children?: MenuOption[];
    hidden?: boolean;
}

interface State {
    title: string;
    menuOptions?: MenuOption[];
    indexScrollY: number;
    message: any;
    useContainer: boolean;
  }

export const stateSymbol = Symbol('state') as InjectionKey<State>;
export const createState = () => reactive({ title: "", menuOptions: [], indexScrollY: 0, message: null, useContainer: true });

export const useState = () => inject(stateSymbol);
export const provideState = () => provide(
    stateSymbol,
    createState()
);