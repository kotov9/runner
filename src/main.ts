import { Executer, ExecuteContext, ExecuteFn, ExecuteFuncArgs, piplined } from './runner'

enum Steps {
    CREATE_ORDER = 'CREATE_ORDER',
    UPDATE_ORDER = 'UPDATE_ORDER',
    HIDE_ORDER = 'HIDE_ORDER',
    DELETE_ORDER = 'DELETE_ORDER',
    ADD_OFFERS_FOR_ORDER = 'ADD_OFFERS_FOR_ORDER',
    ADD_OFFER_TO_ORDER = 'ADD_OFFER_TO_ORDER',
    ACCEPT_OFFER = 'ACCEPT_OFFER',
    HIRE_EXPERT = 'HIRE_EXPERT'
}

export function generateList(context: any): StepsExecution {
    return {
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
    }
}

type StepsExecution = {
    [key in Steps]?: {
        func: ExecuteFn,
        args?: ExecuteFuncArgs,
        context?: ExecuteContext
    }
}

// -------------- EXAMPLE --------------------------------
function wait() {
    console.log(`Run WAIT`)
    console.log('\n')
}

function createOrder(context: any, data: any): any {
    console.log(`Run CREATE ORDER with args:`, context, data)
    console.log(context)
    const result = { data: { id: Math.random() * 100 | 0 } }
    console.log(`Return RESULT of CREATE ORDER:`, result)
    console.log('\n')

    return result.data
}

const createOrderPiplined = piplined(createOrder)

function updateOrder(args: any): any {
    console.log(`Run UPDATE ORDER with args:`, args)
    const result = { data: { id: Math.random() * 100 | 0 } }
    console.log(`Return RESULT:`, result)
    console.log('\n')

    return result.data
}

function hireExpert(args: any): any {
    console.log(`Run HIRE EXPERT with args:`, args)
    const result = { data: { id: Math.random() * 100 | 0 } }
    console.log(`Return RESULT:`, result)
    console.log('\n')

    return result.data
}


const testRunner = async function(){

    const runner = new Executer()
    runner.setExecutionList(generateList({request: 'request', page: 'page'}))

    await runner.executePipeline(
        [wait],
        [Steps.CREATE_ORDER],
        [Steps.UPDATE_ORDER, ({id}) => ([{id, test: 'ok'}])],
        [Steps.HIRE_EXPERT]
    )

    console.log('------------------------------')

    await runner.executePipeline(
        [createOrder, ['request', {title: 'Good essay'}]],
        [updateOrder, ({id}) => ([{id, test: 'ok'}])],
        [hireExpert, ['request', {expertId: 666}]]
    )
    
    // await runner.execute(Steps.CREATE_ORDER)

    console.log(runner.getExecutionResults())
}

testRunner()
