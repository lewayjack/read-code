import * as Cesium from 'cesium';
//@ts-ignore
export function createTextureFromImage(context: Cesium.Context, image: HTMLImageElement) {
    var vtxfTexture;
    // @ts-ignore
    if (Cesium.defined(image.internalFormat)) {
        //@ts-ignore
        vtxfTexture = new Cesium.Texture({
            context: context,
            // @ts-ignore
            pixelFormat: image.internalFormat,
            width: image.width,
            height: image.height,
            // @ts-ignore 这里可能有问题 vtxf 20231115
            source: {
                // @ts-ignore
                arrayBufferView: image.bufferView
            }
        });
    } else {
        //@ts-ignore
        vtxfTexture = new Cesium.Texture({
            context: context,
            // @ts-ignore
            source: image
        });

        // 如果是2的幂次，则自动生成mipmap
        // @ts-ignore
        if (Cesium.Math.isPowerOfTwo(vtxfTexture.width) && Cesium.Math.isPowerOfTwo(vtxfTexture.height)) {
            // @ts-ignore
            vtxfTexture.generateMipmap();
            // @ts-ignore
            vtxfTexture.sampler = new Cesium.Sampler({
                // @ts-ignore
                wrapS: Cesium.TextureWrap.REPEAT,
                // @ts-ignore
                wrapT: Cesium.TextureWrap.REPEAT,
                minificationFilter: Cesium.TextureMinificationFilter.LINEAR_MIPMAP_LINEAR,
                // @ts-ignore
                magnificationFilter: Cesium.TextureMagnificationFilter.LINEAR_MIPMAP_LINEAR,
            });
        } else {
            // 修复自定义图元尺寸非2的幂次会显示为一片黑色的问题 vtxf 20210430
            // 扫描线是一个256*6的图片。sampler原始是CLAMP_TO_EDGE LINEAR，我改成REPEAT LINEAR，就会变成黑色，为啥呢？？
            // vtxfTexture.sampler = new Cesium.Sampler({
            //     wrapS: Cesium.TextureWrap.REPEAT, 
            //     wrapT: Cesium.TextureWrap.REPEAT, 
            //     minificationFilter: Cesium.TextureMinificationFilter.LINEAR, 
            //     magnificationFilter: Cesium.TextureMagnificationFilter.LINEAR,
            // });
        }
    }
    return vtxfTexture;
}