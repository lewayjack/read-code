import { createApp } from 'vue';
import App from './App.vue';
import './css/index.css';
import { ESUeViewer } from "earthsdk3-ue";
import { ESCesiumViewer } from "earthsdk3-cesium";
import "cesiumWidgets/widgets.css"
import MyESObjectsManager from './scripts/MyESObjectsManager';
import { EngineObject, ESJVector3D, ESViewer } from "earthsdk3";
const objm = new MyESObjectsManager(ESUeViewer, ESCesiumViewer);
console.log('ESViewer', ESViewer.context.registerObjsMap);
console.log('EngineObject', EngineObject.context.registerEngines);
//@ts-ignore
window.g_objm = objm;

createApp(App, { objm }).mount('#app');

// objm.sceneTree.createSceneObjectTreeItemFromJson({
//     "id": "ae103185-08c7-4ed0-b6d4-15ad77bbbf66",
//     "type": "ESImageryLayer",
//     "url": "https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
//     "maximumLevel": 18,
//     "name": "全球影像",
//     "allowPicking": true
// })

// objm.sceneTree.createSceneObjectTreeItemFromJson({
//     "id": "76172a16-bba2-43e2-abb2-b59eae362c75",
//     "type": "ESGltfModel",
//     "name": "大楼模型",
//     "position": [
//         116.3913687585455,
//         39.90490860379547,
//         0.10000000093132258
//     ]
// })
// objm.sceneTree.createSceneObjectTreeItemFromJson({
//     "id": "856aa386-0f2d-4d3c-876b-d82a2faee8e4",
//     "type": "ES3DTileset",
//     "name": "未命名瓦片1",
//     "url": "http://192.168.0.132:9004/tile/model/service/ortwkTiV/tileset.json"
// })
// objm.sceneTree.createSceneObjectTreeItemFromJson({
//     "id": "950b5bef-1710-4a84-b4cd-a518bd87d6e7",
//     "type": "ESCameraView",
//     "position": [116.39136706850576, 39.90539833150487, 50.1],
//     "rotation": [-7, -20, 0],
//     "name": "ESCameraView_d6e7"
// })

// const flyIn = () => {
//     const p = [116.40142227969025, 39.90725279274338, 308.7954314949245] as ESJVector3D;
//     const r = [11.829713364097266, -89.03674631726165, 0] as ESJVector3D;
//     objm.activeViewer?.flyIn(p, r);
// }
// //@ts-ignore
// window.g_flyIn = flyIn;


// setTimeout(() => {
//     flyIn();
// }, 5000)
