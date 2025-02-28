
import { createGuid, createNextAnimateFrameEvent, Destroyable, ObjResettingWithEvent } from "xbsj-base";
import { ESUeViewer } from "../index";
import { UeCloudViewerBase } from "../uemsg/UeCloudViewerBase";
import { UeEventsType } from "../uemsg/UeEventsType";
import { getGlobalPropsKey, getGlobalPropsValue } from "./ReactProps";
import { ESJVector2D } from "earthsdk3";
export class ViewerInstance extends Destroyable {
    constructor(ueViewer: ESUeViewer, cloudViewer: UeCloudViewerBase) {
        super();
        //全局属性设置监听，自动更新
        {

            const update = () => {
                const params = getGlobalPropsValue(ueViewer);
                ueViewer.setGlobalProperty(params)
            }
            update();
            const reactPropsKeys = getGlobalPropsKey()
            const createNextAnimateFrameList: any[] = []
            reactPropsKeys.forEach(key => {
                //@ts-ignore
                const event = ueViewer[key + 'Changed']
                createNextAnimateFrameList.push(event)
            })
            const updateEvent = this.dv(createNextAnimateFrameEvent(...createNextAnimateFrameList));
            this.d(updateEvent.don(update));
        }

        //UE更新JS的属性
        {

            this.d(ueViewer.propChanged.don(params => {
                if (params.objId !== "") return;
                try {
                    Object.keys(params.props).forEach(key => {
                        const prop = (params.props[key] === null) ? undefined : params.props[key]
                        //@ts-ignore
                        ueViewer[key] = prop
                    });
                } catch (error) {
                    console.error('ueViewer propChanged:' + error)
                }
            }));
        }

        //自定义事件监听 statusUpdateEvent,propChangedEvent,objectEvent,widgetEvent,speechRecognition,customMessage
        {
            // statusUpdateInterval为0时，ue就不返回事件,移除监听
            this.dv(new ObjResettingWithEvent(ueViewer.statusUpdateIntervalChanged, ((newVal) => {
                const statusUpdateInterval = ueViewer.statusUpdateInterval ?? 0.5;
                if (statusUpdateInterval === 0) return undefined;
                const disposer = new Destroyable();
                disposer.d(cloudViewer.disposableOnUeEvent('statusUpdate', (statusUpdate) => {
                    ueViewer.statusUpdateEvent.emit(statusUpdate);
                }))
                return disposer;
            })));


            this.dv(new ObjResettingWithEvent(ueViewer.propChangedListeningChanged, () => {
                const propChangedListening = ueViewer.propChangedListening ?? true;
                if (!propChangedListening) return undefined;

                const disposer = new Destroyable();
                disposer.d(cloudViewer.disposableOnUeEvent('propChanged', (changedEvent) => {
                    ueViewer.propChanged.emit(changedEvent);
                }));
                return disposer;
            }));

            this.dv(new ObjResettingWithEvent(ueViewer.objectEventListeningChanged, () => {
                const objectEventListening = ueViewer.objectEventListening ?? true;
                if (!objectEventListening) return undefined;
                const disposer = new Destroyable();
                disposer.d(cloudViewer.disposableOnUeEvent('objectEvent', (changedEvent) => {
                    ueViewer.objectEvent.emit(changedEvent);
                }));
                return disposer;
            }));

            this.dv(new ObjResettingWithEvent(ueViewer.widgetEventListeningChanged, () => {
                const widgetEventListening = ueViewer.widgetEventListening ?? true;
                if (!widgetEventListening) return undefined;
                const disposer = new Destroyable();
                disposer.d(cloudViewer.disposableOnUeEvent('widgetEvent', (widgetEvent) => {
                    ueViewer.widgetEvent.emit(widgetEvent);
                }));
                return disposer;
            }));

            this.dv(new ObjResettingWithEvent(ueViewer.speechRecognitionListeningChanged, () => {
                const speechRecognitionListening = ueViewer.speechRecognitionListening ?? true;
                if (!speechRecognitionListening) return undefined;

                const disposer = new Destroyable();
                disposer.d(cloudViewer.disposableOnUeEvent('speechRecognition', (info) => {
                    ueViewer.speechRecognition.emit(info);
                }));
                return disposer;
            }));

            this.dv(new ObjResettingWithEvent(ueViewer.customMessageListeningChanged, () => {
                const customMessageListening = ueViewer.customMessageListening ?? true;
                if (!customMessageListening) return undefined;
                const disposer = new Destroyable();
                disposer.d(cloudViewer.disposableOnUeEvent('customMessage', (info) => {
                    ueViewer.customMessage.emit(info);
                }));
                return disposer;
            }));

        }
    }
}
