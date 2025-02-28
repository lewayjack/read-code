
import { ESHuman, ESJVector3D } from "earthsdk3";
import { ESUeViewer } from '../../../ESUeViewer';
import { UeESObjectWithLocation } from '../../../UeObjects/base';
export class UeESHuman extends UeESObjectWithLocation<ESHuman> {
    static readonly type = this.register('ESUeViewer', ESHuman.type, this);
    constructor(sceneObject: ESHuman, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        type AIMoveToType = {
            AIMoveTo: {
                params: {
                    id: string,
                    Destination: ESJVector3D,
                    Time: number
                },
                result: {
                    error: string | undefined;
                }
            }
        }

        const aiMoveToCallFunc = async (ueViewer: ESUeViewer, id: string, Destination: ESJVector3D, Time: number) => {
            const { viewer } = ueViewer;
            if (!viewer) {
                console.error(`AIMoveTo: ueViewer.viewer is undefined`);
                return undefined;
            }
            const res = await viewer.callUeFunc<AIMoveToType['AIMoveTo']['result']>({
                f: 'AIMoveTo',
                p: { id, Destination, Time }
            })
            if (res.error) console.error(`AIMoveTo:`, res.error);
            return res;
        }

        this.d(sceneObject.aiMoveToEvent.don((Destination, Time) => {
            aiMoveToCallFunc(ueViewer, sceneObject.id, Destination, Time)
        }))

        type StopAIMoveType = {
            StopAIMove: {
                params: {
                    id: string,
                },
                result: {
                    error: string | undefined;
                }
            }
        }
        const StopAIMoveCallFunc = async (ueViewer: ESUeViewer, id: string) => {
            const { viewer } = ueViewer;
            if (!viewer) {
                console.error(`StopAIMove: ueViewer.viewer is undefined`);
                return undefined;
            }
            const res = await viewer.callUeFunc<StopAIMoveType['StopAIMove']['result']>({
                f: 'StopAIMove',
                p: { id }
            })
            if (res.error) console.error(`StopAIMove:`, res.error);
            return res;
        }

        this.d(sceneObject.stopAIMoveEvent.don(() => {
            StopAIMoveCallFunc(ueViewer, sceneObject.id)
        }))

    }
}
