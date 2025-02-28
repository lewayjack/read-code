import { ReactParamsType } from "xbsj-base";
import { WithUndefinedProperty } from "./WithUndefinedProperty";

export abstract class ReactVarProperty<T> extends WithUndefinedProperty<T> {
    constructor(name: string, description: string, withUndefined: boolean, readonly: boolean, private _reactVar: ReactParamsType<T>, defaultValue?: T | (() => T)) {
        super(name, description, withUndefined, readonly, defaultValue);
    }
    get reactVar() { return this._reactVar; }
}
