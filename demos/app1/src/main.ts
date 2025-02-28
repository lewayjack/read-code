import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { ESCesiumViewer } from "earthsdk3-cesium";
import { ESUeViewer } from "earthsdk3-ue";
import MyESObjectsManager from './scripts/MyESObjectsManager';
import { EngineObject, ESViewer } from "earthsdk3";
const objm = new MyESObjectsManager(ESCesiumViewer, ESUeViewer);
console.log('ESViewer', ESViewer.context.registerObjsMap);
console.log('EngineObject', EngineObject.context.registerEngines);
//@ts-ignore
window.g_objm = objm;

createApp(App, { objm }).mount('#app');


const json = {
    "id": "ae103185-08c7-4ed0-b6d4-15ad77bbbf66",
    "type": "ESImageryLayer",
    "url": "https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    "rectangle": [
        -180,
        -90,
        180,
        90
    ],
    "maximumLevel": 18,
    "name": "全球影像",
    "allowPicking": true
}

const imgLayer = objm.createSceneObjectFromJson(json);
//@ts-ignore
window.g_imgLayer = imgLayer;
