import axios from "axios";

/**
 * @author:waynetang666
 */

let proto;
function hasProxy() {
  return window.Proxy;
}

//case brorser support Proxy
function getProxy(proto) {
  let target = Object.create(proto);
  return new Proxy(target, {
    //add interceptors shortcut to the user
    get(obj, key) {
      if (key === "reqInter") {
        return (...args) => {
          console.log(args);
          //id can be  distinguished by the req ans res , used by interceptors
          let id =
            "req" +
            target.interceptors.request.use.call(
              target.interceptors.request,
              ...args
            );
          // userReqStack.push(id)
          return id;
        };
      }
      if (key === "resInter") {
        return (...args) => {
          let id =
            "res" +
            target.interceptors.response.use.call(
              target.interceptors.response,
              ...args
            );
          // userResStack.push(id)
          return id;
        };
      }
      if (key === "eject") {
        return eject;
      }
      if (typeof target[key] === "function") {
        return target[key].bind(target); //bind the function to context
      }
      return target[key] || axios[key]; //为了拿到CancelToken
    },
    set(target, key, newVal) {
      if (key === "plxInfoService") {
      } else {
        console.warn("got no right to rewrite propery");
        return;
      }
    }
  });
}

//case older brorser
function observe() {}

function isDef(value) {
  return (
    typeof value != "undefined" &&
    Object.prototype.toString.call(value) != "[object Null]"
  );
}

//get real Num in value
function getNum(value) {
  //req0 => 0
  /(\d)/.test(value);
  return parseInt(RegExp.$1);
}

let xssId, cypherId, plxErrorId;
let ejectsMethod = {
  xss() {
    if (isDef(xssId)) {
      proto.interceptors.request.eject(getNum(xssId));
      xssId = null;
    }
  },
  cypher() {
    if (isDef(cypherId)) {
      proto.interceptors.request.eject(getNum(cypherId));
      cypherId = null;
    }
  },
  plxError() {
    if (isDef(plxErrorId)) {
      //这个是reponse
      proto.interceptors.response.eject(getNum(plxErrorId));
      plxErrorId = null;
    }
  }
};
function costumeReq(id) {
  proto.interceptors.request.eject(getNum(id));
}
function costumeRes(id) {
  proto.interceptors.response.eject(getNum(id));
}

//取消拦截器方法eject
function eject(ejects) {
  //params can be lik e ['xss','cypher','plxError' and costum interceptors id]
  if (!isDef(ejects)) {
    console.warn("got no ejectes");
    return;
  }
  if (Object.prototype.toString.call(ejects) != "[object Array]") {
    //consider the case 'xss' string
    ejects = [ejects];
  }
  for (let i = 0, l = ejects.length; i < l; i++) {
    let nameId = ejects[i];
    let method = ejectsMethod[nameId];
    if (method) {
      //the 3 inner intercetptors
      method();
    }
    //user intercetptors ids
    else if (nameId.indexOf("req") > -1) {
      costumeReq(nameId);
    } else if (nameId.indexOf("res") > -1) {
      costumeRes(nameId);
    }
  }
}

let defaultOptions = {
  xss: true,
  cypher: true,
  plxError: true,
  checkDup: true
};

function hash(obj) {
  return JSON.stringify(obj);
}

function isPlainObject(value) {
  return (
    typeof value != "undefined" &&
    Object.prototype.toString.call(value) === "[object Object]"
  );
}

function merge(...args) {
  let res = {};
  args.forEach(arg => {
    if (typeof arg !== "object") {
      return;
    } else {
      for (let key in arg) {
        if (isPlainObject(res[key]) && isPlainObject(arg[key])) {
          res[key] = merge(merge[key], arg[key]);
        } else if (isPlainObject(arg[key])) {
          res[key] = arg[key];
        } else {
          res[key] = arg[key];
        }
      }
    }
  });
  return res;
}

