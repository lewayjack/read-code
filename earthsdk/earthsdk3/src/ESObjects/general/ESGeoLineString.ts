
import { extendClassProps, react, reactJson, UniteChanged } from "xbsj-base";
import { ESGeoVector } from "../base";
import { BooleanProperty, ColorProperty, EnumProperty, ESJStrokeStyle, GroupProperty, NumberProperty } from "../../ESJTypes";
import { getDistancesFromPositions } from "../../utils";

/**
 * https://www.wolai.com/earthsdk/wAn2bN9HA2mo8uw56dPa76
 */
export class ESGeoLineString extends ESGeoVector {
    static readonly type = this.register('ESGeoLineString', this, { chsName: '地理折线', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "地理折线" });
    get typeName() { return 'ESGeoLineString'; }
    override get defaultProps() { return ESGeoLineString.createDefaultProps(); }

    private _distance = this.dv(react(0));
    get distance() { return this._distance.value; }
    get distanceChanged() { return this._distance.changed; }

    static override defaults = {
        ...ESGeoVector.defaults,
        strokeStyle: {
            width: 1,
            widthType: 'screen',
            color: [1, 1, 1, 1],
            material: '',
            materialParams: {},
            ground: false,
        } as ESJStrokeStyle,
        stroked: true,
    };

    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            coordinate: [
                ...properties.coordinate,
                new NumberProperty('长度', '距离', false, true, [this, 'distance']),
            ],
            style: [
                new GroupProperty('点样式', '点样式集合', []),
                new BooleanProperty('开启', '开启点样式', false, false, [this, 'pointed'], false),
                new NumberProperty('点大小', '点大小(pointSize)', false, false, [this, 'pointSize'], 1),
                new EnumProperty('点类型', '点类型(pointSizeType)', false, false, [this, 'pointSizeType'], [['screen', 'screen'], ['world', 'world']], 'screen'),
                new ColorProperty('点颜色', '点颜色(pointColor)', false, false, [this, 'pointColor'], [1, 1, 1, 1]),
                new GroupProperty('线样式', '线样式集合', []),
                new BooleanProperty('开启', '开启线样式', false, false, [this, 'stroked'], true),
                new BooleanProperty('贴地', '是否贴地(线)', false, false, [this, 'strokeGround']),
                new NumberProperty('线宽', '线宽(strokeWidth)', false, false, [this, 'strokeWidth'], 1),
                new EnumProperty('线类型', '线类型(strokeWidthType)', false, false, [this, 'strokeWidthType'], [['screen', 'screen'], ['world', 'world']], 'screen'),
                new ColorProperty('线颜色', '线颜色(strokeColor)', false, false, [this, 'strokeColor'], [1, 1, 1, 1]),
            ],

        };
    };

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('计算', '计算', [
                new NumberProperty('距离', '距离', false, true, [this, 'distance']),
            ]),
        ];
    }

    constructor(id?: string) {
        super(id);
        const update = () => {
            if (this.points && this.points.length >= 2) {
                const distances = getDistancesFromPositions(this.points, 'GEODESIC');
                const totalDistance = distances[distances.length - 1];
                this._distance.value = totalDistance;
            } else {
                this._distance.value = 0;
            }
        }
        update();
        this.d(this.pointsChanged.don(update));
    }
}


export namespace ESGeoLineString {
    export const createDefaultProps = () => ({
        ...ESGeoVector.createDefaultProps(),
        stroked: true,
        strokeStyle: reactJson<ESJStrokeStyle>(ESGeoLineString.defaults.strokeStyle),
    });
}
extendClassProps(ESGeoLineString.prototype, ESGeoLineString.createDefaultProps);
export interface ESGeoLineString extends UniteChanged<ReturnType<typeof ESGeoLineString.createDefaultProps>> { }
