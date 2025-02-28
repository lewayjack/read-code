import { ESJVector2D, ESJVector3D, ESObjectWithLocation } from "earthsdk3";
import { UeESVisualObject } from "../UeESVisualObject";
import { ESUeViewer } from "../../../ESUeViewer";
import { createNextAnimateFrameEvent } from "xbsj-base";
import {
    smoothMoveCallFunc, smoothMoveOnGroundCallFunc,
    smoothMoveWithRotationCallFunc, smoothMoveWithRotationOnGroundCallFunc
} from "../../../ESUeViewer/uemsg/CallUeFuncs";
import { CallUeFuncResult, SmoothMoveRelativelyType, SmoothMoveRelativelyWithRotationType } from "./types";

export class UeESObjectWithLocation<T extends ESObjectWithLocation = ESObjectWithLocation> extends UeESVisualObject<T> {

    static override forceUeUpdateProps = [
        ...UeESVisualObject.forceUeUpdateProps,
        'editing',
    ];
    static override propValFuncs = {
        ...UeESVisualObject.propValFuncs,
    }
    constructor(sceneObject: T, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);

        const viewer = ueViewer.viewer;
        if (!viewer) return;

        const update = () => {
            //多发一次测试
            if (sceneObject.editing) return;
            viewer.callUeFunc({
                f: 'update',
                p: {
                    id: sceneObject.id,
                    position: sceneObject.position,
                    rotation: sceneObject.rotation
                }
            })
        };
        const updateEvent = this.dv(createNextAnimateFrameEvent(
            sceneObject.positionChanged,
            sceneObject.rotationChanged,
            sceneObject.editingChanged,
        ));
        this.d(updateEvent.don(() => { setTimeout(update, 0) }));

        this.d(sceneObject.smoothMoveEvent.don((Destination: ESJVector3D, Time: number) => {
            smoothMoveCallFunc(viewer, sceneObject.id, Destination, Time)
        }))
        this.d(sceneObject.smoothMoveWithRotationEvent.don((Destination: ESJVector3D, NewRotation: ESJVector3D, Time: number) => {
            smoothMoveWithRotationCallFunc(viewer, sceneObject.id, Destination, NewRotation, Time)
        }))
        this.d(sceneObject.smoothMoveOnGroundEvent.don((Lon: number, Lat: number, Time: number, Ground: string) => {
            smoothMoveOnGroundCallFunc(viewer, sceneObject.id, Lon, Lat, Ground, Time)
        }))
        this.d(sceneObject.smoothMoveWithRotationOnGroundEvent.don((NewRotation: ESJVector3D, Lon: number, Lat: number, Time: number, Ground: string) => {
            smoothMoveWithRotationOnGroundCallFunc(viewer, sceneObject.id, NewRotation, Lon, Lat, Time, Ground)
        }))

        this.d(sceneObject.smoothMoveKeepPitchEvent.don(async (Destination: ESJVector3D, Time: number) => {
            const res = await viewer.callUeFunc<CallUeFuncResult>({
                f: 'SmoothMoveKeepPitch',
                p: {
                    id: sceneObject.id,
                    Destination, Time
                }
            });
            if (res.error) console.error(`SmoothMoveKeepPitch:`, res.error);
        }))


        //自动落地
        this.d(sceneObject.automaticLandingEvent.don((flag) => {
            const posi = [sceneObject.position[0], sceneObject.position[1]] as ESJVector2D
            ueViewer.getHeightByLonLat(sceneObject.position[0], sceneObject.position[1], 'Visibility').then((res) => {
                if (res !== null) {
                    sceneObject.position = [...posi, res]
                    sceneObject.collision = flag
                }
            })
        }));

        const SmoothMoveRelativelyCallFunc = async (ueViewer: ESUeViewer, id: string, RelativePosition: ESJVector3D, Time: number) => {
            const { viewer } = ueViewer;
            if (!viewer) {
                console.error(`SmoothMoveRelatively: ueViewer.viewer is undefined`);
                return undefined;
            }
            const res = await viewer.callUeFunc<SmoothMoveRelativelyType['SmoothMoveRelatively']['result']>({
                f: 'SmoothMoveRelatively',
                p: { id, RelativePosition, Time }
            })
            if (res.error) console.error(`SmoothMoveRelatively:`, res.error);
            return res;
        }

        this.d(sceneObject.smoothMoveRelativelyEvent.don((RelativePosition, Time) => {
            SmoothMoveRelativelyCallFunc(ueViewer, sceneObject.id, RelativePosition, Time)
        }))

        const SmoothMoveRelativelyWithRotationCallFunc = async (ueViewer: ESUeViewer, id: string, RelativePosition: ESJVector3D, NewRotation: ESJVector3D, Time: number) => {
            const { viewer } = ueViewer;
            if (!viewer) {
                console.error(`SmoothMoveRelativelyWithRotation: ueViewer.viewer is undefined`);
                return undefined;
            }
            const res = await viewer.callUeFunc<SmoothMoveRelativelyWithRotationType['SmoothMoveRelativelyWithRotation']['result']>({
                f: 'SmoothMoveRelativelyWithRotation',
                p: { id, RelativePosition, NewRotation, Time }
            })
            if (res.error) console.error(`SmoothMoveRelativelyWithRotation:`, res.error);
            return res;
        }
        this.d(sceneObject.smoothMoveRelativelyWithRotationEvent.don((RelativePosition, NewRotation, Time) => {
            SmoothMoveRelativelyWithRotationCallFunc(ueViewer, sceneObject.id, RelativePosition, NewRotation, Time)
        }))

    }
}
