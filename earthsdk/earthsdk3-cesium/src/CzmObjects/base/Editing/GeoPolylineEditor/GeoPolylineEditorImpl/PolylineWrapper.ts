import { Destroyable, ObjResettingWithEvent, react, track } from "xbsj-base";
import { GeoPolylineEditorImpl } from ".";
import { CzmArcType } from "../../../../../ESJTypesCzm";
import { CzmPolyline } from "../../../../../CzmObjects";

class Polyline extends Destroyable {
    private _polyline
    get polyline() { return this._polyline; }

    constructor(wrapper: PolylineWrapper) {
        super();
        const { impl } = wrapper;
        this._polyline = this.disposeVar(new CzmPolyline(impl.sceneObject.czmViewer));
        const { polyline } = this;

        this.dispose(track([polyline, 'color'], [wrapper, 'color']));
        this.dispose(track([polyline, 'width'], [wrapper, 'width']));
        this.dispose(track([polyline, 'show'], [wrapper, 'show']));
        this.dispose(track([polyline, 'arcType'], [wrapper, 'arcType']));
        this.dispose(track([polyline, 'loop'], [impl, 'loop']));

        const updatePositions = () => {
            const tempPos = [] as [number, number, number][];
            for (const pos of impl.getPositions()) {
                const temp = [...pos] as [number, number, number];
                //@ts-ignore
                temp[2] -= impl.sceneObject.czmViewer.editingHeightOffset ?? 0;
                tempPos.push(temp);
            }
            polyline.positions = tempPos;
        };
        updatePositions();
        polyline.dispose(impl.positionsChanged.disposableOn(updatePositions));
    }
}
/**
 * 用于线编辑的示意线
 */
export class PolylineWrapper extends Destroyable {
    static defaults = {
        show: false,
        color: [1, 1, 1, 1] as [number, number, number, number],
        arcType: 'GEODESIC' as CzmArcType,
        width: 1,
    };

    // polyline show boolean
    private _show = this.disposeVar(react<boolean | undefined>(undefined));
    get show() { return this._show.value; }
    get showChanged() { return this._show.changed; }
    set show(value: boolean | undefined) { this._show.value = value; }

    // polyline color [number, number, number, number]
    private _color = this.disposeVar(react<[number, number, number, number] | undefined>(undefined));
    get color() { return this._color.value; }
    get colorChanged() { return this._color.changed; }
    set color(value: [number, number, number, number] | undefined) { this._color.value = value; }

    // polyline width number
    private _width = this.disposeVar(react<number | undefined>(undefined));
    get width() { return this._width.value; }
    get widthChanged() { return this._width.changed; }
    set width(value: number | undefined) { this._width.value = value; }

    // polyline arcType GeoPolylineArcType
    private _arcType = this.disposeVar(react<CzmArcType | undefined>(undefined));
    get arcType() { return this._arcType.value; }
    get arcTypeChanged() { return this._arcType.changed; }
    set arcType(value: CzmArcType | undefined) { this._arcType.value = value; }

    get impl() { return this._impl; }

    private _resetting = this.disposeVar(new ObjResettingWithEvent(this.showChanged, () => {
        if (this.show ?? PolylineWrapper.defaults.show) {
            return new Polyline(this);
        } else {
            return undefined;
        }
    }));
    get resetting() { return this._resetting; }

    flyTo(duration?: number) {
        this.resetting.obj?.polyline.flyTo(duration);
    }

    constructor(private _impl: GeoPolylineEditorImpl) {
        super();
    }
}
