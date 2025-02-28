import { cartesianDistance } from "earthsdk3";
import { ESCesiumViewer } from ".././../ESCesiumViewer";
import { createNextAnimateFrameEvent, Destroyable, getReactFuncs, Listener, ObjResettingWithEvent, react, ReactParamsType, track } from "xbsj-base";


class ViewDistanceDebugInner extends Destroyable {
    //TODO GeoDivTextPoi未加入，后期补全
    // private _geoDivText = this.disposeVar(new GeoDivTextPoi());

    constructor(control: CzmViewDistanceRangeControl) {
        super();
        // const geoDivText = this._geoDivText;
        // control.czmViewer.add(geoDivText);
        // this.dispose(() => control.czmViewer.delete(geoDivText));

        // this.dispose(track([this._geoDivText, 'position'], control.positionReact));

        const update = () => {
            // if (control.viewDistance === Number.NEGATIVE_INFINITY) {
            //     geoDivText.text = `当前不可用`;
            // } else {
            //     geoDivText.text = `视距: ${control.viewDistance.toFixed(2)}米, VA: ${control.visibleAlpha.toFixed(2)}`;
            // }
        };
        update();
        this.dispose(control.viewDistanceChanged.disposableOn(update));
        this.dispose(control.visibleAlphaChanged.disposableOn(update));
    }
}

class ViewDistanceDebug extends Destroyable {
    private _debugObjResetting;
    get debugObjResetting() { return this._debugObjResetting; }

    constructor(private _control: CzmViewDistanceRangeControl) {
        super();
        this._debugObjResetting = this.disposeVar(new ObjResettingWithEvent(this._control.debugChanged, () => {
            if (!this._control.debug) return undefined;
            return new ViewDistanceDebugInner(this._control);
        }));
    }
}

export class CzmViewDistanceRangeControl extends Destroyable {
    private _visibleAlpha = this.disposeVar(react(1));
    get visibleAlpha() { return this._visibleAlpha.value; }
    get visibleAlphaChanged() { return this._visibleAlpha.changed; }

    private _viewDistance = this.disposeVar(react<number>(0));
    get viewDistance() { return this._viewDistance.value; }
    set viewDistance(value: number) { this._viewDistance.value = value; }
    get viewDistanceChanged() { return this._viewDistance.changed; }

    private _debug = this.disposeVar(react<boolean>(false));
    get debug() { return this._debug.value; }
    set debug(value: boolean) { this._debug.value = value; }
    get debugChanged() { return this._debug.changed; }

    get positionReact() { return this._positionReact; }
    get czmViewer() { return this._czmViewer; }

    private _viewDistanceDebug = this.disposeVar(new ViewDistanceDebug(this));
    get viewDistanceDebug() { return this._viewDistanceDebug; }

    constructor(
        private _czmViewer: ESCesiumViewer,
        viewDistanceRangeReact: ReactParamsType<[number, number, number, number] | undefined>,
        private _positionReact: ReactParamsType<[number, number, number] | undefined>,
        radiusReact?: ReactParamsType<number | undefined>,
    ) {
        super();
        const { positionReact, czmViewer } = this;
        const [getVDR, setVDR, vdrChanged] = getReactFuncs<[number, number, number, number] | undefined>(viewDistanceRangeReact);
        const [getPos, setPos, posChanged] = getReactFuncs<[number, number, number] | undefined>(positionReact);
        const [getRadius, setRadius, radiusChanged] = radiusReact ? getReactFuncs<number | undefined>(radiusReact) : [undefined, undefined, undefined];

        const update = () => {
            let vv = 1;
            let vd = Number.NEGATIVE_INFINITY;
            do {
                const viewDistanceRange = getVDR();
                const position = getPos();
                const radius = getRadius ? getRadius() : 0;
                if (!viewDistanceRange || !position) break;
                const ci = czmViewer.getCurrentCameraInfo();
                if (!ci) break;
                vd = cartesianDistance(ci.position, position) - (radius ?? 0);
                const [n0, n1, f1, f0] = viewDistanceRange;

                if (n0 > n1 || n1 > f1 || f1 > f0) {
                    console.error(`viewDistanceRange存在问题，需要满足逐级增大的条件，否则不生效！`);
                    break;
                }

                if (vd >= n1 && vd <= f1) {
                    vv = 1;
                } else if (vd <= n0 || vd >= f0) {
                    vv = 0;
                } else if (vd > n0 && vd < n1) {
                    if (n1 - n0 <= 0) {
                        vv = 0;
                    } else {
                        vv = (vd - n0) / (n1 - n0);
                    }
                } else if (vd > f1 && vd < f0) {
                    if (f0 <= f1) {
                        vv = 0;
                    }
                    vv = (f0 - vd) / (f0 - f1);
                } else {
                    vv = 1;
                    console.error(`不应该运行至此！`);
                }
            } while (false);
            this._viewDistance.value = vd;
            this._visibleAlpha.value = vv;
        };
        update();
        const changeds = [
            czmViewer.cameraChanged,
            vdrChanged,
            posChanged,
        ] as Listener<any[]>[];
        radiusChanged && changeds.push(radiusChanged);

        const event = this.disposeVar(createNextAnimateFrameEvent(...changeds));
        this.dispose(event.disposableOn(update));
    }
}
