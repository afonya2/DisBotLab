enum DBLNodeCategory {
    Event = 'Event',
    Action = 'Action',
    Variables = 'Variables',
    Control = 'Control',
    Other = 'Other'
}

interface DBLNode {
    name: string;
    description: string;
    category: DBLNodeCategory;
    defaultSave?: any;
    variant: string;
    editor: string
}

const DBLNodes: { [key: string]: DBLNode } = {
    "command": {
        name: "On command",
        description: "Triggers when a command is executed.",
        category: DBLNodeCategory.Event,
        defaultSave: {
            command: "",
            desc: "A command",
            variable: "command"
        },
        variant: "input",
        editor: "command"
    },
    "reply": {
        name: "Reply to interaction",
        description: "Replies to a command interaction.",
        category: DBLNodeCategory.Action,
        defaultSave: {
            content: "",
            interaction: "interaction",
            ephemeral: true
        },
        variant: "default",
        editor: "reply"
    },
    "replyMessage": {
        name: "Reply to message",
        description: "Replies to message.",
        category: DBLNodeCategory.Action,
        defaultSave: {
            content: "",
            message: "message"
        },
        variant: "default",
        editor: "reply"
    },
    "sendMessage": {
        name: "Send message",
        description: "Sends a message to a channel.",
        category: DBLNodeCategory.Action,
        defaultSave: {
            content: "Hello, world!",
            channel: "{channel}"
        },
        variant: "default",
        editor: "message"
    },
    "sendMessageUser": {
        name: "Send message to user",
        description: "Sends a message to a user.",
        category: DBLNodeCategory.Action,
        defaultSave: {
            content: "Hello, world!",
            user: "{user}"
        },
        variant: "default",
        editor: "message"
    },
    "setVariable": {
        name: "Set variable",
        description: "Sets a variable to a value.",
        category: DBLNodeCategory.Variables,
        defaultSave: {
            variable: "variable",
            value: "value",
            global: false
        },
        variant: "default",
        editor: "variable"
    },
    "if": {
        name: "If condition",
        description: "Executes nodes based on a condition.",
        category: DBLNodeCategory.Control,
        defaultSave: {
            left: "0",
            right: "0",
            operator: "=="
        },
        variant: "default",
        editor: "if"
    },
    "while": {
        name: "While loop",
        description: "Repeats nodes while a condition is true.",
        category: DBLNodeCategory.Control,
        defaultSave: {
            left: "0",
            right: "0",
            operator: "=="
        },
        variant: "default",
        editor: "if"
    },
    "end": {
        name: "End",
        description: "Ends an if condition or a while loop.",
        category: DBLNodeCategory.Control,
        defaultSave: {},
        variant: "default",
        editor: ""
    },
    "stop": {
        name: "Stop flow",
        description: "Stops the current flow execution.",
        category: DBLNodeCategory.Control,
        defaultSave: {},
        variant: "default",
        editor: ""
    },
    "comment": {
        name: "Comment",
        description: "A comment node for documentation purposes.",
        category: DBLNodeCategory.Other,
        defaultSave: {
            comment: "This is a comment"
        },
        variant: "default",
        editor: "comment"
    },
    "error": {
        name: "Error",
        description: "Causes an error.",
        category: DBLNodeCategory.Other,
        defaultSave: {
            message: "An error occurred"
        },
        variant: "default",
        editor: "error"
    },
    "onError": {
        name: "On error",
        description: "Triggers when an error occurs in the flow.",
        category: DBLNodeCategory.Event,
        defaultSave: {
            variable: "error"
        },
        variant: "input",
        editor: "simpleEvent"
    },
    "onMessage": {
        name: "On message",
        description: "Triggers when a message is sent in a channel.",
        category: DBLNodeCategory.Event,
        defaultSave: {
            prefix: "",
            variable: "message"
        },
        variant: "input",
        editor: "simpleEvent"
    },
    "math": {
        name: "Math operation",
        description: "Performs a mathematical operation.",
        category: DBLNodeCategory.Variables,
        defaultSave: {
            operator: "+",
            left: "1",
            right: "1",
            variable: "result"
        },
        variant: "default",
        editor: "math"
    },
    "log": {
        name: "Log to console",
        description: "Logs a message to the console.",
        category: DBLNodeCategory.Other,
        defaultSave: {
            message: "Hello, world!"
        },
        variant: "default",
        editor: "log"
    }
}

const CategoryIcons = {
    "Event": 'pi pi-android',
    "Action": 'pi pi-play',
    "Variables": 'pi pi-th-large',
    "Control": 'pi pi-cog',
    "Other": 'pi pi-ellipsis-h'
}

export { DBLNodes, CategoryIcons }
export type { DBLNode, DBLNodeCategory };