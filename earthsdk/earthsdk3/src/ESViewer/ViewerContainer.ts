import { Destroyable, getExtProp, setExtProp } from "xbsj-base";
import { ContainerStyleController } from "./ContainerStyleController";
import { ESViewer } from "./index";

// 为了不对container做任何css样式设置，避免样式设置上的冲突。container完全由外部负责。
function getRelativeContainer(container: HTMLDivElement) {
    //判断容器是否有宽高
    // if (container.clientWidth === 0 || container.clientHeight === 0) {
    //     console.warn(`当前指定容器(${container})宽度或者高度为0;可能会导致视口不可见！`);
    // }

    let relativeContainer = getExtProp<HTMLDivElement | undefined>(container, `_relativeContainer`);
    if (!relativeContainer) {
        relativeContainer = document.createElement('div');
        relativeContainer.style.position = 'relative';
        relativeContainer.style.width = '100%';
        relativeContainer.style.height = '100%';
        relativeContainer.style.padding = '0';
        relativeContainer.style.margin = '0';
        container.appendChild(relativeContainer);
        setExtProp(container, `_relativeContainer`, relativeContainer);
    }

    return relativeContainer as HTMLDivElement;
}


export class ViewerContainer extends Destroyable {
    private _subContainer = document.createElement('div');
    get subContainer() { return this._subContainer; }

    private _overlayContainer = document.createElement('div');
    get overlayContainer() { return this._overlayContainer; }

    private _containerStyleController: ContainerStyleController;
    get containerStyleController() { return this._containerStyleController; }

    get container() { return this._container; }

    constructor(private _container: HTMLDivElement, private _viewer: ESViewer) {
        super();

        this._containerStyleController = this.dv(new ContainerStyleController(this._subContainer, this._overlayContainer, this._viewer));

        const { subContainer, overlayContainer } = this;

        subContainer.tabIndex = -1;
        subContainer.style.outline = 'none';
        subContainer.style.width = '100%';
        subContainer.style.height = '100%';

        // 为了解决cesium不能聚焦的问题，因为cesium的canvas上有一个pinterdown事件调用了preventDefault。
        subContainer.onpointerdown = () => subContainer.focus();

        overlayContainer.style.position = 'relative'; // 让zIndex能够起作用！
        overlayContainer.setAttribute('earthsdk3', 'earthsdk3-overlayContainer');
        subContainer.setAttribute('earthsdk3', 'earthsdk3-subContainer');
        getRelativeContainer(this._container).appendChild(subContainer);
        this.d(() => getRelativeContainer(this._container).removeChild(subContainer));
        getRelativeContainer(this._container).appendChild(overlayContainer);
        this.d(() => getRelativeContainer(this._container).removeChild(overlayContainer));
    }
}
