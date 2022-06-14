# AST for `<template>`

一些类型是[ESTree]类型的增强.

- [Program]
- [Node]
- [Statement]
- [BlockStatement]
- [Expression]
- [Literal]
- [Pattern]

您可以使用此 AST 的类型定义：

```ts
import { AST } from "mpx-eslint-parser"

export function create(context) {
    return context.parserServices.defineTemplateBodyVisitor(
        // Event handlers for <template>.
        {
            VElement(node: AST.VElement): void {
                //...
            }
        },
        // Event handlers for <script> or scripts. (optional)
        {
            Program(node: AST.ESLintProgram): void {
                //...
            }
        }
    )
}
```

`AST` 具有 ESLint 的 AST 类型，前缀为 `ESLint`。<br>
查看详细信息：[../src/ast/nodes.ts](../src/ast/nodes.ts)

## Node

```js
extend interface Node {
    range: [ number ]
}
```

- 这个 AST 规范增强了像 ESLint 这样的 [Node] 节点。
- `range` 属性是一个包含 2 个整数的数组。
  第一个整数是节点起始位置的偏移量。
  第二个整数是节点结束位置的偏移量。

## VIdentifier

```js
interface VIdentifier <: Node {
    type: "VIdentifier"
    name: string
    rawName: string
}
```

- 这类似于 [Identifier] 节点，但这个 `name` 属性可以包括任何
   除 U+0000-U+001F, U+007F-U+009F, U+0020, U+0022, U+0027, U+003E,
  U+002F, U+003D, U+FDD0-U+FDEF, U+FFFE, U+FFFF, U+1FFFE, U+1FFFF, U+2FFFE, U+2FFFF,
  U+3FFFE, U+3FFFF, U+4FFFE, U+4FFFF, U+5FFFE, U+5FFFF, U+6FFFE, U+6FFFF, U+7FFFE,
  U+7FFFF, U+8FFFE, U+8FFFF, U+9FFFE, U+9FFFF, U+AFFFE, U+AFFFF, U+BFFFE, U+BFFFF,
  U+CFFFE, U+CFFFF, U+DFFFE, U+DFFFF, U+EFFFE, U+EFFFF, U+FFFFE, U+FFFFF, U+10FFFE
  和 U+10FFFF.
- 这是 attribute 名字.

## VText

```js
interface VText <: Node {
    type: "VText"
    value: string
}
```

- HTML 的纯文本。
- `value` 属性中的 HTML 实体被解码。

## VExpressionContainer

```js
interface VExpressionContainer <: Node {
    type: "VExpressionContainer"
    expression: Expression | null
    references: [ Reference ]
}

interface Reference {
    id: Identifier
    mode: "rw" | "r" | "w"
    variable: Variable | null
}

```

- 这是 模版引擎 或者 指令值.
- 如果存在语法错误，则 `VExpressionContainer#expression` 为 `null`。
- 如果是空模版，则 `VExpressionContainer#expression` 为 `null`。 （例如，`{{ /* 评论 */ }}`）
- `Reference` 是对象，但不是 `Node`。 这些是表达式中的外部引用。
- `Reference#variable` 是由`VElement` 定义的变量。 如果引用使用全局变量或 VM 成员，则为 `null`。

## VDirectiveKey

```js
interface VDirectiveKey <: Node {
    type: "VDirectiveKey"
    name: VIdentifier
    argument: VExpressionContainer | VIdentifier | null
    modifiers: [ VIdentifier ]
}
```

- `name` 属性没有 `wx:` 前缀。 去掉了。
- `argument` 属性是一个 `VExpressionContainer` 节点，如果它是一个 [动态参数]。
- 在 `bind:tap` 的简写中，`name.name` 属性是 `"bind"`，而 `name.rawName` 属性是 `":"`。(还未支持)
- 否则，`shorthand` 属性始终为 `false`。

## VLiteral

```js
interface VLiteral <: Node {
    type: "VAttributeValue"
    value: string
}
```

- 这类似于 [Literal] 节点，但并不总是被引用。
- `value` 属性中的 HTML 实体被解码。

## VAttribute

```js
interface VAttribute <: Node {
    type: "VAttribute"
    directive: false
    key: VIdentifier
    value: VLiteral | null
}

interface VDirective <: Node {
    type: "VAttribute"
    directive: true
    key: VDirectiveKey
    value: VExpressionContainer | null
}
```

- 如果它们的属性值不存在，则 `value` 属性为 `null`。

## VStartTag

```js
interface VStartTag <: Node {
    type: "VStartTag"
    attributes: [ VAttribute ]
}
```

## VEndTag

```js
interface VEndTag <: Node {
    type: "VEndTag"
}
```

## VElement

```js
interface VElement <: Node {
    type: "VElement"
    namespace: string
    name: string
    startTag: VStartTag
    children: [ VText | VExpressionContainer | VElement ]
    endTag: VEndTag | null
    variables: [ Variable ]
}

interface Variable {
    id: Identifier
    kind: "wx:for" | "scope"
    references: [ Reference ]
}
```

- `Variable` 是对象，但不是 `Node`。 这些是子元素可以使用的变量声明。 具有 [`wx:for` 指令] 或特殊属性 [范围] 的元素可以声明变量。(还未支持)
- `Variable#references` 是使用此变量的引用数组。

## VRootElement

```js
interface VRootElement <: VElement {
    tokens: [ Token ]
    comments: [ Token ]
    errors: [ ParseError ]
}

interface Token <: Node {
    type: string
    value: string
}

interface ParseError <: Error {
    code?: string
    message: string
    index: number
    lineNumber: number
    column: number
}
```

## Program

```js
extend interface Program {
    templateBody: VRootElement | null
}
```

该规范增强了 [Program] 节点，因为它具有 `<template>` 的根节点。
目前仅支持 HTML。 其他语言的 AST 可能与 VElement 的形式不同。

[ESTree]: https://github.com/estree/estree
[Program]: https://github.com/estree/estree/blob/master/es5.md#programs
[Node]: https://github.com/estree/estree/blob/master/es5.md#node-objects
[Statement]: https://github.com/estree/estree/blob/master/es5.md#statements
[BlockStatement]: https://github.com/estree/estree/blob/master/es5.md#blockstatement
[Expression]: https://github.com/estree/estree/blob/master/es5.md#expressions
[Literal]: https://github.com/estree/estree/blob/master/es5.md#literal
[Pattern]: https://github.com/estree/estree/blob/master/es5.md#patterns
[Identifier]: https://github.com/estree/estree/blob/master/es5.md#identifier
[ForInStatement]: https://github.com/estree/estree/blob/master/es5.md#forinstatement
[VariableDeclarator]: https://github.com/estree/estree/blob/master/es5.md#variabledeclarator

