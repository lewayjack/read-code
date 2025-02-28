import * as Cesium from 'cesium';
import { fixForCesium1_83 } from "./fixCesium1_83";
import { fixCesium3DTile } from './fixCesium3DTile';
import { fixCameraFlight } from './fixCameraFlight';
import { fixCameraLook } from './fixCameraLook';
import { fixDepthPlane } from './fixDepthPlane';
import { fixGoogleEarth } from './fixGoogleEarth';
import { fixLocalFile } from './fixLocalFile';
import { fixModelInitialRadius } from './fixModelInitialRadius';
import { fixCesiumForGlobelLevel } from './fixCesiumForGlobelLevel';
fixCameraFlight();
fixCameraLook();
fixDepthPlane();
fixForCesium1_83();
fixGoogleEarth();
fixLocalFile();
fixModelInitialRadius();
fixCesiumForGlobelLevel();
fixCesium3DTile();
// 默认相机视口范围
Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(
    70.0,
    5.0,
    140.0,
    55.0
);