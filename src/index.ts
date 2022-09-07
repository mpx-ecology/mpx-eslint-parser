/**
 * @author pagnkelly <https://github.com/pagnkelly>
 * @copyright 2020 pagnkelly. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
import * as path from "path"
import * as AST from "./ast"
import { LocationCalculator } from "./common/location-calculator"
import { HTMLParser, HTMLTokenizer } from "./html"
import { parseScript, parseScriptElement } from "./script"
import * as services from "./parser-services"

const STARTS_WITH_LT = /^\s*</u

/**
 * Check whether the code is a Mpx.js component.
 * @param code The source code to check.
 * @param options The parser options.
 * @returns `true` if the source code is a mpx.js component.
 */
function isMpxFile(code: string, options: any): boolean {
    const filePath = (options.filePath as string | undefined) || "unknown.js"
    return path.extname(filePath) === ".mpx" || STARTS_WITH_LT.test(code)
}

/**
 * Check whether the node is a `<template>` element.
 * @param node The node to check.
 * @returns `true` if the node is a `<template>` element.
 */
function isTemplateElement(node: AST.VNode): node is AST.VElement {
    return node.type === "VElement" && node.name === "template"
}

/**
 * Check whether the node is a `<script>` element.
 * @param node The node to check.
 * @returns `true` if the node is a `<script>` element.
 */

function isScriptElement(node: any): node is AST.VElement {
    if (node && node.startTag && node.startTag.attributes) {
        const type = node.startTag.attributes.find(
            (attribute: AST.VAttribute) =>
                attribute.directive === false && attribute.key.name === "type",
        )
        const name = node.startTag.attributes.find(
            (attribute: AST.VAttribute) =>
                attribute.directive === false && attribute.key.name === "name",
        )
        if (
            (name && name.value && name.value.value) === "json" ||
            (type && type.value && type.value.value) === "application/json"
        ) {
            return false
        }
    }
    return node.type === "VElement" && node.name === "script"
}

/**
 * Check whether the attribute node is a `lang` attribute.
 * @param attribute The attribute node to check.
 * @returns `true` if the attribute node is a `lang` attribute.
 */
function isLang(
    attribute: AST.VAttribute | AST.VDirective,
): attribute is AST.VAttribute {
    return attribute.directive === false && attribute.key.name === "lang"
}

/**
 * Get the `lang` attribute value from a given element.
 * @param element The element to get.
 * @param defaultLang The default value of the `lang` attribute.
 * @returns The `lang` attribute value.
 */
function getLang(
    element: AST.VElement | undefined,
    defaultLang: string,
): string {
    const langAttr = element && element.startTag.attributes.find(isLang)
    const lang = langAttr && langAttr.value && langAttr.value.value
    return lang || defaultLang
}

/**
 * Parse the given source code.
 * @param code The source code to parse.
 * @param options The parser options.
 * @returns The parsing result.
 */
export function parseForESLint(
    code: string,
    options: any,
): AST.ESLintExtendedProgram {
    // 研究了下vue最新的实现，有点难搞，重构了很多
    //eslint-disable-next-line no-param-reassign
    options = Object.assign(
        {
            comment: true,
            ecmaVersion: 2015,
            loc: true,
            range: true,
            tokens: true,
        },
        options || {},
    )

    let result: AST.ESLintExtendedProgram
    let document: AST.VDocumentFragment | null
    if (!isMpxFile(code, options)) {
        result = parseScript(code, options)
        document = null
    } else {
        const skipParsingScript = options.parser === false
        const tokenizer = new HTMLTokenizer(code)
        const rootAST = new HTMLParser(tokenizer, options).parse()
        const locationCalcurator = new LocationCalculator(
            tokenizer.gaps,
            tokenizer.lineTerminators,
        )
        const script = rootAST.children.find(isScriptElement)
        const template = rootAST.children.find(isTemplateElement)
        const templateLang = getLang(template, "html")
        const concreteInfo: AST.HasConcreteInfo = {
            tokens: rootAST.tokens,
            comments: rootAST.comments,
            errors: rootAST.errors,
        }
        const templateBody =
            template != null && templateLang === "html"
                ? Object.assign(template, concreteInfo)
                : undefined

        if (skipParsingScript || script == null) {
            result = parseScript("", options)
        } else {
            result = parseScriptElement(script, locationCalcurator, options)
        }

        result.ast.templateBody = templateBody
        document = rootAST
    }

    result.services = Object.assign(
        result.services || {},
        services.define(result.ast, document),
    )

    return result
}

/**
 * Parse the given source code.
 * @param code The source code to parse.
 * @param options The parser options.
 * @returns The parsing result.
 */
export function parse(code: string, options: any): AST.ESLintProgram {
    return parseForESLint(code, options).ast
}

export { AST }
