import { Event, extendClassProps, Listener, react, UniteChanged } from "xbsj-base";
import { BooleanProperty, FunctionProperty, GroupProperty, NumberProperty } from "../../ESJTypes";
import { ESGeoPolygon } from "./ESGeoPolygon";

/**
 * https://www.wolai.com/earthsdk/qwNTqqCTPy5XHw6MYrkkoK
 */
export class ESVolumeMeasurement extends ESGeoPolygon {
    static override readonly type = this.register('ESVolumeMeasurement', this, { chsName: '体积测量', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "体积测量" });
    override get typeName() { return 'ESVolumeMeasurement'; }
    override get defaultProps() { return ESVolumeMeasurement.createDefaultProps(); }

    private _startEvent = this.dv(new Event());
    get startEvent(): Listener { return this._startEvent; }
    start() { this._startEvent.emit(); }

    private _clearEvent = this.dv(new Event());
    get clearEvent(): Listener { return this._clearEvent; }
    clear() { this._clearEvent.emit(); }

    constructor(id?: string) {
        super(id);
        this.filled = false;
        this.stroked = true;
        this.strokeStyle.width = 2;
    }
    static override defaults = {
        ...ESGeoPolygon.defaults,
    }

    override getProperties(language: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new NumberProperty('基准面高程', '基准面高程', true, false, [this, 'planeHeight']),
                new NumberProperty('采样间距 m', '采样间距 m', false, false, [this, 'gridWidth']),
                new NumberProperty('挖方', '挖方 m³', false, true, [this, 'cutVolume']),
                new NumberProperty('填方', '填方 m³', false, true, [this, 'fillVolume']),
                new NumberProperty('挖填方', '挖填方 m³', false, true, [this, 'cutAndFillVolume']),
                new NumberProperty('计算进度', '计算进度', false, true, [this, 'progress']),
                new FunctionProperty('开始分析', '开始分析', [], () => this.start(), []),
                new FunctionProperty('清空分析结果', '清空分析结果', [], () => this.clear(), []),
                new BooleanProperty('是否开启深度检测', 'A boolean Property specifying the visibility.', false, false, [this, 'depthTest']),
            ]),
        ];
    }
}

export namespace ESVolumeMeasurement {
    export const createDefaultProps = () => ({
        ...ESGeoPolygon.createDefaultProps(),
        planeHeight: react<number | undefined>(undefined),
        gridWidth: 1,
        cutVolume: 0,
        fillVolume: 0,
        cutAndFillVolume: 0,
        progress: 0,
        depthTest: false, //深度检测
    });
}
extendClassProps(ESVolumeMeasurement.prototype, ESVolumeMeasurement.createDefaultProps);
export interface ESVolumeMeasurement extends UniteChanged<ReturnType<typeof ESVolumeMeasurement.createDefaultProps>> { }
