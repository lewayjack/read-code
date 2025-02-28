import { BooleanProperty, ESJVector4D, GroupProperty, Number4Property, NumberProperty } from "../../ESJTypes";
import { extendClassProps, reactArrayWithUndefined, UniteChanged } from "xbsj-base";
import { ESGeoVector } from "../base";
export class ESRectangle extends ESGeoVector {
    static readonly type = this.register('ESRectangle', this, { chsName: '矩形', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "矩形" });
    get typeName() { return 'ESRectangle'; }
    override get defaultProps() { return ESRectangle.createDefaultProps(); }
    override  _deprecated = [
        "ground"
    ];
    private _deprecatedWarningFunc = (() => { this._deprecatedWarning(); })();
    constructor(id?: string) {
        super(id);
    }
    static override defaults = {
        ...ESGeoVector.defaults,
        ground: false,
        outlineTranslucent: true,
        height: 0,
        extrudedHeight: 0,
        rectangle: undefined,
        stRotation: 0,
        rotation: 0,
        pointEditing: false,
        allowPicking: false,
    }
    override getProperties(language: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new BooleanProperty('是否贴地', 'A boolean Property specifying the visibility.', false, false, [this, 'ground']),
                new BooleanProperty('轮廓线半透明', '轮廓线半透明.', false, false, [this, 'outlineTranslucent']),
                new NumberProperty('高度', '高度', false, false, [this, 'height']),
                new NumberProperty('拉伸高度', '拉伸高度', false, false, [this, 'extrudedHeight']),
                new Number4Property('范围', '西南东北', true, false, [this, 'rectangle'], ESRectangle.defaults.rectangle),
                new NumberProperty('纹理旋转角度', '纹理旋转角度.', false, false, [this, 'stRotation']),
                new NumberProperty('旋转角度', 'rotation', false, false, [this, 'rotation']),
                new BooleanProperty('是否单点编辑', '是否单点编辑.', false, false, [this, 'pointEditing']),
            ]),
        ];
    }
}

export namespace ESRectangle {
    export const createDefaultProps = () => ({
        ...ESGeoVector.createDefaultProps(),
        ground: false,
        outlineTranslucent: true,
        height: 0,
        extrudedHeight: 0,
        rectangle: reactArrayWithUndefined<ESJVector4D | undefined>(undefined),
        rotation: 0,
        stRotation: 0,
        pointEditing: false,
        filled: true,
    });
}
extendClassProps(ESRectangle.prototype, ESRectangle.createDefaultProps);
export interface ESRectangle extends UniteChanged<ReturnType<typeof ESRectangle.createDefaultProps>> { }
