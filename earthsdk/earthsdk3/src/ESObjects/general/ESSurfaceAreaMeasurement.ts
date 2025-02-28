import { FunctionProperty, GroupProperty, NumberProperty } from "../../ESJTypes";
import { Event, extendClassProps, Listener, UniteChanged } from "xbsj-base";
import { ESGeoPolygon } from "./ESGeoPolygon";

/**
 * https://www.wolai.com/earthsdk/nyM7sCD88nKDUquCKf1koA
 */
export class ESSurfaceAreaMeasurement extends ESGeoPolygon {
    static override readonly type = this.register('ESSurfaceAreaMeasurement', this, { chsName: '表面积测量', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "表面积测量" });
    override get typeName() { return 'ESSurfaceAreaMeasurement'; }
    override get defaultProps() { return ESSurfaceAreaMeasurement.createDefaultProps(); }

    private _startEvent = this.disposeVar(new Event());
    get startEvent(): Listener { return this._startEvent; }
    start() { this._startEvent.emit(); }

    static override defaults = {
        ...ESGeoPolygon.defaults,
        interpolation: 0.5, //插值距离，单位米，为0时不插值
        offsetHeight: 0, //三角面整体偏移高度
    };

    constructor(id?: string) {
        super(id);
        this.fillStyle.ground = true
    }

    override getProperties(language: string) {
        return [...super.getProperties(language),
        new GroupProperty('ESSurfaceAreaMeasurement', '表面积测量', [
            new FunctionProperty('开始计算', '开始计算', [], () => this.start(), []),
            new NumberProperty('插值距离', '插值距离,单位米,为0时不插值', false, false, [this, 'interpolation'], ESSurfaceAreaMeasurement.defaults.interpolation),
            new NumberProperty('偏移高度', '三角面整体偏移高度，单位米', false, false, [this, 'offsetHeight'], ESSurfaceAreaMeasurement.defaults.offsetHeight),
        ])]
    }
}

export namespace ESSurfaceAreaMeasurement {
    export const createDefaultProps = () => ({
        ...ESGeoPolygon.createDefaultProps(),
        interpolation: undefined as number | undefined,
        offsetHeight: undefined as number | undefined,
    });
}
extendClassProps(ESSurfaceAreaMeasurement.prototype, ESSurfaceAreaMeasurement.createDefaultProps);
export interface ESSurfaceAreaMeasurement extends UniteChanged<ReturnType<typeof ESSurfaceAreaMeasurement.createDefaultProps>> { }
