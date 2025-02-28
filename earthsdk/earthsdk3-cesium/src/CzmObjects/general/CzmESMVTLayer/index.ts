import { CzmESVisualObject, CzmImagery } from "../../base";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { ESMVTLayer } from "../../../ESObjects";
import { createNextAnimateFrameEvent, track } from "xbsj-base";

export class CzmESMVTLayer extends CzmESVisualObject<ESMVTLayer> {
    static readonly type = this.register("ESCesiumViewer", ESMVTLayer.type, this);

    private _czmImagery;
    get czmImagery() { return this._czmImagery; }

    constructor(sceneObject: ESMVTLayer, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmImagery = this.dv(new CzmImagery(czmViewer, sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        const czmImagery = this._czmImagery;

        this.d(track([czmImagery, 'show'], [sceneObject, 'show']));
        this.d(track([czmImagery, 'zIndex'], [sceneObject, 'zIndex']))
        this.d(track([czmImagery, 'rectangle'], [sceneObject, 'rectangle']));

        {
            const event = this.dv(createNextAnimateFrameEvent(
                sceneObject.urlChanged,
                sceneObject.accessTokenChanged,
                sceneObject.maximumLevelChanged,
                sceneObject.minimumLevelChanged,
                sceneObject.tileSizeChanged,
                sceneObject.allowPickingChanged,
                sceneObject.rectangleChanged,
                sceneObject.styleChanged,
            ));
            const update = () => {
                czmImagery.imageryProvider = {
                    //@ts-ignore
                    type: "MVTImageryProvider",
                    url: typeof sceneObject.url == 'string' ? sceneObject.url : sceneObject.url.url,
                    accessToken: sceneObject.accessToken,
                    maximumLevel: sceneObject.maximumLevel,
                    minimumLevel: sceneObject.minimumLevel,
                    tileSize: sceneObject.tileSize,
                    enablePickFeatures: sceneObject.allowPicking,
                    rectangle: sceneObject.rectangle,
                    style: sceneObject.style,
                };
            }
            update();
            this.d(event.don(update));
        }
    }

    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmImagery } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            czmImagery.flyTo(duration && duration);
            sceneObject.flyOverEvent.emit(id, 'over', czmViewer);
            return true;
        }
    }
    override flyIn(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmImagery } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyInParam) {
            return super.flyIn(duration, id);
        } else {
            czmImagery.flyTo(duration && duration);
            sceneObject.flyOverEvent.emit(id, 'over', czmViewer);
            return true;
        }
    }
}