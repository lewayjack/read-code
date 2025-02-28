
export const getTipInfo = (num: number) => {
    switch (num) {
        case 0:
            return '成功绑定'
        case 1:
            return '解绑之前的内容,成功绑定'
        case 2:
            return '未搜索到ActorTag,无法绑定'
        case 3:
            return '搜索到ActorTag但对应的Actor不是场景原有的,而是新建的,无法绑定'
        case 4:
            return '搜索到ActorTag对应的Actor是地形或3DTileset,无法绑定'
        default:
            return '未知错误'
    }
}
export const getCreatedInfo = (num: number) => {
    switch (num) {
        case 0:
            return '创建成功'
        case 1:
            return '未找到对应的资源，无法创建'
        case 2:
            return 'Id与场景中现有的ActorTag重复,创建后可能出现问题,创建失败'
        default:
            return '未知错误'
    }
}
