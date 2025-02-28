import { Property } from "./Property";

export type DefaultValueType<T> = T | (() => T) | (() => Extract<T, undefined>);
export type DVT<T> = DefaultValueType<T>;

export abstract class WithUndefinedProperty<T> extends Property {
    constructor(name: string, description: string, private _withUndefined: boolean, private _readonly: boolean, private _defaultValue?: DVT<T>) {
        super(name, description);
    }
    get withUndefined() { return this._withUndefined; }
    get readonly() { return this._readonly; }

    /**
     * defaultValue是变量从undefined转化为有值时的默认值，如果为undefined，表示未设置，由UI自行决定默认值！
     */
    get defaultValue() {
        if (this._defaultValue instanceof Function) {
            return this._defaultValue();
        } else {
            return this._defaultValue; 
        }
    }
}
