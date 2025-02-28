import { bind, createNextAnimateFrameEvent, Destroyable, extendClassProps, Listener, ObjResettingWithEvent } from "xbsj-base";
import { UniteChanged } from "xbsj-base";
import { GeoCameraController } from "./GeoCameraController";
import { ESCesiumViewer } from "../../index";
import { ESJVector3D, ESSceneObject, ESSceneObjectWithId } from "earthsdk3";

class SceneObjectResetting extends Destroyable {
    constructor(sceneObject: ESSceneObject, controller: GeoSceneObjectCameraController) {
        super();

        const positionPropertyName = controller.positionPropertyName ?? 'position';
        const positionChangedPropertyName = controller.positionChangedPropertyName ?? positionPropertyName + 'Changed';
        const rotationPropertyName = controller.rotationPropertyName ?? 'rotation';
        const rotationChangedPropertyName = controller.rotationChangedPropertyName ?? rotationPropertyName + 'Changed';

        const hasPosition = (controller.positionTracking ?? true) && Reflect.has(sceneObject, positionPropertyName) && Reflect.has(sceneObject, positionChangedPropertyName);
        const hasRotation = (controller.rotationTracking ?? true) && Reflect.has(sceneObject, rotationPropertyName) && Reflect.has(sceneObject, rotationChangedPropertyName);

        if (!hasPosition && !hasRotation) return;

        if (hasPosition) {
            const update = () => {
                // @ts-ignore
                controller.geoCameraController.position = sceneObject[positionPropertyName];
            };
            update();
            // @ts-ignore
            const changed = sceneObject[positionChangedPropertyName] as Listener<[ESJVector3D | undefined, ESJVector3D | undefined]>;
            this.d(changed.don(update));
        }

        if (hasRotation) {
            const update = () => {
                // @ts-ignore
                controller.geoCameraController.rotation = sceneObject[rotationPropertyName];
            };
            update();
            // @ts-ignore
            const changed = sceneObject[positionChangedPropertyName] as Listener<[ESJVector3D | undefined, ESJVector3D | undefined]>;
            this.d(changed.don(update));
        }
    }
}

class SceneObjectIdResetting extends Destroyable {
    constructor(id: string, controller: GeoSceneObjectCameraController) {
        super();

        const sofi = this.dv(new ESSceneObjectWithId());
        sofi.id = id;

        const sceneObjectWatchingResettingEvent = this.dv(createNextAnimateFrameEvent(
            controller.enabledChanged,
            controller.positionTrackingChanged,
            controller.rotationTrackingChanged,
            controller.positionPropertyNameChanged,
            controller.positionChangedPropertyNameChanged,
            controller.rotationPropertyNameChanged,
            controller.rotationChangedPropertyNameChanged,
            sofi.sceneObjectChanged,
        ));

        this.disposeVar(new ObjResettingWithEvent(sceneObjectWatchingResettingEvent, () => {
            const { sceneObject } = sofi;
            if (!controller.enabled || !sceneObject) return undefined;

            return new SceneObjectResetting(sceneObject, controller);
        }));
    }
}

export class GeoSceneObjectCameraController extends Destroyable {
    private _geoCameraController: GeoCameraController;
    get geoCameraController() { return this._geoCameraController; }

    constructor(czmViewer: ESCesiumViewer) {
        super();
        this._geoCameraController = this.dv(new GeoCameraController(czmViewer));
        this.d(bind([this._geoCameraController, 'enabled'], [this, 'enabled']));

        this.dv(new ObjResettingWithEvent(this.sceneObjectIdChanged, () => {
            if (!this.sceneObjectId) return undefined;
            return new SceneObjectIdResetting(this.sceneObjectId, this);
        }));
    }

}

export namespace GeoSceneObjectCameraController {
    export const createDefaultProps = () => ({
        enabled: undefined as boolean | undefined,
        sceneObjectId: undefined as string | undefined,
        positionTracking: undefined as boolean | undefined,
        rotationTracking: undefined as boolean | undefined,
        positionPropertyName: undefined as string | undefined,
        positionChangedPropertyName: undefined as string | undefined,
        rotationPropertyName: undefined as string | undefined,
        rotationChangedPropertyName: undefined as string | undefined,
    });
}
extendClassProps(GeoSceneObjectCameraController.prototype, GeoSceneObjectCameraController.createDefaultProps);
export interface GeoSceneObjectCameraController extends UniteChanged<ReturnType<typeof GeoSceneObjectCameraController.createDefaultProps>> { }
