const fs = require("fs")
const path = require("path")
const yaml = require('js-yaml');

// Load yaml file using YAML.load

let template = fs.readFileSync("./template/api.js")

const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let functionStack = {}

function thunk(file) {
    return (content) => {
        fs.appendFileSync(path.resolve(__dirname, './apis/serviceInfo.js'), content, 'utf8')
    }
}

let fsWrite = thunk(path.resolve(__dirname, './apis/serviceInfo.js'))

function writeObj(obj, innerflag) {
    fsWrite("{\n")
    let keys
    for (let i = 0, l = (keys = Object.keys(obj)).length; i < l; i++) {
        let key = keys[i]
        let info = obj[key]
        fsWrite(`${key}:`)
        if (Array.isArray(info)) {
            fsWrite(JSON.stringify(info))
        }
        else if (typeof info === 'object') {
            writeObj(info, true)
        } else {
            fsWrite(`'${info}',\n`)
        }
    }
    innerflag ? fsWrite("},\n") : fsWrite("}\n") //最外面一层object不需要逗号
}

//暂时先读取单个yaml,生成单个service
rl.question('请选输入yaml文件名: ', initPath => {
    fs.mkdirSync(path.resolve(__dirname, "apis"))
    //解析yaml
    try {
        //const doc = yaml.safeLoad(fs.readFileSync(`./${initPath}`, 'utf8'));
        const doc = yaml.safeLoad(fs.readFileSync('intendlaunch.yaml', 'utf8'));
        let paths
        if (paths = doc.paths) {
            Object.keys(paths).forEach(path => {
                let api = paths[path]
                Object.keys(api).forEach(method => {
                    let config = api[method]      //方法的参数等
                    let { description, operationId: methodName, parameters } = config
                    if (parameters) {
                        let psName = []   //参数名称,暂时不做类型校验
                        for (let i = 0, l = 0; i < parameters.length; i++) {
                            let par = parameters[i]
                            let name = parameters[i].name ? parameters[i].name : (l = parameters[i].$ref.split("/"))[l.length - 1]
                            psName.push(name)
                        }
                        functionStack[methodName] = { description, path, params: psName }
                    } else {
                        functionStack[methodName] = { description, path }
                    }
                })
            });
        }
    } catch (e) {
        console.log(e);
    }
    //根据所有方法生成接口info和http请求文件
    setTimeout(() => {
        fsWrite("export default ")
        writeObj(functionStack)
        console.log('写入serviceInfo成功');
    })
    setTimeout(() => {
        fs.writeFileSync(path.resolve(__dirname, './apis/api.js'), template, 'utf8')
        console.log('写入api成功');
        process.exit(0)
    })
});
