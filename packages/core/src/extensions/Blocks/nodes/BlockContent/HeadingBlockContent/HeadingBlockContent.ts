import { InputRule } from "@tiptap/core";
import { defaultProps } from "../../../api/defaultProps";
import { createTipTapBlock } from "../../../api/block";
import { BlockSpec, PropSchema } from "../../../api/blockTypes";
import {
  createDefaultBlockDOMOutputSpec,
  defaultBlockToHTML,
} from "../defaultBlockHelpers";

export const headingPropSchema = {
  ...defaultProps,
  level: { default: 1, values: [1, 2, 3] as const },
} satisfies PropSchema;

const HeadingBlockContent = createTipTapBlock<"heading", true>({
  name: "heading",
  content: "inline*",

  addAttributes() {
    return {
      level: {
        default: 1,
        // instead of "level" attributes, use "data-level"
        parseHTML: (element) => element.getAttribute("data-level")!,
        renderHTML: (attributes) => {
          return {
            "data-level": (attributes.level as number).toString(),
          };
        },
      },
    };
  },

  addInputRules() {
    return [
      ...[1, 2, 3].map((level) => {
        // Creates a heading of appropriate level when starting with "#", "##", or "###".
        return new InputRule({
          find: new RegExp(`^(#{${level}})\\s$`),
          handler: ({ state, chain, range }) => {
            chain()
              .BNUpdateBlock(state.selection.from, {
                type: "heading",
                props: {
                  level: level as any,
                },
              })
              // Removes the "#" character(s) used to set the heading.
              .deleteRange({ from: range.from, to: range.to });
          },
        });
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Alt-1": () =>
        this.editor.commands.BNUpdateBlock(this.editor.state.selection.anchor, {
          type: "heading",
          props: {
            level: 1 as any,
          },
        }),
      "Mod-Alt-2": () =>
        this.editor.commands.BNUpdateBlock(this.editor.state.selection.anchor, {
          type: "heading",
          props: {
            level: 2 as any,
          },
        }),
      "Mod-Alt-3": () =>
        this.editor.commands.BNUpdateBlock(this.editor.state.selection.anchor, {
          type: "heading",
          props: {
            level: 3 as any,
          },
        }),
    };
  },

  parseHTML() {
    return [
      {
        tag: "h1",
        attrs: { level: 1 },
        node: "heading",
      },
      {
        tag: "h2",
        attrs: { level: 2 },
        node: "heading",
      },
      {
        tag: "h3",
        attrs: { level: 3 },
        node: "heading",
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return createDefaultBlockDOMOutputSpec(
      this.name,
      `h${node.attrs.level}`,
      {
        ...(this.options.domAttributes?.blockContent || {}),
        ...HTMLAttributes,
      },
      this.options.domAttributes?.inlineContent || {}
    );
  },
});

export const Heading = {
  node: HeadingBlockContent,
  propSchema: headingPropSchema,
  toInternalHTML: defaultBlockToHTML,
  toExternalHTML: defaultBlockToHTML,
} satisfies BlockSpec<"heading", typeof headingPropSchema, true>;
