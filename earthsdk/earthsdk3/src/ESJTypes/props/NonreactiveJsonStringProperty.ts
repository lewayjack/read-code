import { DVT, WithUndefinedProperty } from "./WithUndefinedProperty";

/**
 * 非响应式Json字符串属性
 */
export class NonreactiveJsonStringProperty extends WithUndefinedProperty<string> {
    constructor(name: string, description: string, withUndefined: boolean, readonly: boolean, private _getJsonStringFunc: () => string | undefined, private _setJsonStringFunc: (value: string | undefined) => void, defaultValue?: DVT<string>) {
        super(name, description, withUndefined, readonly, defaultValue);
    }
    override get type() { return 'NonreactiveJsonStringProperty'; }
    get getJsonStringFunc() { return this._getJsonStringFunc; }
    get setJsonStringFunc() { return this._setJsonStringFunc; }
}
