import { ESAlarm, ESSceneObject } from "earthsdk3";
import { CzmESObjectWithLocation, CzmModelPrimitive } from "../../base";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { CzmModelAnimationJsonType } from "../../../ESJTypesCzm";
import { bind, createNextAnimateFrameEvent, track } from "xbsj-base";
import { flyWithPrimitive } from "../../../utils";
export class CzmESAlarm extends CzmESObjectWithLocation<ESAlarm> {
    static readonly type = this.register('ESCesiumViewer', ESAlarm.type, this);
    private _czmModelPrimitive;
    get czmModelPrimitive() { return this._czmModelPrimitive; }

    constructor(sceneObject: ESAlarm, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        // 内置资源
        //圆形警告
        const circleUrl = ESSceneObject.context.getStrFromEnv('${earthsdk3-assets-script-dir}/assets/glb/warning/warning_b.glb')
        //柱状警告
        const cylinderUrl = ESSceneObject.context.getStrFromEnv('${earthsdk3-assets-script-dir}/assets/glb/warning/warning_a.glb')
        this._czmModelPrimitive = this.disposeVar(new CzmModelPrimitive(this.czmViewer, this.sceneObject.id));
        const czmModelPrimitive = this._czmModelPrimitive;
        {
            this.ad(bind([czmModelPrimitive, 'position'], [sceneObject, 'position']));
            this.ad(bind([czmModelPrimitive, 'rotation'], [sceneObject, 'rotation']));
            this.ad(track([czmModelPrimitive, 'show'], [sceneObject, 'show']));
        }
        czmModelPrimitive.activeAnimationsAnimateWhilePaused = true
        czmModelPrimitive.activeAnimationsJson = ESAlarm.defaults.czmAnimations as CzmModelAnimationJsonType[]
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

        {
            const updateMode = () => {
                const mode = sceneObject.mode;
                if (mode === 'circle') {
                    czmModelPrimitive.url = circleUrl;
                } else if (mode === 'cylinder' || mode === undefined) {
                    czmModelPrimitive.url = cylinderUrl;
                }
            };
            updateMode();
            this.dispose(sceneObject.modeChanged.disposableOn(() => {
                updateMode()
            }));
        }
        {
            const updateRadius = () => {
                const radius = sceneObject.radius ?? ESAlarm.defaults.radius;
                czmModelPrimitive.scale = [radius * sceneObject.scale[0], radius * sceneObject.scale[1], radius * sceneObject.scale[2]];
            };
            updateRadius();
            const event = this.dv(createNextAnimateFrameEvent(sceneObject.radiusChanged, sceneObject.scaleChanged))
            this.dispose(event.disposableOn(() => {
                updateRadius()
            }));
        }
        //触发创建完成事件
        sceneObject.createdEvent.emit();
    }
    // 重写flyTo方法,基类监听flyToEvent后飞行执行此方法
    override flyTo(duration: number | undefined, id: number) {
        const { sceneObject, czmViewer, czmModelPrimitive } = this;
        if (!czmViewer.actived || !czmViewer.viewer) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            czmModelPrimitive && flyWithPrimitive(czmViewer, sceneObject, id, duration, czmModelPrimitive, true);
            return true;
        }
    }
}
