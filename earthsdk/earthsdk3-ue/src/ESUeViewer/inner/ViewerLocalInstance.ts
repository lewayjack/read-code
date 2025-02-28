
import { ViewerCustomInteraction } from "earthsdk3";
import { createNextAnimateFrameEvent, Destroyable, ObjResettingWithEvent } from "xbsj-base";
import { ESUeViewer } from "../index";
import { UeCloudViewerBase } from "../uemsg/UeCloudViewerBase";
import { getGlobalPropsKey, getGlobalPropsValue } from "./ReactProps";
export class ViewerLocalInstance extends Destroyable {
    constructor(container: HTMLDivElement, ueViewer: ESUeViewer, cloudViewer: UeCloudViewerBase) {
        super();

        {
            //全局属性设置监听，自动更新
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

        {
            //UE更新JS的属性
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

        const masker = document.createElement('div');
        masker.style.width = '100%';
        masker.style.height = '100%';
        masker.style.position = 'absolute';
        masker.style.overflow = 'hidden';
        masker.style.top = '0';
        masker.style.left = '0';
        masker.style.zIndex = '0';
        masker.style.backgroundColor = 'rgba(255,0,0,0)';
        masker.setAttribute('masker', '大屏顶层div,用于模拟鼠标事件和控制UE鼠标事件是否生效');

        container.appendChild(masker);
        this.d(() => { masker && container && container.removeChild(masker); })
        // document.body.insertBefore(masker, document.body.firstChild);

        // {//测试
        //     const box = document.createElement('div');
        //     box.style.width = '300px';
        //     box.style.height = '300px';
        //     box.style.position = 'absolute';
        //     box.style.overflow = 'hidden';
        //     box.style.top = '100px';
        //     box.style.left = '100px';
        //     box.style.zIndex = '1';
        //     box.style.backgroundColor = 'rgba(0,255,0,1)';
        //     document.body.appendChild(box);
        //     //测试中文输入
        //     box.innerHTML = `<input type="text" value="是的哈是的" />`
        // }

        //遮罩层鼠标事件控制ue鼠标事件是否生效
        {
            const eventFunc = (event: MouseEvent, flag: boolean) => {
                //@ts-ignore
                window.ue.esinput.setinterceptevent(flag);
                event.preventDefault();
            }

            const mouseenterFunc = (event: MouseEvent) => { eventFunc(event, false) };
            const mouseleaveFunc = (event: MouseEvent) => { eventFunc(event, true) };
            const mousemoveFunc = (event: MouseEvent) => { eventFunc(event, false) };

            //鼠标进入监听
            masker.addEventListener('mouseenter', mouseenterFunc);
            //鼠标离开监听
            masker.addEventListener('mouseleave', mouseleaveFunc);
            // 鼠标移动监听
            masker.addEventListener('mousemove', mousemoveFunc);
            this.d(() => {
                masker.removeEventListener('mouseenter', mouseenterFunc);
                masker.removeEventListener('mouseleave', mouseleaveFunc);
                masker.removeEventListener('mousemove', mousemoveFunc);
            })
        }

        //重写div事件监听 click,dblclick,mousemove,mouseout,mouseover,mousedown,mouseup
        {
            //禁用ESViewer上的ViewerCustomInteraction的默认事件
            ueViewer.useCustomInteraction = false;
            //收集masker上的鼠标事件
            this.dv(new ViewerCustomInteraction(ueViewer, masker));
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
