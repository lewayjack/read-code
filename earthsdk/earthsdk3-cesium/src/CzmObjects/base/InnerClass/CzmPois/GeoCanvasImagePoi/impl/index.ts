import { createNextAnimateFrameEvent, createProcessingFromAsyncFunc, Destroyable, fetchImage, Event, bind } from 'xbsj-base';
import { CanvasImagePoi } from './CanvasImagePoi';
import { GeoCanvasImagePoi } from '..';
import { ESSceneObject } from "earthsdk3";

export class GeoCanvasImagePoiImpl extends Destroyable {
    constructor(sceneObject: GeoCanvasImagePoi, canvasImagePoi: CanvasImagePoi) {
        super();

        const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
            sceneObject.showChanged,
            sceneObject.positionChanged,
            sceneObject.fgColorChanged,
            sceneObject.bgColorChanged,
            sceneObject.tooltipChanged,
            sceneObject.tooltipShowChanged,
            sceneObject.titleChanged,
            sceneObject.sizeChanged,
            sceneObject.originRatioAndOffsetChanged,
            sceneObject.hoveredChanged,
            sceneObject.opacityChanged,
            sceneObject.scaleChanged
        ));
        const updatePrimitive = () => {
            canvasImagePoi.fgColor = sceneObject.fgColor ?? [1, 1, 1, 1];
            canvasImagePoi.bgColor = sceneObject.bgColor ?? [.3, .3, .3, .8];
            canvasImagePoi.tooltip = sceneObject.tooltip ?? '';
            canvasImagePoi.tooltipShow = sceneObject.tooltipShow ?? true;
            canvasImagePoi.title = sceneObject.title ?? '';
            canvasImagePoi.size = sceneObject.size ?? [32, 32];
            canvasImagePoi.originRatioAndOffset = sceneObject.originRatioAndOffset ?? [.5, 1, 0, 0];
            canvasImagePoi.hovered = sceneObject.hovered ?? false;
            canvasImagePoi.opacity = sceneObject.opacity ?? 1;
            //@ts-ignore
            canvasImagePoi._scale = sceneObject.scale ?? 1;
        }
        updatePrimitive();
        this.dispose(updateEvent.disposableOn(updatePrimitive));

        const imageUriReact = this.disposeVar(ESSceneObject.context.createEnvStrReact([sceneObject, 'imageUri'], '${earthsdk3-assets-script-dir}/assets/img/location.png'));

        const imageProcessing = this.disposeVar(createProcessingFromAsyncFunc<void, [imageUri: string]>(async (cancelsManager, imageUri) => {
            const image = await cancelsManager.promise(fetchImage(imageUri));
            canvasImagePoi.image = image;
        }));
        const updateImage = () => {
            if (!imageUriReact.value) {
                return;
            }

            const imageUri = imageUriReact.value.trim();
            if (imageUri === '') {
                return;
            }
            imageProcessing.restart(undefined, imageUri);
        }
        updateImage();
        this.dispose(imageUriReact.changed.disposableOn(updateImage));

        // this.dispose(canvasImagePoi.clickEvent.disposableOn((left, top, tag, self, pointerEvent) => {
        //     (sceneObject.enabled ?? true) && sceneObject.clickEvent.emit(pointerEvent);
        // }));
        const clickEvent = this.disposeVar(new Event<[PointerEvent]>());
        this.dispose(canvasImagePoi.clickEvent.disposableOn((left, top, tag, self, pointerEvent) => {
            (sceneObject.enabled ?? true) && clickEvent.emit(pointerEvent);
        }));
        this.dispose(clickEvent.don(event => {
            sceneObject.clickEvent.emit(event);
        }));

        this.dispose(canvasImagePoi.clickOutEvent.disposableOn((left, top, tag, self, pointerEvent) => {
            (sceneObject.enabled ?? true) && sceneObject.clickOutEvent.emit(pointerEvent);
        }));

        this.dispose(canvasImagePoi.dbclickEvent.disposableOn((left, top, tag, self, pointerEvent) => {
            (sceneObject.enabled ?? true) && sceneObject.dbclickEvent.emit(pointerEvent);
        }));

        this.dispose(canvasImagePoi.dbclickOutEvent.disposableOn((left, top, tag, self, pointerEvent) => {
            (sceneObject.enabled ?? true) && sceneObject.dbclickOutEvent.emit(pointerEvent);
        }));

        this.dispose(bind([sceneObject, 'hovered'], [canvasImagePoi, 'hovered']));
    }
}
