import { ReactParamsType } from "xbsj-base";
import { ReactVarProperty } from "./ReactVarProperty";
import { DVT } from "./WithUndefinedProperty";

type ParamTypes = ('string' | 'number' | 'boolean' | 'strings' | 'numbers' | 'booleans' | ['string' | 'number' | 'boolean' | 'strings' | 'numbers' | 'booleans', string])[]


export class ParamsProperty<T extends (string | number | boolean | string[] | number[] | boolean[])[]> extends ReactVarProperty<T> {
    constructor(name: string, description: string, reactVar: ReactParamsType<T>, private _paramTypes: ParamTypes, defaultValue?: DVT<T>) {
        super(name, description, false, false, reactVar, defaultValue);
    }
    override get type() { return 'ParamsProperty'; }
    get paramTypes() { return this._paramTypes; }
}
