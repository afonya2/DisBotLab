enum DBLNodeCategory {
    Event = 'Event',
    Action = 'Action'
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
    }
}

const CategoryIcons = {
    "Event": 'pi pi-android',
    "Action": 'pi pi-play',
}

export { DBLNodes, CategoryIcons }
export type { DBLNode, DBLNodeCategory };