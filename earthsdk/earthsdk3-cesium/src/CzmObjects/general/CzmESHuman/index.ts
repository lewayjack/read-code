import { ESHuman, ESSceneObject } from "earthsdk3";
import { CzmESObjectWithLocation, CzmModelPrimitive } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { CzmModelAnimationJsonType } from "../../../ESJTypesCzm";
import { bindNorthRotation, flyWithPrimitive } from "../../../utils";
import { bind, createNextAnimateFrameEvent, track } from "xbsj-base";
import * as Cesium from 'cesium';
export class CzmESHuman extends CzmESObjectWithLocation<ESHuman> {
    static readonly type = this.register("ESCesiumViewer", ESHuman.type, this);
    private _czmModelPrimitive;
    get czmModelPrimitive() { return this._czmModelPrimitive; }

    constructor(sceneObject: ESHuman, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        this._czmModelPrimitive = this.disposeVar(new CzmModelPrimitive(czmViewer, this.sceneObject.id));
        const czmModelPrimitive = this._czmModelPrimitive;
        this.dispose(track([czmModelPrimitive, 'show'], [sceneObject, 'show']));
        this.dispose(bind([czmModelPrimitive, 'position'], [sceneObject, 'position']));
        this.dispose(bindNorthRotation([czmModelPrimitive, 'rotation'], [sceneObject, 'rotation']));
        this.dispose(bind([czmModelPrimitive, 'scale'], [sceneObject, 'scale']));
        {
            const event = this.dv(createNextAnimateFrameEvent(sceneObject.allowPickingChanged, sceneObject.editingChanged))
            const update = () => {
                if (sceneObject.allowPicking && !sceneObject.editing) {
                    czmModelPrimitive.allowPicking = true;
                } else {
                    czmModelPrimitive.allowPicking = false;
                }
            }
            update();
            this.d(event.don(update));
        }
        const workerUrl = ESSceneObject.getStrFromEnv('${earthsdk3-assets-script-dir}/assets/glb/human/worker.glb')
        const policeUrl = ESSceneObject.getStrFromEnv('${earthsdk3-assets-script-dir}/assets/glb/human/police.glb')
        const pedestrianUrl = ESSceneObject.getStrFromEnv('${earthsdk3-assets-script-dir}/assets/glb/human/pedestrian.glb')
        const strangerUrl = ESSceneObject.context.getStrFromEnv('${earthsdk3-assets-script-dir}/assets/glb/human/stranger.glb')
        const suitManUrl = ESSceneObject.context.getStrFromEnv('${earthsdk3-assets-script-dir}/assets/glb/human/suitMan.glb')
        const suitWomanUrl = ESSceneObject.context.getStrFromEnv('${earthsdk3-assets-script-dir}/assets/glb/human/suitWoman.glb')
        const update = () => {
            const mode = sceneObject.mode;
            switch (mode) {
                case 'worker':
                    czmModelPrimitive.url = workerUrl;
                    break;
                case 'police':
                    czmModelPrimitive.url = policeUrl;
                    break;
                case 'pedestrian':
                    czmModelPrimitive.url = pedestrianUrl;
                    break;
                case 'stranger':
                    czmModelPrimitive.url = strangerUrl;
                    break;
                case 'suitMan':
                    czmModelPrimitive.url = suitManUrl;
                    break;
                case 'suitWoman':
                    czmModelPrimitive.url = suitWomanUrl;
                    break;
                default:
                    czmModelPrimitive.url = workerUrl;
                    break;
            }
        };

        this.dispose(sceneObject.modeChanged.disposableOn(() => {
            update()
        }));
        update();

        const updateAnimation = () => {
            const animation = sceneObject.animation ?? ESHuman.defaults.animation;
            if (!sceneObject.show) {
                czmModelPrimitive.activeAnimationsJson = undefined;
                return;
            }
            if (animation === 'walking') {
                czmModelPrimitive.activeAnimationsJson = ESHuman.defaults.czmAnimationsWalk as CzmModelAnimationJsonType[]
            } else if (animation === 'standing') {
                czmModelPrimitive.activeAnimationsJson = ESHuman.defaults.czmAnimationsStand as CzmModelAnimationJsonType[]
            } else if (animation === 'running') {
                czmModelPrimitive.activeAnimationsJson = ESHuman.defaults.czmAnimationsRun as CzmModelAnimationJsonType[]
            }
        }
        updateAnimation()
        const event = this.ad(createNextAnimateFrameEvent(
            sceneObject.showChanged,
            sceneObject.animationChanged
        ))
        this.dispose(event.disposableOn(() => updateAnimation()));
        this.dispose(viewer.scene.preUpdate.addEventListener(() => {
            const primitive = czmModelPrimitive.primitive;
            const { scene, camera } = viewer;
            if (primitive && primitive.ready) {
                // 看看包围球占几个像素
                const pixelSize = primitive.boundingSphere.radius * 2 / camera.getPixelSize(
                    primitive.boundingSphere,
                    scene.drawingBufferWidth,
                    scene.drawingBufferHeight
                );
                const cullingVolume = viewer.camera.frustum.computeCullingVolume(camera.position, camera.direction, camera.up);
                const intersect = cullingVolume.computeVisibility(primitive.boundingSphere);
                czmModelPrimitive.activeAnimationsAnimateWhilePaused = !(intersect === Cesium.Intersect.OUTSIDE) && pixelSize > 5;
            }
        }));
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmModelPrimitive } = this;
        if (!czmViewer.actived || !czmViewer.viewer) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            super.flyTo(duration, id);
            return true;
        } else {
            czmModelPrimitive && flyWithPrimitive(czmViewer, sceneObject, id, duration, czmModelPrimitive, true);
            return !!czmModelPrimitive;
        }
    }
}
