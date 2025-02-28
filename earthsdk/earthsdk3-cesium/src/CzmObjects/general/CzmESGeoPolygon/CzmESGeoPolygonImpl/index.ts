// 类名变更：GeoCoplanarPolygon------>CzmESGeoPolygonImpl
import { PickedInfo } from "earthsdk3";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { bind, createNextAnimateFrameEvent, Destroyable, Event, extendClassProps, Listener, reactArray, reactArrayWithUndefined, ReactivePropsToNativePropsAndChanged, reactPositions, SceneObjectKey, track } from "xbsj-base";
import { CzmPolygon, CzmPolyline, PointEditing, PositionsCenter, PositionsEditing } from "../../../../CzmObjects";

export class CzmESGeoPolygonImpl extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _sPositionsEditing: PositionsEditing;
    get sPositionsEditing() { return this._sPositionsEditing; }

    private _sPointEditing: PointEditing;
    get sPointEditing() { return this._sPointEditing; }

    private _positionsCenter: PositionsCenter;
    get positionsCenter() { return this._positionsCenter; }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        this._sPositionsEditing = this.disposeVar(new PositionsEditing([this, 'positions'], true, [this, 'editing'], czmViewer));
        this._positionsCenter = this.disposeVar(new PositionsCenter([this, 'positions']));
        this._sPointEditing = this.disposeVar(new PointEditing([this, 'positions'], [this, 'pointEditing'], czmViewer));
        const viewer = czmViewer.viewer;
        if (!viewer) return;
        const czmPolygon = this.ad(new CzmPolygon(czmViewer, id));
        const czmPolyline = this.ad(new CzmPolyline(czmViewer, id));
        czmPolyline.loop = true;

        this.ad(bind([czmPolyline, 'depthTest'], [this, 'depthTest']));
        this.dispose(track([czmPolygon, 'allowPicking'], [this, 'allowPicking']));
        {
            const update = () => {
                czmPolygon.ground = this.ground;
                czmPolyline.ground = this.strokeGround;
                czmPolyline.arcType = this.strokeGround ? 'NONE' : 'GEODESIC';
            }
            update();
            const event = this.ad(createNextAnimateFrameEvent(
                this.groundChanged,
                this.strokeGroundChanged,
            ))
            this.ad(event.don(update))
        }

        const updatePolygon = () => {

            czmPolyline.show = this.show && this.outline
            czmPolygon.show = this.show && this.fill
            // czmPolyline.show = this.show && this.outline && czmGeoCoplanarPolygon.visibleAlpha > 0;
            // czmPolygon.show = this.show && this.fill && czmGeoCoplanarPolygon.visibleAlpha > 0;

            czmPolyline.positions = this.positions;
            czmPolygon.polygonHierarchy = czmPolygon.show ? { positions: this.positions || [] } : { positions: [] };

            czmPolyline.color = this.outlineColor;
            czmPolyline.width = this.outlineWidth;

            czmPolygon.material = {
                type: 'Color',
                color: this.color || [1, 1, 1, .5],
            };
        };
        updatePolygon();
        const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
            this.showChanged,
            this.outlineChanged,
            this.outlineColorChanged,
            this.outlineWidthChanged,
            this.fillChanged,
            this.colorChanged,
            this.positionsChanged,
            // czmGeoCoplanarPolygon.visibleAlphaChanged,

        ));
        this.dispose(updateEvent.disposableOn(updatePolygon));

        this.dispose(this.flyToEvent.disposableOn(duration => {
            if (!this.viewDistanceRange) {
                czmPolygon.flyTo(duration);
                if (!this.fill) {
                    czmPolyline.flyTo(duration)
                }
            } else {
                // const centerPoint = this.positionsCenter.center as [number, number, number]
                // const viewDistance = (this.viewDistanceRange[1] + this.viewDistanceRange[2]) / 2
                // czmViewer.flyTo(centerPoint, viewDistance, undefined, duration)
            }
        }));
    }
    static defaults = {
        // show: true,
        // allowPicking: false,
        // outline: true,
        // outlineColor: [1, 1, 1, 1] as [number, number, number, number],
        // outlineWidth: 2,
        // fill: true,
        // color: [1, 1, 1, .5] as [number, number, number, number],
        // editing: false,
        viewDistanceRange: [1000, 10000, 30000, 60000] as [number, number, number, number],
        positions: [],
    };
}

export namespace CzmESGeoPolygonImpl {
    export const createDefaultProps = () => ({
        show: true,
        allowPicking: false,
        outline: true,
        strokeGround: false,
        ground: false,
        outlineColor: reactArray<[number, number, number, number]>([1, 1, 1, 1]),
        outlineWidth: 2,
        fill: true,
        color: reactArray<[number, number, number, number]>([1, 1, 1, .5]),
        editing: false,
        pointEditing: false,
        positions: reactPositions(undefined),
        viewDistanceRange: reactArrayWithUndefined<[number, number, number, number]>(undefined),
        viewDistanceDebug: false,
        depthTest: false, //深度检测
    });
}
extendClassProps(CzmESGeoPolygonImpl.prototype, CzmESGeoPolygonImpl.createDefaultProps);
export interface CzmESGeoPolygonImpl extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmESGeoPolygonImpl.createDefaultProps>> { }

