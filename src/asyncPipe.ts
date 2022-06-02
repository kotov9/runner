function wait(args: any): Promise<any> {
    return new Promise((res) => setTimeout(() => {
        console.log('WAIT WITH', args)
        res(Math.random() * 100 | 0)
    }, 3000))
}

function asyncPipe(...asyncFunctions: any[]) {
    return async function(initialValue: any) {
        let value = initialValue
        for (const func of asyncFunctions) {
            value = await func(value)
            console.log('RESULT:', value)
        }

        return value
    }
}

const p = asyncPipe(wait, wait, wait, wait, wait)

p('START').then(res => console.log('done'))