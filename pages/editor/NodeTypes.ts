enum DBLNodeCategory {
    Event = 'Event',
    Action = 'Action',
    Variables = 'Variables',
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
    }
}

const CategoryIcons = {
    "Event": 'pi pi-android',
    "Action": 'pi pi-play',
    "Variables": 'pi pi-th-large',
    "Other": 'pi pi-ellipsis-h'
}

export { DBLNodes, CategoryIcons }
export type { DBLNode, DBLNodeCategory };