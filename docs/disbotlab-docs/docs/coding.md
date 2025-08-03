---
sidebar_position: 5
description: Programming in DBL
---

# Programming
In DBL you can create programs by creating flows.

## Variables
DBL has 2 types of variables:
- flow
- module

### Flow variables
These variables only exists while the flow is running.
After it finishes, it gets deleted.

### Module variables
Module variables get saved in the DB.
They can be only used by one module.

## Nodes
In the settings of a node you can usually specify variables by wrapping them in `{}`.
Example: `{variable}`

:::warning
However some of them want a variables name by default (currently this is: `Reply to interaction` and `Reply to message`)
:::

## Flows
Every flow has a start node, which is usually an event, like when a command is ran.

A node can't have more than 1 output and 1 input.

## Ifs and loops
Because you can't connect multiple nodes to 1 node. You need to end every if/loop with an `end` node.

If the condition is false, the flow will jump here. If it's true, the flow will continue normally.

## Conditions
- `==`
- `!=`
- `>`
- `<`
- `>=`
- `<=`
- `includes`
- `startsWith`
- `endsWith`

## Math operators
- `+`
- `-`
- `*`
- `/`
- `%`
- `^`