import { bind, Event, extendClassProps, reactArray, track, UniteChanged } from "xbsj-base";
import { ESJVector4D, GroupProperty, Number4Property, NumberProperty, StringProperty, ESViewer, ESVisualObject, ESImageryLayer } from "earthsdk3";
import { GetCurrentTileCoordinates } from "./type";

export class ESGeHistoryImagery extends ESVisualObject {
    static readonly type = this.register('ESGeHistoryImagery', this, { chsName: '谷歌历史影像', tags: ['ESObjects', '_ES_Impl_UE'], description: "ESGeHistoryImagery" });
    get typeName() { return 'ESGeHistoryImagery'; }
    override get defaultProps() { return ESGeHistoryImagery.createDefaultProps(); }

    private _esImageryLayer = this.dv(new ESImageryLayer());
    get esImageryLayer() { return this._esImageryLayer; }

    private _datesEvent = this.dv(new Event<[string[] | undefined, ESViewer]>());
    get datesEvent() { return this._datesEvent; }

    static override defaults = {
        ...ESVisualObject.defaults,
    }

    constructor(id?: string) {
        super(id);
        const esImageryLayer = this._esImageryLayer;
        this.d(this.components.disposableAdd(esImageryLayer));
        esImageryLayer.zIndex = 1
        esImageryLayer.minimumLevel = 1
        esImageryLayer.maximumLevel = 18
        this.d(track([esImageryLayer, 'show'], [this, 'show']));
        this.d(track([esImageryLayer, 'zIndex'], [this, 'zIndex']));
        this.d(track([esImageryLayer, 'rectangle'], [this, 'rectangle']));
        this.d(bind([esImageryLayer, 'flyInParam'], [this, 'flyInParam']));
        this.d(bind([esImageryLayer, 'flyToParam'], [this, 'flyToParam']));

        this.registerAttachedObjectForContainer(viewer => new GetCurrentTileCoordinates(viewer, this, esImageryLayer));
        this.d(this.flyInEvent.don((duration?: number) => { esImageryLayer.flyIn(duration); }));
        this.d(this.flyToEvent.don((duration?: number) => { esImageryLayer.flyTo(duration); }));
        this.d(this.calcFlyToParamEvent.don(() => { esImageryLayer.calcFlyToParam(); }));
        this.d(this.calcFlyInParamEvent.don(() => { esImageryLayer.calcFlyInParam(); }));

    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new StringProperty('时间', 'currentDate', false, false, [this, 'currentDate'], '0'),
                new NumberProperty('层级', '层级', false, false, [this, 'zIndex'], 0),
                new Number4Property('矩形范围', '西南东北', false, false, [this, 'rectangle'], [-180, -90, 180, 90]),
            ],
        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new StringProperty('currentDate', 'currentDate', false, false, [this, 'currentDate']),
                new NumberProperty('zIndex', '层级', false, false, [this, 'zIndex']),
                new Number4Property('矩形范围', '西南东北', false, false, [this, 'rectangle']),
            ]),
        ];
    }
}

export namespace ESGeHistoryImagery {
    export const createDefaultProps = () => ({
        ...ESVisualObject.createDefaultProps(),
        currentDate: "",
        zIndex: 0,
        rectangle: reactArray<ESJVector4D>([-180, -90, 180, 90]),
    });
}
extendClassProps(ESGeHistoryImagery.prototype, ESGeHistoryImagery.createDefaultProps);
export interface ESGeHistoryImagery extends UniteChanged<ReturnType<typeof ESGeHistoryImagery.createDefaultProps>> { }
