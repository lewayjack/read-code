import { ESLocalPolygon, ESLocalRectangle } from "earthsdk3";
import { CzmESObjectWithLocation } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { bind, track } from "xbsj-base";

export class CzmESLocalRectangle extends CzmESObjectWithLocation<ESLocalRectangle> {
    static readonly type = this.register("ESCesiumViewer", ESLocalRectangle.type, this);
    private _czmLocalRectangle;
    get czmLocalRectangle() { return this._czmLocalRectangle; }

    constructor(sceneObject: ESLocalRectangle, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmLocalRectangle = this.disposeVar(new ESLocalPolygon(sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        const czmLocalRectangle = this._czmLocalRectangle;
        czmViewer.add(czmLocalRectangle);
        this.dispose(() => czmViewer.delete(czmLocalRectangle))
        // position
        {
            this.dispose(track([czmLocalRectangle, 'stroked'], [sceneObject, 'stroked']));
            this.dispose(track([czmLocalRectangle, 'strokeColor'], [sceneObject, 'strokeColor']));
            this.dispose(track([czmLocalRectangle, 'strokeWidth'], [sceneObject, 'strokeWidth']));
            this.dispose(track([czmLocalRectangle, 'fillColor'], [sceneObject, 'fillColor']));
            this.dispose(track([czmLocalRectangle, 'filled'], [sceneObject, 'filled']));
            this.dispose(track([czmLocalRectangle, 'strokeGround'], [sceneObject, 'strokeGround']));
            this.dispose(track([czmLocalRectangle, 'fillGround'], [sceneObject, 'fillGround']));
        }

        {
            this.dispose(track([czmLocalRectangle, 'show'], [sceneObject, 'show']));
            this.dispose(track([czmLocalRectangle, 'allowPicking'], [sceneObject, 'allowPicking']));
            this.dispose(bind([czmLocalRectangle, 'editing'], [sceneObject, 'editing']));
        }

        {
            this.dispose(bind([czmLocalRectangle, 'position'], [sceneObject, 'position']));
            // 注意这里不能使用bindNorthRotation，因为eSLocalPolygon是ES对象，不是Czm或者Geo对象，
            // 只有Czm/Geo对象转到ES对象时才需要用到bindNorthRotation！
            // vtxf 20240129
            this.dispose(bind([czmLocalRectangle, 'rotation'], [sceneObject, 'rotation']));
            this.dispose(bind([czmLocalRectangle, 'scale'], [sceneObject, 'scale']));
        }


        {
            const update = () => {
                const width = sceneObject.width ?? 0
                const height = sceneObject.height ?? 0
                czmLocalRectangle.points = [
                    [
                        -width,
                        -height
                    ],
                    [
                        -width,
                        height
                    ],
                    [
                        width,
                        height
                    ],
                    [
                        width,
                        -height
                    ]
                ]
            }
            this.dispose(sceneObject.widthChanged.disposableOn(update));
            this.dispose(sceneObject.heightChanged.disposableOn(update));
            update()
        }
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmLocalRectangle } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            czmLocalRectangle.flyTo(duration);
            sceneObject.flyOverEvent.emit(id, 'over', czmViewer);
            return true;
        }
    }
}
