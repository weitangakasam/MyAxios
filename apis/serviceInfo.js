export default {
    createLogicType: {
        description: '创建逻辑类型',
        path: '/logicType/createLogicType',
        params: ["intendLogicType"]
    },
    modifyLogicType: {
        description: '修改逻辑类型',
        path: '/logicType/modifyLogicType',
        params: ["intendLogicType"]
    },
    deleteLogicType: {
        description: '删除逻辑类型',
        path: '/logicType/deleteLogicType',
        params: ["intendLogicTypeList"]
    },
    queryLogicType: {
        description: '查询逻辑类型',
        path: '/logicType/queryLogicType',
    },
    queryLogicFrame: {
        description: '查询逻辑机架',
        path: '/logicFrame/queryLogicFrame',
    },
    createLogicFrame: {
        description: '创建逻辑机架',
        path: '/logicFrame/createLogicFrame',
        params: ["intendLogicFrame"]
    },
    modifyLogicFrame: {
        description: '修改逻辑机架',
        path: '/logicFrame/modifyLogicFrame',
        params: ["intendLogicFrame"]
    },
    deleteLogicFrame: {
        description: '删除逻辑机架',
        path: '/logicFrame/deleteLogicFrame',
        params: ["intendLogicFrameList"]
    },
    createPodTemplate: {
        description: '创建POD模板',
        path: '/podTemplate/createPodTemplate',
        params: ["PodTemplate"]
    },
    modifyPodTemplate: {
        description: '修改POD模板',
        path: '/podTemplate/modifyPodTemplate',
        params: ["PodTemplate"]
    },
    deletePodTemplates: {
        description: '删除POD模板',
        path: '/podTemplate/deletePodTemplates',
        params: ["PodTemplateList"]
    },
    queryPodTemplates: {
        description: '查询POD模板',
        path: '/podTemplate/queryPodTemplateAll',
    },
    queryPodTemplateById: {
        description: '查询POD模板',
        path: '/podTemplate/queryPodTemplateById',
        params: ["podTemplateId"]
    },
    createPodLogicDeviceGroup: {
        description: '创建POD模板逻辑类型定义',
        path: '/podGroup/createPodLogicDeviceGroup',
        params: ["podLogicDeviceGroup"]
    },
    modifyPodLogicDeviceGroup: {
        description: '修改POD模板逻辑类型定义',
        path: '/podGroup/modifyPodLogicDeviceGroup',
        params: ["podLogicDeviceGroup"]
    },
    deletePodLogicDeviceGroups: {
        description: '删除POD模板逻辑类型定义',
        path: '/podGroup/deletePodLogicDeviceGroups',
        params: ["podLogicDeviceGroupList"]
    },
    queryPodLogicDeviceGroupList: {
        description: '查询POD模板逻辑类型定义',
        path: '/podGroup/queryPodLogicDeviceGroupList',
        params: ["groupId", "podTemplateId"]
    },
    createPodLogicDeviceList: {
        description: '创建POD模板逻辑类型',
        path: '/podLogicDevice/createPodLogicDeviceList',
        params: ["podLogicDevice"]
    },
    deletePodLogicDevices: {
        description: '删除POD模板逻辑类型',
        path: '/podLogicDevice/deletePodLogicDevices',
        params: ["podLogicDeviceList"]
    },
    queryPodLogicDeviceList: {
        description: '查询POD模板逻辑类型',
        path: '/podLogicDevice/queryPodLogicDeviceList',
        params: ["logicDeviceId", "groupId", "podTemplateId"]
    },
}
