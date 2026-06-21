import { reactive, provide, inject, InjectionKey } from 'vue';
import { isWailsApp } from '../helpers/desktop';

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
    message: any;
    useContainer: boolean;
    runningInWailsApp: boolean;
}

export const stateSymbol = Symbol('state') as InjectionKey<State>;
export const createState = () => reactive({
    title: "", menuOptions: [], indexScrollY: 0, message: null, useContainer: true,
    runningInWailsApp: isWailsApp()
});

export const useState = () => inject(stateSymbol);
export const provideState = () => provide(
    stateSymbol,
    createState()
);