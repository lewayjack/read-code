import { ReactParamsType } from "xbsj-base";
import { ReactVarProperty } from "./ReactVarProperty";
import { DVT } from "./WithUndefinedProperty";


export class LongStringProperty extends ReactVarProperty<string | undefined> {
    constructor(name: string, description: string, withUndefined: boolean, readonly: boolean, reactVar: ReactParamsType<string | undefined>, defaultValue?: DVT<string> | undefined, private _sampleValue?: string) {
        super(name, description, withUndefined, readonly, reactVar, defaultValue);
    }
    get sampleValue() { return this._sampleValue; }
    override get type() { return 'LongStringProperty'; }
}