function mergeConfig(config1, config2) {
  return merge(config1, config2);
}
function getInstance(config, options = {}) {
  options = mergeConfig(defaultOptions, options); //如果不merge的话,如果用户传个{}进来,那么就里面默认值就被冲掉了

  proto = axios.create(config);
  let instance;
  if (hasProxy()) {
    instance = getProxy(proto);
  } else {
    instance = observe(proto);
  }
  //add xss check && passworkd cypher
  let { xss, cypher, plxError, checkDup } = options;
  if (xss) {
    xssId = instance.reqInter(config => {
      if (config.data) {
        config.data.xss = true;
      }
      return config;
    });
  }
  if (cypher) {
    cypherId = instance.reqInter(config => {
      if (config.data) {
        config.data.cypher = true;
      }
      return config;
    });
  }
  //统一的延迟处理,同样的请求只发送一次
  if (true) {
    let reqMap = new Map();
    let flag = false;
    const REASON = "duplicate request:";
    plxErrorId = instance.reqInter(config => {
      return new Promise(resolve => {
        let key = hash(config);
        config.myKey = key; //这里面必须要给个myKey把config存起来,因为不这样做的话,
        //后面会有拦截器给config加东西,当resInter的时候就对不上了
        if (!reqMap.has(key)) {
          //把结果记录下来
          reqMap.set(key, {
            resolves: [{ resolve, config }]
          });
        } else {
          let memo = reqMap.get(key);
          memo.resolves.push({ resolve, config });
          //如果重复了,那么就要把请求cancel了
          let cancel;
          config.cancelToken = new axios.CancelToken(c => {
            cancel = c; //c是取消的方法
          });
          cancel(REASON + key); //直接取消并给个reason
        }
        if (!flag) {
          flag = true;
          setTimeout(() => {
            for (let obj of reqMap) {
              //拦截器继续往后跑
              let [key, memo] = obj;
              memo.resolves.forEach(({ resolve, config }) => {
                resolve(config);
              });
            }
            reqMap = new Map();
            flag = false;
          }, 10);
        }
      });
    });
    var map = new Map();
    instance.resInter(
      resp => {
        let key = resp.config.myKey;
        let memo = map.get(key) || {};
        memo.result = resp;
        if (memo.resolves && memo.resolves.length > 0) {
          memo.resolves.forEach(resolve => {
            resolve(resp);
          });
          map.delete(key);
        }
        return resp;
      },
      error => {
        var message;
        if (
          (message = error.message) &&
          message.indexOf("duplicate request") > -1
        ) {
          return new Promise(resolve => {
            //这里必须要返回一个promise来做延时,为了确保得到结果
            let key = message.replace(REASON, "");
            let memo = map.get(key) || { resolves: [] };
            let result = memo.result;
            if (!result) {
              //结果还没来
              memo.resolves.push(resolve);
              map.set(key, memo);
            } else {
              //结果来了
              resolve(results);
            }
          });
        } else {
          return new Promise((resolve, reject) => {
            reject(error);
          });
        }
      }
    );
  }
  let refreshToken = true;
  let refreshing = false;
  let refreshArray = [];
  if (refreshToken) {
    instance.reqInter(config => {
      let token;
      if ((token = sessionStorage.getItem("token"))) {
        config.headers["Authorization"] = token;
      }
      return config;
    });
    //总体思路就是设置响应拦截器,如果已经有一个接口去refreshToken了,那么就不需要每个接口都去请求了,然后得到新token,再统一
    //返回新的接口的结果
    instance.resInter(
      resp => {
        return new Promise(resolve => {
          if (resp.status === 200) {
            if (resp.data.code === "40009") {
              //token过期的状态码
              refreshArray.push(() => {
                let { config } = resp;
                let res = proto(config); //这里要注意,不能写成instance[method](config),这样写调用了get
                console.log(res); //但是传入的参数不对.get(url,params)
                resolve(res);
              });
              if (!refreshing) {
                refreshing = true;
                instance
                  .post("/refreshToken", {
                    oldToken: sessionStorage.getItem("token"),
                    userName: sessionStorage.getItem("userId"),
                    sessionId: sessionStorage.getItem("sessionId")
                  })
                  .then(resp => {
                    //这个刷新接口具体带什么参数,需要和后台讨论
                    let newToken = resp.data.token;
                    sessionStorage.setItem("token", newToken);
                    refreshArray.forEach(cb => {
                      cb();
                    });
                  })
                  .catch(error => {
                    //router.replace({path:"/login"})    这里应该是要拿到vue的router才行.
                  })
                  .finally(() => {
                    refreshing = false;
                  });
              }
            } else {
              resolve(resp);
            }
          }
        });
      },
      err => {}
    );
  }
  //统一的弹plx模态框处理
  if (plxError) {
    plxErrorId = instance.resInter(
      data => {
        return data;
      },
      error => {
        //instance.plxInfoService.showError()
        return Promise.reject(error); //pass the eror
      }
    );
  }
  return instance;
}

export { getInstance };
