import axios from "axios"

/**
 * @author:waynetang666
 */

let proto
function hasProxy() {
    return window.Proxy
}

let userReqStack = [] //users interceptors stack
let userResStack = []

//case brorser support Proxy
function getProxy(proto, target) {
    target = Object.create(proto)
    return new Proxy(target, {
        //add interceptors shortcut to the user
        get(obj, key) {
            if (key === 'reqInter') {
                return (...args) => {
                    console.log(args)
                    //id can be  distinguished by the req ans res , used by interceptors
                    let id = "req" + target.interceptors.request.use.call(target.interceptors.request,
                        ...args
                    )
                    userReqStack.push(id)
                    return id
                }
            }
            if (key === 'resInter') {
                return (...args) => {
                    let id = "res" + target.interceptors.response.use.call(target.interceptors.response,
                        ...args
                    )
                    userResStack.push(id)
                    return id
                }
            }
            if (typeof target[key] === 'function') {
                return target[key].bind(target)       //bind the function to context
            }
            return target[key]
        },
        set(target, key, newVal) {
            if(key === 'plxInfoService'){

            }else{
                console.warn("got no right to rewrite propery")
                return
            }
        }
    })
}

//case older brorser
function observe() {

}

function isDef(value) {
    return typeof value != 'undefined' && Object.prototype.toString.call(value) != "[object Null]"
}

//get real Num in value
function getNum(value) {
    //req0 => 0
    /(\d)/.test(value)
    return parseInt(RegExp.$1)
}

let xssId, cypherId, plxErrorId;
let ejectsMethod = {
    xss() {
        if (isDef(xssId)) {
            proto.interceptors.request.eject(getNum(xssId))
            xssId = null
        }
    },
    cypher() {
        if (isDef(cypherId)) {
            proto.interceptors.request.eject(getNum(cypherId))
            cypherId = null
        }
    },
    plxError() {
        if (isDef(plxErrorId)) {
            //这个是reponse
            proto.interceptors.response.eject(getNum(plxErrorId))
            plxErrorId = null
        }
    }
}
function costumeReq(id) {
    let index = userReqStack.indexOf(id)
    if (index > -1) {
        proto.interceptors.request.eject(getNum(id))
        userReqStack.splice(index, 1)
    }
}
function costumeRes(id) {
    let index = userResStack.indexOf(id)
    if (index > -1) {
        proto.interceptors.response.eject(getNum(id))
        userResStack.splice(index, 1)
    }
}

//取消拦截器方法eject
function eject(ejects) {  //params can be lik e ['xss','cypher','plxError' and costum interceptors id]
    if (!isDef(ejects)) {
        console.warn("got no ejectes")
        return
    }
    if (Object.prototype.toString.call(ejects) != '[object Array]') {
        //consider the case 'xss' string
        ejects = [ejects]
    }
    for (let i = 0, l = ejects.length; i < l; i++) {
        let nameId = ejects[i]
        let method = ejectsMethod[nameId]
        if (method) {
            //the 3 inner intercetptors
            method()
            continue
        }
        //user intercetptors ids
        if (nameId.indexOf("req") > -1) {
            costumeReq(nameId)
        }
        if (nameId.indexOf("res") > -1) {
            costumeRes(nameId)
        }
    }
}

let defaultOptions = { xss: true, cypher: true, plxError: true }

function merge(...args) {

}
function getInstance(config, options = {}) {
    //options = config = merge(defaultOptions, options)  //如果不merge的话,如果用户传个{}进来,那么就里面默认值就被冲掉了

    proto = axios.create(config)
    let instance = {}
    if (hasProxy()) {
        instance = getProxy(proto, instance)
    } else {
        instance = observe(proto, instance)
    }
    //add xss check && passworkd cypher
    let { xss, cypher, plxError } = options
    if (xss) {
        xssId = instance.reqInter((config) => {
            config.data.xss = true
            return config
        })
    }
    if (cypher) {
        cypherId = instance.reqInter((config) => {
            config.data.cypher = true
            return config
        })
    }
    //统一的弹plx模态框处理
    if (plxError) {
        plxErrorId = instance.resInter(
            (data) => { return data },
            (error) => {
                //instance.plxInfoService.showError()
                return Promise.reject(error)   //pass the eror
            })
    }
    return instance
}

export { eject, getInstance }
