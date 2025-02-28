import { ReactParamsType } from "xbsj-base";
import { ReactVarProperty } from "./ReactVarProperty";
import { DVT } from "./WithUndefinedProperty";

/**
 * 数字滑块属性
 * @param name 名称
 * @param description 描述
 * @param withUndefined 是否可以undefined
 * @param readonly 是否只读
 * @param reactVar 变量
 * @param _step 步长 例如：0.1
 * @param _minMax 最小最大值
 * @param defaultValue 默认值
**/

export class NumberSliderProperty extends ReactVarProperty<number | undefined> {
    constructor(name: string, description: string, withUndefined: boolean, readonly: boolean, reactVar: ReactParamsType<number | undefined>, private _step: number, private _minMax: [min: number, max: number], defaultValue?: DVT<number | undefined>) {
        super(name, description, withUndefined, readonly, reactVar, defaultValue);
    }
    override get type() { return 'NumberSliderProperty'; }
    get minMax() { return this._minMax; }
    get step() { return this._step; }
}
