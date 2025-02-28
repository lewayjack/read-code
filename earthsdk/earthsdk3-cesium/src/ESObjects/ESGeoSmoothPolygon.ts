import { BooleanProperty, ESGeoVector, ESJFillStyle, GroupProperty, NumberProperty } from "earthsdk3";
import { extendClassProps, ReactivePropsToNativePropsAndChanged, SceneObjectKey } from "xbsj-base";

export class ESGeoSmoothPolygon extends ESGeoVector {
    static readonly type = this.register('ESGeoSmoothPolygon', this, { chsName: '平滑多边形', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "平滑多边形" });
    get typeName() { return 'ESGeoSmoothPolygon'; }
    override get defaultProps() { return ESGeoSmoothPolygon.createDefaultProps(); }

    override  _deprecated = [
        "ground"
    ];
    private _deprecatedWarningFunc = (() => { this._deprecatedWarning(); })();

    constructor(id?: SceneObjectKey) {
        super(id);
        this.stroked = true;
        this.filled = true;
        this.strokeColor = [1, 1, 1, 1];
        this.fillColor = [1, 1, 1, 0.5];
    }

    static override defaults = {
        ...ESGeoVector.defaults,
        fillStyle: {
            color: [1, 1, 1, 0.5],
            material: '',
            materialParams: {}
        } as ESJFillStyle,
    }

    override getProperties(language: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new GroupProperty('czm', 'czm', [
                    new BooleanProperty('是否贴地', 'A boolean Property specifying the visibility.', true, false, [this, 'ground'], false),
                    new NumberProperty('厚度', '厚度', true, false, [this, 'depth'], 16),
                ]),
            ]),
        ];
    }
}

export namespace ESGeoSmoothPolygon {
    export const createDefaultProps = () => ({
        ...ESGeoVector.createDefaultProps(),
        ground: false,
        // TODO 这些属性应该使用基类中的属性实现
        // outline: undefined as boolean | undefined,
        // outlineColor: reactArrayWithUndefined<[number, number, number, number] | undefined>(undefined),
        // outlineWidth: undefined as number | undefined,
        // color: reactArrayWithUndefined<[number, number, number, number] | undefined>(undefined),
        depth: 0,
    });
}
extendClassProps(ESGeoSmoothPolygon.prototype, ESGeoSmoothPolygon.createDefaultProps);
export interface ESGeoSmoothPolygon extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESGeoSmoothPolygon.createDefaultProps>> { }