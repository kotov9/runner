/* Class representing a flexible pipline executor */
export class Executer implements IExecuter {
    private lastExecutionResult: any
    private lastExecutionFunction?: string
    private executionList?: ExecutionList
    private executed?: any = {}


    constructor(executionList?: ExecutionList) {
        if (executionList) this.setExecutionList(executionList)
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

    public getExecutionResults() {
        return this.executed
    }

    public async execute(executionItem: ExecutionItem, itemArgs?: ExecutionItemArgs) {

        let fn
        let args

        if (typeof executionItem !== 'function') {
            const fnAndArgs = this.getFuncAndArgsFromStepList(executionItem)
            fn = fnAndArgs.fn
            args = fnAndArgs.args
        } else fn = executionItem

        if (!args) {
            args = typeof itemArgs !==  'function'
                ? itemArgs
                : itemArgs(this.lastExecutionResult)
        }

        const result =  await promisifyFunctionWithoutCb(fn)(...(args || []))
        const name = fn.name

        this.lastExecutionResult = result
        this.lastExecutionFunction = name
        
        if (!this.executed[name]) this.executed[name] = []
        this.executed[name].push(result)

        return this
    }

    public async executePipeline(...arrayToExecute: [executionItem: ExecuteFn | keyof ExecutionList, args?: ExecutionItemArgs][] ) {
        for (const [func, args] of arrayToExecute) {
            await this.execute(func, args)
        }
    }

    private fromList(key: keyof ExecutionList): ExecutionListItem {
        if (!this.executionList) throw new Error('No execution list set')
        if (this.executionList && !this.executionList[key]) throw new Error(`No "${key}" in execution list "${JSON.stringify(this.executionList)}" set`)
        return this.executionList[key] as unknown as ExecutionListItem
    }

    private getFuncAndArgsFromStepList(executionItem: keyof ExecutionList): {fn: ExecuteFn, args?: ExecutionItemArgs} {
        if (!this.executionList) throw new Error(`No execution list. Can't execute ${executionItem}`)

        let fn
        let args

        if (!this.executionList) throw new Error(`No execution list. Can't execute ${executionItem}`)
        if (!(executionItem in this.executionList)) throw new Error(`${executionItem} is absent in execuution list (${this.executionList})`)

        const stepToRun = this.fromList(executionItem)

        fn = stepToRun.func

        if (stepToRun.args) {
            args = typeof stepToRun.args !==  'function'
                ? stepToRun.args
                : (stepToRun.args as ReturnDataHandler)?.(this.lastExecutionResult)
        }

        return {fn, args}
    }
}



function promisifyFunctionWithoutCb(func: any): AsyncFn {
    return (...args: any) => Promise.resolve(func(...args))
}

type AsyncFn = (...args: any[]) => Promise<any>
type UsualFn = (...args: any[]) => any

export type ExecuteFn = AsyncFn | UsualFn
export type ReturnDataHandler = (prevResult?: any) => any
export type ExecutionItemArgs = any[] | ReturnDataHandler
export type ExecuteContext = any

export type ExecutionItem = ExecuteFn | keyof ExecutionList
export type ExecutionFunction = (executionItem: ExecutionItem, args?: ExecutionItemArgs) => Promise<any>


interface IExecuter {
    execute: ExecutionFunction
    executePipeline: (...arrayToExecute: [executionItem: ExecuteFn | keyof ExecutionList, args?: ExecutionItemArgs][]) => Promise<any>
}

type ExecutionList = {
    [key: string]: ExecutionListItem
}

type ExecutionListItem = {
    func: ExecuteFn,
    args?: ExecutionItemArgs,
    context?: ExecuteContext
}



