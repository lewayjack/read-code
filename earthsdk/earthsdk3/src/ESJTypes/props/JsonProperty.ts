import { JsonValue, ReactParamsType } from "xbsj-base";
import { ReactVarProperty } from "./ReactVarProperty";
import { DVT } from "./WithUndefinedProperty";


export class JsonProperty<T extends JsonValue> extends ReactVarProperty<T> {
    constructor(name: string, description: string, withUndefined: boolean, readonly: boolean, reactVar: ReactParamsType<T>, defaultValue?: DVT<T> | undefined, private _sampleValue?: string) {
        super(name, description, withUndefined, readonly, reactVar, defaultValue);
    }
    get sampleValue() { return this._sampleValue; }
    override get type() { return 'JsonProperty'; }
}
