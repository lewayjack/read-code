import { Destroyable } from "xbsj-base";
import { ESViewer } from "./index";

export class ContainerStyleController extends Destroyable {
    constructor(
        private _subContainer: HTMLDivElement,
        private _overlayContainer: HTMLDivElement,
        private _viewer: ESViewer
    ) {
        super();
        const subContainer = this._subContainer;
        const overlayContainer = this._overlayContainer;
        const viewer = this._viewer;

        const updateZIndex = () => {
            const zIndex = viewer.zIndex ?? '';
            subContainer.style.zIndex = zIndex;
            overlayContainer.style.zIndex = zIndex;
        };
        updateZIndex();
        this.d(viewer.zIndexChanged.don(updateZIndex));

        const updateShow = () => {
            subContainer.style.display = (viewer.show ?? true) ? 'block' : 'none';
        };
        updateShow();
        this.d(viewer.showChanged.don(updateShow));

        const updateOpacity = () => {
            subContainer.style.opacity = `${viewer.opacity ?? 1.0}`;
        };
        updateOpacity();
        this.d(viewer.opacityChanged.don(updateOpacity));
    }
}
