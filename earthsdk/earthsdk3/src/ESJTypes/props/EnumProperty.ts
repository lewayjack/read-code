import { ReactParamsType } from "xbsj-base";
import { ReactVarProperty } from "./ReactVarProperty";
import { DVT } from "./WithUndefinedProperty";


export class EnumProperty<ValueType> extends ReactVarProperty<ValueType | undefined> {
    constructor(name: string, description: string, withUndefined: boolean, readonly: boolean, reactVar: ReactParamsType<ValueType | undefined>, private _enums: [name: string, value: ValueType][], defaultValue?: DVT<ValueType>) {
        super(name, description, withUndefined, readonly, reactVar, defaultValue);
    }
    override get type() { return 'EnumProperty'; }
    get enums() { return this._enums; }
}
