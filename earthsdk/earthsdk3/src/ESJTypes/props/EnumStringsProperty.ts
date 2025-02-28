import { ReactParamsType } from "xbsj-base";
import { ReactVarProperty } from "./ReactVarProperty";
import { DVT } from "./WithUndefinedProperty";

export class EnumStringsProperty extends ReactVarProperty<string[] | undefined> {
    constructor(name: string, description: string, withUndefined: boolean, readonly: boolean, reactVar: ReactParamsType<string[] | undefined>, private _enums: [name: string, value: string][], defaultValue?: DVT<string[] | undefined>) {
        super(name, description, withUndefined, readonly, reactVar, defaultValue);
    }
    override get type() { return 'EnumStringsProperty'; }
    get enums() { return this._enums; }
}
