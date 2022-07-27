/* Class representing a flexible pipline executor */
export class Executer implements IExecuter {
    private lastExecutionResult: any
    private lastExecutionFunction?: string
    private executionList?: ExecutionList
    private executed?: any = {}

    constructor(executionList?: ExecutionList) {
        if (executionList) this.setExecutionList(executionList)
    }

    /**
     * @method add execution list
     * @param {ExecutionList} list
     */
    public setExecutionList(list: ExecutionList) {
        this.executionList = list
    }

    /**
     * @method return the name of last executed function
     * @returns {string|undefined}
     */
    public getLastExecutionFunction(): string | undefined {
        return this.lastExecutionFunction
    }

    /**
     * @method returns the rusul of last executed function
     * @returns {any}
     */
    public getLastExecutionResult(): any {
        return this.lastExecutionResult
    }

    /**
     * @method returns results of executed functions
     * @returns {{[key: string]: any[]}}
     */
    public getExecutionResults() {
        return this.executed
    }

    /**
     * @method executes the passed function or function from execution list set earlier with given args
     * @param {ExecutionItem} executionItem
     * @param {ExecutionItemArgs} itemArgs
     */
    public async execute(executionItem: ExecutionItem, itemArgs?: ExecutionItemArgs): Promise<any> {

        let fn
        let args

        // get function to execute and args
        if (typeof executionItem !== 'function') {
            // if function and args is in the execution list
            const fnAndArgs = this.getFuncAndArgsFromStepList(executionItem)
            fn = fnAndArgs.fn
            args = fnAndArgs.args
        } else fn = executionItem

        if (itemArgs) {
            args = (
                typeof itemArgs !==  'function'
                ? itemArgs
                : itemArgs(this.lastExecutionResult)
            )
        }

        if (!args) args = []

        // get function name
        const name = fn.name
        // execute function and get the result
        const result =  await promisifyFunctionWithoutCb(fn)(...args)
        // memo execution function result
        this.lastExecutionResult = result
        // memo execution function name
        this.lastExecutionFunction = name
        // memo execution result and save it in global store
        if (!this.executed[name]) this.executed[name] = []
        this.executed[name].push(result)

        return result
    }

    /**
     * @method executes an array of functions with given args
     * @param {ArrayToExecute} arrayToExecute
     */
    public async executePipeline(...arrayToExecute: ArrayToExecute ) {
        for (const [func, args] of arrayToExecute) {
            await this.execute(func, args)
        }
    }

    /**
     * @method reset execution list
     */
    public resetHistory() {
        this.executed = {}
    }

    /**
     * @method get execution item by key from execution list
     * @param {ExecutionListKey} key
     * @private
     * @returns {ExecutionListItem}
     */
    private fromList(key: ExecutionListKey): ExecutionListItem {
        if (!this.executionList) throw new Error('No execution list set')
        if (this.executionList && !this.executionList[key]) throw new Error(`No "${key}" in execution list "${JSON.stringify(this.executionList)}" set`)
        return this.executionList[key] as unknown as ExecutionListItem
    }

    /**
     * @method get execution func and args from execution list
     * @param {ExecutionListKey} executionItem
     * @private
     * @returns {ExecutionObject}
     */
    private getFuncAndArgsFromStepList(executionItem: ExecutionListKey): ExecutionObject {
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
export type ExecutionListKey = keyof ExecutionList
export type ExecutionObject = {fn: ExecuteFn, args?: ExecutionItemArgs}

export type ExecutionItem = ExecuteFn | keyof ExecutionList
export type ExecutionFunction = (executionItem: ExecutionItem, args?: ExecutionItemArgs) => Promise<any>
export type ArrayToExecute = [executionItem: ExecuteFn | keyof ExecutionList, args?: ExecutionItemArgs][]

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



