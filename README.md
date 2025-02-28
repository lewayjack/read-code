# 一、pnpm
 1. pnpm install 安装依赖来解决依赖地狱问题;
 2. pnpm run dev-app2 可启动app2项目调试，其他项目同理;

# 二、monorepo
 1. 注意交叉引用关系: earthsdk3可在earthsdk3-cesium和earthsdk3-ue中引用;
 2. 注意交叉引用关系: earthsdk3-cesium和earthsdk3-ue不能相互引用;
 3. 注意交叉引用关系: earthsdk3-cesium和earthsdk3-ue不能在earthsdk3中引用;
 4. 构建项目/上传npm包都需要更新各自版本号，必须更改package.json中的version/main/types;
 5. package.json中 "main": "./src/index.ts"是为了本地调试时不构建直接导出使用,构建后需要手动还原 ！！！
 6. package.json中 "main": "./dist/earthsdk3.js"和"types": "./dist/types/index.d.ts"是为了构建后上传npm;
 7. earthsdk3-assets是静态资源，新增资源必须放到earthsdk3-assets/dist-web下，并更新package.json中的version上传npm;
 8. 静态资源的使用，earthsdk3-assets/assets/glb/xxx 使用环境变量获取路径 ${earthsdk3-assets-script-dir}/assets/glb/xxx;
 9. 使用monorepo来解决各个包之间的依赖关系、版本冲突问题、同步开发问题;

# 三、earthsdk3的使用;
1.安装依赖
```sh
yarn add earthsdk3

yarn add earthsdk3-ue

yarn add earthsdk3-cesium
```

 2.模块使用
```js
import { ESObjectsManager } from 'earthsdk3';

import { ESUeViewer } from 'earthsdk3-ue';

//使用earthsdk3-cesium需要自行在项目中安装和配置cesium，目前支持版本cesium:0.123.1
import { ESCesiumViewer } from 'earthsdk3-cesium';

const objm = new ESObjectsManager (ESUeViewer, ESCesiumViewer);
```

 3.直接使用
```html
<!DOCTYPE html>
<html lang="">
<head>
	...
    <link href="https://cesium.com/downloads/cesiumjs/releases/1.123/Build/Cesium/Widgets/widgets.css" rel="stylesheet">
    <script src="https://cesium.com/downloads/cesiumjs/releases/1.123/Build/Cesium/Cesium.js"></script>
    <script>
        window.cesium = Cesium;
    </script>
    <script src="js/xbsj-base/dist/xbsj-base.js"></script>
    <script src="js/earthsdk3/dist/earthsdk3.js"></script>
    <script src="js/earthsdk3-cesium/dist/earthsdk3-cesium.js"></script>
    <script src="js/earthsdk3-ue/dist/earthsdk3-ue.js"></script>
</head>
	...
    <script defer="defer">
        const { ESObjectsManager } = window['earthsdk3'];
        const { ESCesiumViewer } = window['earthsdk3-cesium'];
        const { ESUeViewer } = window['earthsdk3-ue'];
        const objm = new ESObjectsManager(ESCesiumViewer, ESUeViewer);
    </script>
	...
</html>
```
