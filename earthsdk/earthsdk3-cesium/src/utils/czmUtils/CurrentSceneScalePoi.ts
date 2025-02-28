// import { ESCesiumViewer } from "src/ESCesiumViewer";
// import { Destroyable, getReactFuncs, ReactParamsType } from "xbsj-base";

// /**
//  * 用来显示设置屏幕像素以后程序自动计算的缩放值
//  */
// export class CurrentSceneScalePoi extends Destroyable {
//     constructor(
//         czmViewer: ESCesiumViewer,
//         showSceneScaleReact: ReactParamsType<boolean|undefined>, 
//         positionReact: ReactParamsType<[number, number, number] | undefined>,
//         sceneScaleFromPixelSize: ReactParamsType<number|undefined>,
//     ) {
//         super();

//         const [getShow, setShow, showChanged] = getReactFuncs<boolean|undefined>(showSceneScaleReact);
//         const [getPosition, setPosition, positionChanged] = getReactFuncs<[number, number, number]|undefined>(positionReact);
//         const [getSceneScale, setSceneScale, sceneScaleChanged] = getReactFuncs<number|undefined>(sceneScaleFromPixelSize);
        
//         let poi: GeoDivTextPoi | undefined;
//         const destroyIfExists = () => {
//             if (poi) {
//                 czmViewer.delete(poi);
//                 poi.destroy();
//                 poi = undefined;
//             }
//         };
//         const createIfNotExists = () => {
//             if (!poi) {
//                 poi = new GeoDivTextPoi();
//                 czmViewer.add(poi);
//             }
//         };
//         this.dispose(destroyIfExists);

//         const updateSceneScalePoiPos = () => {
//             if (poi) {
//                 poi.position = getPosition();
//             }
//         };
//         updateSceneScalePoiPos();
//         this.dispose(positionChanged.disposableOn(updateSceneScalePoiPos));

//         const updateSceneScalePoiText = () => {
//             if (poi) {
//                 poi.text = `当前缩放值：${getSceneScale()}`;
//             }
//         };
//         updateSceneScalePoiText();
//         this.dispose(sceneScaleChanged.disposableOn(updateSceneScalePoiText));

//         const updateSceneScalePoiCreating = () => {
//             if (getShow() ?? false) {
//                 createIfNotExists();
//                 updateSceneScalePoiPos();
//                 updateSceneScalePoiText();
//             } else {
//                 destroyIfExists();
//             }
//         };
//         updateSceneScalePoiCreating();
//         this.dispose(showChanged.disposableOn(updateSceneScalePoiCreating));
//     }
// }