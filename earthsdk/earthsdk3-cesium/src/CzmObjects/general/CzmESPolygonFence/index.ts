import { ESGeoPolygon, ESPolygonFence } from "earthsdk3";
import { CzmESVisualObject } from "../../base";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { flyWithPrimitive } from "../../../utils";
import { bind, createNextAnimateFrameEvent, track } from "xbsj-base";
import { CzmPolygonFence } from "./CzmPolygonFence";

export class CzmESPolygonFence extends CzmESVisualObject<ESPolygonFence> {
    static readonly type = this.register("ESCesiumViewer", ESPolygonFence.type, this);
    private _czmPolygonFence;
    get czmPolygonFence() { return this._czmPolygonFence; }

    private _czmPolygon;
    get czmPolygon() { return this._czmPolygon; }

    constructor(sceneObject: ESPolygonFence, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmPolygonFence = this.disposeVar(new CzmPolygonFence(czmViewer, sceneObject.id));
        this._czmPolygon = this.dv(new ESGeoPolygon());
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        const czmPolygonFence = this._czmPolygonFence;

        const czmPolygon = this._czmPolygon;
        czmViewer.add(czmPolygon);
        this.dispose(() => czmViewer.delete(czmPolygon))
        {
            czmPolygon.filled = false;
            this.d(track([czmPolygon, 'points'], [sceneObject, 'points']));
            this.d(track([czmPolygon, 'stroked'], [sceneObject, 'stroked']));
            this.d(track([czmPolygon, 'strokeColor'], [sceneObject, 'strokeColor']));
            this.d(track([czmPolygon, 'strokeWidth'], [sceneObject, 'strokeWidth']));
            this.d(track([czmPolygon, 'strokeGround'], [sceneObject, 'strokeGround']));
        }

        {   //更新mode
            const modeMap = {
                'danger': { color: [0.99, 0.98, 0.57, 1], image: '01.png' },
                'checkerboard': { color: [0.88, 0.98, 0.99, 1], image: '02.png' },
                'warning': { color: [1, 0.93, 0.58, 1], image: '03.png' },
                'cord': { color: [0.91, 0.87, 0.56, 1], image: '04.png' },
                'scanline': { color: [0.43, 0.78, 0.80, 1], image: '05.png' },
                'honeycomb': { color: [0.28, 0.84, 0.86, 1], image: '06.png' },
                'gradientColor': { color: [1, 1, 1, 1], image: "07.png" }
            } as { [k: string]: { color: [number, number, number, number], image: string } };

            const getSizeSpeed = (mode: string, height: number) => {
                switch (mode) {
                    case 'danger':
                        return {
                            textureMoveSpeed: [0.05, 0],
                            textureSizeInMeters: [2, 2],
                        }
                    case 'checkerboard':
                        return {
                            textureMoveSpeed: [0, 0],
                            textureSizeInMeters: [2, 2],
                        }
                    case 'warning':
                        return {
                            textureMoveSpeed: [-0.05, 0],
                            textureSizeInMeters: [2, 2],
                        }
                    case 'cord':
                        return {
                            textureMoveSpeed: [-0.05, 0],
                            textureSizeInMeters: [2, 2],
                        }
                    case 'scanline':
                        return {
                            textureMoveSpeed: [0, 0],
                            textureSizeInMeters: [height, height],
                        }
                    case 'honeycomb':
                        return {
                            textureMoveSpeed: [0, 0],
                            textureSizeInMeters: [height, height],
                        }
                    case "gradientColor":
                        return {
                            textureMoveSpeed: [0, 0],
                            textureSizeInMeters: [height, height],
                        }
                    default:
                        return {
                            textureMoveSpeed: [0, 0],
                            textureSizeInMeters: [height * 0.5, 2],
                        }
                }
            }

            const basePath = "${earthsdk3-assets-script-dir}/assets/img/fence/";
            const update = () => {
                const mode = sceneObject.materialMode;
                const modeObj = modeMap[mode];
                if (!modeObj) return;
                czmPolygonFence.textureUri = basePath + modeObj.image;
                czmPolygonFence.textureColor = mode !== "gradientColor" ? modeObj.color : sceneObject.fillColor;
                const { textureMoveSpeed, textureSizeInMeters } = getSizeSpeed(mode, sceneObject.height);
                czmPolygonFence.textureMoveSpeed = textureMoveSpeed as [number, number];
                czmPolygonFence.textureSizeInMeters = textureSizeInMeters as [number, number];
            }
            update();
            const event = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.materialModeChanged,
                sceneObject.heightChanged,
                sceneObject.fillColorChanged
            ));
            this.dispose(event.disposableOn(update));
        }

        {
            // this.dispose(track([czmPolygonFence, 'show'], [sceneObject, 'show']));
            this.dispose(track([czmPolygonFence, 'allowPicking'], [sceneObject, 'allowPicking']));
            this.dispose(bind([czmPolygonFence, 'editing'], [sceneObject, 'editing']));
            this.dispose(bind([czmPolygonFence, 'pointEditing'], [sceneObject, 'pointEditing']));
            this.dispose(bind([czmPolygonFence, 'positions'], [sceneObject, 'points']));
            this.dispose(track([czmPolygonFence, 'height'], [sceneObject, 'height']));
            {
                const update = () => {
                    czmPolygonFence.show = sceneObject.show && sceneObject.filled;
                }
                update();
                const event = this.dv(createNextAnimateFrameEvent(sceneObject.showChanged, sceneObject.filledChanged))
                this.dispose(event.don(update))
            }
        }
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmPolygonFence } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            flyWithPrimitive(czmViewer, sceneObject, id, duration, czmPolygonFence.czmCustomPrimitive);
            return true;
        }
    }
    override flyIn(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmPolygonFence } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyInParam) {
            return super.flyIn(duration, id);
        } else {
            flyWithPrimitive(czmViewer, sceneObject, id, duration, czmPolygonFence.czmCustomPrimitive);
            return true;
        }
    }
}
