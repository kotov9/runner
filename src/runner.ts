// ------------------ main logic
export class Executer implements IExecuter {
    private lastExecutionResult: any
    private lastExecutionFunction?: string
    private executionList?: ExecutionList
    private executed?: any = {}


    constructor() {
        // if (!('execute' in Promise.prototype)) {
        //     Promise.prototype.execute = async function(...args: any) {
        //         const res = await this
        //         return res instanceof Executer
        //             ? res.execute.apply(res, args)
        //             : res
        //     }
        // }
    }

    public setExecutionList(list: ExecutionList) {
        this.executionList = list
    }
    
    public getLastExecutionFunction() {
        return this.lastExecutionFunction
    }

    public getLastExecutionResult() {
        return this.lastExecutionResult
    }

    public async execute(funcOrStep: ExecuteFn | keyof ExecutionList, args?: ExecuteFuncArgs) {

        let runFunc
        let runFuncArgs

        if (typeof funcOrStep !== 'function') {
            if (!this.executionList) throw new Error(`No execution list. Can't execute ${funcOrStep}`)
            if (!(funcOrStep in this.executionList)) throw new Error(`${funcOrStep} is absent in execuution list (${this.executionList})`)

            const stepToRun = this.fromList(funcOrStep)

            runFunc = stepToRun.func
            runFuncArgs = typeof args === 'function'
                ? args(this.lastExecutionResult)
                : args

            if (!runFuncArgs) {
                runFuncArgs = typeof stepToRun.args !==  'function' 
                ? stepToRun.args
                : (stepToRun.args as ReturnDataHandler)?.(this.lastExecutionResult)
            } 

        } else {
            runFunc = funcOrStep
            runFuncArgs = typeof args !==  'function' 
                ? args
                : args(this.lastExecutionResult)
        }

        const result =  await promisifyFunctionWithoutCb(runFunc)(...(runFuncArgs || []))
        const name = runFunc.name

        this.lastExecutionResult = result
        this.lastExecutionFunction = name
        
        if (!this.executed[name]) this.executed[name] = []
        this.executed[name].push(result)

        return this
    }

    private fromList(key: keyof ExecutionList): ExecutionItem {
        if (!this.executionList) throw new Error('No execution list set')
        if (this.executionList && !this.executionList[key]) throw new Error(`No "${key}" in execution list "${JSON.stringify(this.executionList)}" set`)
        return this.executionList[key] as unknown as ExecutionItem
    }

    public getExecutionResults() {
        return this.executed
    }

    public async executePipeline(...arrayToExecute: [funcOrStep: ExecuteFn | keyof ExecutionList, args?: ExecuteFuncArgs][] ) {
        for (const [func, args] of arrayToExecute) {
            await this.execute(func, args)
        }
    }
}



function promisifyFunctionWithoutCb(func: any): AsyncFn {
    return (...args: any) => Promise.resolve(func(...args))
}

type AsyncFn = (...args: any[]) => Promise<any>
type UsualFn = (...args: any[]) => any

export type ExecuteFn = AsyncFn | UsualFn
export type ReturnDataHandler = (prevResult?: any) => any
export type ExecuteFuncArgs = any[] | ReturnDataHandler
export type ExecuteContext = any


interface IExecuter {
    execute: (funcOrStep: ExecuteFn | keyof ExecutionList, args?: ExecuteFuncArgs) => Promise<any>,
    executePipeline: (...arrayToExecute: [funcOrStep: ExecuteFn | keyof ExecutionList, args?: ExecuteFuncArgs][]) => Promise<any>
}

type ExecutionList = {
    [key: string]: ExecutionItem
}

type ExecutionItem = {
    func: ExecuteFn,
    args?: ExecuteFuncArgs,
    context?: ExecuteContext
}


export function piplined(func: any): any {
    return (...args: any[]) => func(...args)
}




// interface RunnerPromise<T> {
//     execute: (func: ExecuteFn, args?: ExecuteFuncArgs) => Promise<any>
// }
// const RunnerPromise = Promise.bind(null)
// RunnerPromise.resolve = Promise.resolve
// RunnerPromise.reject = Promise.reject
// //@ts-ignore
// RunnerPromise.prototype.execute = (...args: any) => RunnerPromise.prototype.then((runner: Runner) => runner.execute(args))

// console.log(RunnerPromise.resolve(5).finally(() => console.log("DONE")))



