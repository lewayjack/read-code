// import Cesium from 'Cesium';
// import XbsjCameraVideo from './xbsjCameraVideo';

// import XbsjCameraVideo from "./xbsjCameraVideo";

// // TODO(vtxf): 整理注释

// Cesium.XbsjCameraVideo = XbsjCameraVideo;

// /**
//  * 用来实现3dtiles数据添加视频融合功能的插件
//  * @exports xbsjCameraVideoMixin
//  *
//  * @param {Scene} scene scene实例.
//  * @param {Object} [options] 参数设置，目前是预留值，没有使用
//  * 
//  * @see XbsjCameraVideo
//  *
//  * @example
//  * var viewer = new Cesium.Viewer('cesiumContainer');
//  * // 加入贴地纹理扩展，注意：视频融合插件的使用必须先加入贴地纹理扩展！
//  * Cesium.xbsjCameraVideoMixin(viewer.scene);
//  * 
//  * // 2.2.2.1 创建视频标签
//  * var videoElement = createVideoElement(videoSrc);
//  *
//  * // 2.2.2.2 准备inverseViewMatrix
//  * // 准备inverseViewMatrix是为了定义视频拍摄的相机的姿态(位置和方向)
//  * // 此处设定为当前相机的欧拉角(heading\pitch\roll)和位置信息
//  * cameraVideoInfo.position = Cesium.Cartesian3.clone(viewer.camera.positionWC);
//  * var inverseViewMatrix = hpr2m({
//  *     position: Cesium.Cartesian3.clone(viewer.camera.positionWC),
//  *     heading: viewer.camera.heading,
//  *     pitch: viewer.camera.pitch,
//  *     roll: viewer.camera.roll,
//  * });
//  *
//  * // 2.2.2.3 准备frustum，
//  * // frustum是为了定义投影体的形状
//  * // frustum选填，可以直接置为undefined
//  * var frustum = new Cesium.PerspectiveFrustum({
//  *     fov: Cesium.Math.toRadians(30.0),
//  *     aspectRatio: 1.333,
//  *     near: 3,
//  *     far: 100,
//  * });
//  *
//  * // 2.2.2.4 根据以上信息创建cameraVideo
//  * var cameraVideo = new Cesium.XbsjCameraVideo({
//  *     inverseViewMatrix: inverseViewMatrix,
//  *     frustum: frustum,
//  *     videoElement: videoElement,
//  *     showHelperPrimitive: true,
//  * });
//  *
//  * // 2.2.2.5 加入到场景中去
//  * viewer.scene.primitives.add(cameraVideo);
//  *
//  * // 2.2.2.6 记录创建的相机的信息，以供销毁时使用
//  * cameraVideoInfo.videoElement = videoElement;
//  * cameraVideoInfo.cameraVideo = cameraVideo;
//  *
//  * // 2.2.2.7 以下信息的记录是为了和UI交互
//  * viewModel.fov = Cesium.Math.toDegrees(cameraVideo.frustum.fov);
//  * viewModel.aspectRatio = cameraVideo.frustum.aspectRatio;
//  * viewModel.near = cameraVideo.frustum.near;
//  * viewModel.far = cameraVideo.frustum.far;
//  * viewModel.heading = Cesium.Math.toDegrees(viewer.camera.heading);
//  * viewModel.pitch = Cesium.Math.toDegrees(viewer.camera.pitch);
//  * viewModel.roll = Cesium.Math.toDegrees(viewer.camera.roll);
//  */
// function xbsjCameraVideoMixin(scene) {
//     if (!Cesium.defined(scene)) {
//         throw new DeveloperError('viewer is required.');
//     }
// }

// Cesium.xbsjCameraVideoMixin = xbsjCameraVideoMixin;

// export default xbsjCameraVideoMixin;

export * from './XbsjCameraVideo';