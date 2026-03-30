import { QuartzTransformerPlugin } from "../types"
import { Element, Text, Root as HtmlRoot } from "hast"
import { visit } from "unist-util-visit"

const TASK_REGEX = /^\[(.)\] ?/

function findFirstText(
  children: HtmlRoot["children"],
): { node: Text; parentChildren: HtmlRoot["children"] } | null {
  for (const child of children) {
    if (child.type === "text") {
      return { node: child as Text, parentChildren: children }
    }
    if (child.type === "element") {
      const el = child as Element
      if (["p", "span", "a"].includes(el.tagName)) {
        const result = findFirstText(el.children as HtmlRoot["children"])
        if (result) return result
      }
    }
    break // only check first child path
  }
  return null
}

export const AlternativeCheckboxes: QuartzTransformerPlugin = () => {
  return {
    name: "AlternativeCheckboxes",
    htmlPlugins() {
      return [
        () => (tree: HtmlRoot) => {
          visit(tree, "element", (node: Element) => {
            if (node.tagName !== "li") return

            // Already a standard GFM task item – skip
            const firstChild = node.children[0]
            if (
              firstChild?.type === "element" &&
              (firstChild as Element).tagName === "input"
            ) {
              return
            }

            const result = findFirstText(node.children as HtmlRoot["children"])
            if (!result) return

            const { node: textNode } = result
            const match = TASK_REGEX.exec(textNode.value)
            if (!match) return

            const char = match[1]
            // Skip standard GFM markers
            if (char === " " || char === "x" || char === "X") return

            // Remove "[x] " prefix
            textNode.value = textNode.value.slice(match[0].length)

            // Mark the li with data-task
            node.properties = { ...(node.properties ?? {}), "data-task": char }
          })
        },
      ]
    },
  }
}
