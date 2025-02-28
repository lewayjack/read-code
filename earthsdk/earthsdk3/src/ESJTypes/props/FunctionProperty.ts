import { reactJson, getReactFuncs } from "xbsj-base";
import { ParamsProperty } from "./ParamsProperty";
import { Property } from "./Property";

type ParamTypes = ('string' | 'number' | 'boolean' | 'strings' | 'numbers' | 'booleans' | ['string' | 'number' | 'boolean' | 'strings' | 'numbers' | 'booleans', string])[]

export class FunctionProperty<ParamsType extends (string | number | boolean | string[] | number[] | boolean[])[]> extends Property {
    private _paramsProperty: ParamsProperty<ParamsType>;
    private _getValueFunc: () => ParamsType;
    constructor(name: string, description: string, paramTypes: ParamTypes, private _func: (...args: ParamsType) => void, defaultParams: ParamsType) {
        // const reactVar = reactJson(defaultParams);
        // super(name, description, reactVar, paramTypes);
        // this.disposeVar(reactVar);
        // const [getValue] = getReactFuncs<ParamsType>(this.reactVar);
        // this._getValueFunc = getValue;
        super(name, description);

        const reactVar = this.disposeVar(reactJson(defaultParams));
        this._paramsProperty = this.disposeVar(new ParamsProperty<ParamsType>(name + '_params', name + '_params', reactVar, paramTypes, defaultParams));
        const [getValue] = getReactFuncs<ParamsType>(this._paramsProperty.reactVar);
        this._getValueFunc = getValue;
    }

    get paramsProperty() {
        return this._paramsProperty;
    }

    exec() { this._func(...(this._getValueFunc())); }
    override get type() { return 'FunctionProperty'; }
}
