import { Executer, ArrayToExecute } from './main'


enum Steps {
    CREATE_ORDER = 'CREATE_ORDER',
    UPDATE_ORDER = 'UPDATE_ORDER',
    HIDE_ORDER = 'HIDE_ORDER',
    DELETE_ORDER = 'DELETE_ORDER',
    ADD_OFFER_TO_ORDER = 'ADD_OFFER_TO_ORDER',
    ACCEPT_OFFER = 'ACCEPT_OFFER',
    HIRE_EXPERT = 'HIRE_EXPERT'
}

const examples = () => {
    withExecutionList().then(console.log)
    withExecutionItems().then(console.log)

    async function withExecutionList() {
        console.log('Run withExecutionList')
        const runner = new Executer()
        const context = {request: 'request', page: 'page'}

        runner.setExecutionList({
            [Steps.CREATE_ORDER]: {
                func: createOrder,
                args: [context, { title: 'Custom' }]
            },
            [Steps.UPDATE_ORDER]: {
                func: updateOrder,
                args: [context, { title: 'NEW custom' }]
            },
            [Steps.HIRE_EXPERT]: {
                func: hireExpert,
                args: [context, { expertId: 32535 }]
            }
        })

        await runner.executePipeline(
            [wait],
            [Steps.CREATE_ORDER],
            [Steps.UPDATE_ORDER, ({id}) => ([{id, test: 'ok'}])],
            [Steps.HIRE_EXPERT]
        )

        return runner.getExecutionResults()
    }

    async function withExecutionItems(){

        console.log('Run withExecutionItems')
        const runner = new Executer()

        const pipline: ArrayToExecute = [
            [createOrder, ['request', {title: 'Good essay'}]],
            [updateOrder, (prevResult: any) => ([{id: prevResult.id, test: 'ok'}])],
            [hireExpert, (prevResult: any) => [prevResult]]
        ]
        await runner.executePipeline(...pipline)

        return runner.getExecutionResults()
    }

    function wait() {
        console.log(`Run WAIT\n`)
    }

    function createOrder(context: any, data: any): any {
        console.log(`Run CREATE ORDER with args:`, context, data)
        const result = { data: { id: Math.random() * 100 | 0 } }
        console.log(`Return RESULT of CREATE ORDER:`, result, '\n')
        return result.data
    }

    function updateOrder(args: any): any {
        console.log(`Run UPDATE ORDER with args:`, args)
        const result = { data: { id: Math.random() * 100 | 0 } }
        console.log(`Return RESULT:`, result, '\n')
        return result.data
    }

    function hireExpert(args: any): any {
        console.log(`Run HIRE EXPERT with args:`, args)
        const result = { data: { id: Math.random() * 100 | 0 } }
        console.log(`Return RESULT:`, result, '\n')
        return result.data
    }
}


examples()

