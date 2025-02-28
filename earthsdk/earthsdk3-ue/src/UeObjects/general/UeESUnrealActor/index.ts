import { EngineObject, ESJVector2D, ESJVector3D, ESUnrealActor, ESVisualObject } from "earthsdk3"
import {
    calcFlyToParamCallFunc, callFunctionCallFunc, destroyCallFunc, ESUeViewer,
    flyToCallFunc, smoothMoveCallFunc, smoothMoveOnGroundCallFunc, smoothMoveWithRotationCallFunc,
    smoothMoveWithRotationOnGroundCallFunc, UeFuncsType
} from "@ueSrc/ESUeViewer"
import { createNextAnimateFrameEvent, createProcessingFromAsyncFunc, react } from "xbsj-base"
import { getCreatedInfo, getTipInfo } from "./tipInfo";
export class UeESUnrealActor extends EngineObject<ESUnrealActor> {
    static readonly type = this.register('ESUeViewer', ESUnrealActor.type, this);
    constructor(sceneObject: ESUnrealActor, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`${sceneObject.id} UeESUnrealActor viewer is undefined!`);
            return;
        }

        this.d(() => { destroyCallFunc(viewer, sceneObject.id) });

        const updateProps = async () => {
            if (nullActor()) return;
            await viewer.callUeFunc({
                f: 'update',
                p: {
                    id: sceneObject.id,
                    name: sceneObject.name,
                    show: sceneObject.show,
                    rotation: sceneObject.rotation,
                    flyToParam: sceneObject.flyToParam ?? ESVisualObject.defaults.flyToParam,
                    flyInParam: sceneObject.flyInParam ?? ESVisualObject.defaults.flyInParam,
                    editing: sceneObject.editing,
                    highlight: sceneObject.highlight,
                    collision: sceneObject.collision,
                    scale: sceneObject.scale,
                    minVisibleDistance: sceneObject.minVisibleDistance,
                    maxVisibleDistance: sceneObject.maxVisibleDistance,
                }
            });
        };

        const updateEvent = this.dv(createNextAnimateFrameEvent(
            sceneObject.showChanged,
            sceneObject.nameChanged,
            sceneObject.rotationChanged,
            sceneObject.editingChanged,
            sceneObject.flyToParamChanged,
            sceneObject.flyInParamChanged,
            sceneObject.highlightChanged,
            sceneObject.collisionChanged,
            sceneObject.scaleChanged,
            sceneObject.minVisibleDistanceChanged,
            sceneObject.maxVisibleDistanceChanged,
        ));
        this.d(updateEvent.don(updateProps));
        this.d(sceneObject.flushEvent.don(() => updateEvent.flush()));

        let bindedActorTag: string | undefined = undefined;
        let createdActorClass: string | undefined = undefined;
        const updatePostion = async () => {
            // if (sceneObject.position === undefined) return;
            if (nullActor()) return;
            await viewer.callUeFunc({
                f: 'update',
                p: {
                    id: sceneObject.id,
                    position: sceneObject.position,
                }
            });
            (ueViewer.debug ?? false) && console.log(`updatePostion:${sceneObject.position},actorTag:${sceneObject.actorTag},actorClass:${sceneObject.actorClass}`)
        }

        const nullActor = () => {
            if (!bindedActorTag && !createdActorClass) {
                console.warn(`${sceneObject.id} 未绑定ActorTag或未创建ActorClass!`);
                return true;
            } else {
                return false;
            }
        }


        const unBindOrDestroy = async () => {
            const { id } = sceneObject;
            if (bindedActorTag !== undefined) {
                bindedActorTag = undefined;
                try {
                    const result = await ueViewer.unBindActorByID(id);
                    if (!result) return;
                    if (result.error !== "") {
                        console.warn(`${sceneObject.id} UeESUnrealActor UnBindActorByID: ${result.error}`);
                        return;
                    }
                } catch (error) {
                    console.warn(`${sceneObject.id} UeESUnrealActor UnBindActorByID: ${error}`);
                    return;
                }
            }

            if (createdActorClass !== undefined) {
                createdActorClass = undefined;
                try {
                    const result = await viewer.callUeFunc<UeFuncsType['destroy']['result']>({ f: 'destroy', p: { id } });
                    if (!result) return;
                    if (result.error !== "") {
                        console.warn(`${sceneObject.id} UeESUnrealActor DestroyActorByID: ${result.error}`);
                        return;
                    }
                } catch (error) {
                    console.warn(`${sceneObject.id} UeESUnrealActor DestroyActorByID: ${error}`);
                    return;
                }
            };
        }

        type RecreatInfoType = ({ type: 'ActorClass', actorClass: string } | { type: 'ActorTag', actorTag: string }) & { position?: ESJVector3D }
        const recreatInfo = this.dv(react<RecreatInfoType | undefined>(undefined));

        {
            const event = this.dv(createNextAnimateFrameEvent(
                sceneObject.actorClassChanged,
                sceneObject.actorTagChanged,
                // sceneObject.positionChanged,
            ));
            const update = async () => {
                // if (!sceneObject.position) return;
                if (sceneObject.actorTag !== '') {
                    recreatInfo.value = {
                        type: 'ActorTag',
                        actorTag: sceneObject.actorTag,
                        // position: sceneObject.position,
                    };
                    // if (sceneObject.position[0] === 0 && sceneObject.position[1] === 0 && sceneObject.position[2] === 0) {
                    //     // recreatInfo.value.position = sceneObject.position;
                    //     const res = await ueViewer.getObjectByInfo({ actorTag: sceneObject.actorTag });
                    //     res && res.object && res.object.position && (sceneObject.position = res.position);
                    // }
                } else {
                    recreatInfo.value = {
                        type: 'ActorClass',
                        actorClass: sceneObject.actorClass === '' ? 'default' : sceneObject.actorClass,
                        // position: sceneObject.position,
                    };
                }
            };
            update();
            this.d(event.don(update));
            this.d(sceneObject.flushEvent.don(() => event.flush()));
        }

        {
            const processing = this.dv(createProcessingFromAsyncFunc(async cancelsManager => {
                if (recreatInfo.value === undefined) {
                    await cancelsManager.promise(unBindOrDestroy());
                    return;
                }

                if (recreatInfo.value.type === 'ActorTag') {
                    const { actorTag } = recreatInfo.value;

                    // 解绑
                    if (bindedActorTag !== undefined && bindedActorTag !== actorTag) {
                        await cancelsManager.promise(unBindOrDestroy());
                    }

                    // 绑定
                    if (bindedActorTag !== undefined) return;
                    if (actorTag === undefined) return;

                    try {
                        sceneObject.lastActorStatus = 'null'
                        const result = await cancelsManager.promise(ueViewer.bindActorByTag(sceneObject.id, actorTag))
                        if (!result) return;
                        if (result.error !== "") {
                            console.warn(`${sceneObject.id} UeESUnrealActor BindActorByTag:${actorTag},${result.error}`);
                            return;
                        }
                        if (result.re.type === 0) {
                            sceneObject.lastActorStatus = 'bound';
                            bindedActorTag = actorTag;
                        } else if (result.re.type === 1) {
                            sceneObject.lastActorStatus = 'bound';
                            bindedActorTag = actorTag;
                            console.warn(`${sceneObject.id} UeESUnrealActor BindActorByTag:${actorTag},${getTipInfo(result.re.type)}`);
                        } else {
                            sceneObject.lastActorStatus = 'null';
                            bindedActorTag = undefined;
                            console.warn(`${sceneObject.id} UeESUnrealActor BindActorByTag error:${actorTag}, ${getTipInfo(result.re.type)}`);
                            return;
                        }
                    } catch (error) {
                        console.warn(`${sceneObject.id} UeESUnrealActor BindActorByTag catch error:${actorTag}, ${error}`);
                        return;
                    }
                } else if (recreatInfo.value.type === 'ActorClass') {
                    const { actorClass } = recreatInfo.value;

                    // destroy
                    if (createdActorClass !== undefined && actorClass !== createdActorClass) {
                        await cancelsManager.promise(unBindOrDestroy());
                    };

                    // create
                    if (createdActorClass !== undefined) return;
                    if (actorClass === undefined) return;


                    try {
                        sceneObject.lastActorStatus = 'null'
                        const result = await cancelsManager.promise(ueViewer.createActorByClass(sceneObject.id, actorClass));
                        if (!result) return;
                        if (result.error !== "") {
                            console.warn(`${sceneObject.id} UeESUnrealActor CreateActorByClass error :${actorClass}, ${result.error}`);
                            return;
                        }
                        if (result.re.type === 0) {
                            sceneObject.lastActorStatus = 'created';
                            createdActorClass = actorClass;
                        } else {
                            console.warn(`${sceneObject.id} UeESUnrealActor CreateActorByClass error type :${actorClass},${getCreatedInfo(result.re.type)}`);
                            return;
                        }
                    } catch (error) {
                        console.warn(`${sceneObject.id} UeESUnrealActor CreateActorByClass error catch :${actorClass}, ${JSON.stringify(error)}`);
                        return;
                    }
                }
                // 更新属性
                await cancelsManager.promise(updateProps());
                await cancelsManager.promise(updatePostion());
            }));

            const update = async () => {
                processing.restart();
            }
            update();
            this.d(recreatInfo.changed.don(update));
        }

        this.d(sceneObject.positionChanged.don(updatePostion));

        this.d(sceneObject.callFunctionEvent.don((fn, p) => {
            if (nullActor()) return;
            callFunctionCallFunc(viewer, sceneObject.id, fn, p);
        }))

        this.d(sceneObject.smoothMoveEvent.don((Destination: ESJVector3D, Time: number) => {
            if (nullActor()) return;
            smoothMoveCallFunc(viewer, sceneObject.id, Destination, Time);
        }))

        this.d(sceneObject.smoothMoveWithRotationEvent.don((Destination: ESJVector3D, NewRotation: ESJVector3D, Time: number) => {
            if (nullActor()) return;
            smoothMoveWithRotationCallFunc(viewer, sceneObject.id, Destination, NewRotation, Time);
        }))
        this.d(sceneObject.smoothMoveOnGroundEvent.don((Lon: number, Lat: number, Time: number, Ground: string) => {
            if (nullActor()) return;
            smoothMoveOnGroundCallFunc(viewer, sceneObject.id, Lon, Lat, Ground, Time);
        }))
        this.d(sceneObject.smoothMoveWithRotationOnGroundEvent.don((NewRotation: ESJVector3D, Lon: number, Lat: number, Time: number, Ground: string) => {
            if (nullActor()) return;
            smoothMoveWithRotationOnGroundCallFunc(viewer, sceneObject.id, NewRotation, Lon, Lat, Time, Ground);
        }))

        //自动落地
        this.d(sceneObject.automaticLandingEvent.don((flag) => {
            if (nullActor()) return;
            const posi = [sceneObject.position[0], sceneObject.position[1]] as ESJVector2D
            ueViewer.getHeightByLonLat(sceneObject.position[0], sceneObject.position[1], 'Visibility').then((res) => {
                if (res !== null) {
                    sceneObject.position = [...posi, res]
                    sceneObject.collision = flag
                }
            })
        }));

        this.d(sceneObject.flyToEvent.don(async (duration, id) => {
            if (nullActor()) return;
            const res = await flyToCallFunc(viewer, sceneObject.id, duration);
            let mode: 'cancelled' | 'over' | 'error' = 'over';
            if (res === undefined) {
                mode = 'error'
            } else if (res.endType === 0) {
                mode = 'over'
            } else if (res.endType === 1) {
                mode = 'cancelled'
            }
            sceneObject.flyOverEvent.emit(id, mode, ueViewer);
        }));

        this.d(sceneObject.calcFlyToParamEvent.don(() => {
            if (nullActor()) return;
            calcFlyToParamCallFunc(viewer, sceneObject.id);

        }));

        this.d(sceneObject.calcFlyInParamEvent.don(async () => {
            if (!ueViewer.actived) return;
            const cameraInfo = await ueViewer.getCurrentCameraInfo();
            if (!cameraInfo) return;
            const { position, rotation } = cameraInfo;
            sceneObject.flyInParam = { position, rotation, flyDuration: 1 };
        }));

        this.d(ueViewer.propChanged.don((info) => {
            if (nullActor()) return;
            // console.log('ueViewer.propChanged', info)
            if (info.objId !== sceneObject.id) return;
            Object.keys(info.props).forEach(key => {
                const prop = info.props[key] === null ? undefined : info.props[key]
                //@ts-ignore
                sceneObject[key] = prop
            });
        }));
    }
}
