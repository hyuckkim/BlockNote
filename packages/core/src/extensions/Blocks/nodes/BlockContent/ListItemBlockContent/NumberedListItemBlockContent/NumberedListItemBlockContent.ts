import { InputRule } from "@tiptap/core";
import { defaultProps } from "../../../../api/defaultProps";
import { createTipTapBlock } from "../../../../api/block";
import { BlockSpec, PropSchema } from "../../../../api/blockTypes";
import { handleEnter } from "../ListItemKeyboardShortcuts";
import { NumberedListIndexingPlugin } from "./NumberedListIndexingPlugin";
import {
  createDefaultBlockDOMOutputSpec,
  defaultBlockToHTML,
} from "../../defaultBlockHelpers";

export const numberedListItemPropSchema = {
  ...defaultProps,
} satisfies PropSchema;

const NumberedListItemBlockContent = createTipTapBlock<
  "numberedListItem",
  true
>({
  name: "numberedListItem",
  content: "inline*",

  addAttributes() {
    return {
      index: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-index"),
        renderHTML: (attributes) => {
          return {
            "data-index": attributes.index,
          };
        },
      },
    };
  },

  addInputRules() {
    return [
      // Creates an ordered list when starting with "1.".
      new InputRule({
        find: new RegExp(`^1\\.\\s$`),
        handler: ({ state, chain, range }) => {
          chain()
            .BNUpdateBlock(state.selection.from, {
              type: "numberedListItem",
              props: {},
            })
            // Removes the "1." characters used to set the list.
            .deleteRange({ from: range.from, to: range.to });
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => handleEnter(this.editor),
      "Mod-Shift-8": () =>
        this.editor.commands.BNUpdateBlock(this.editor.state.selection.anchor, {
          type: "numberedListItem",
          props: {},
        }),
    };
  },

  addProseMirrorPlugins() {
    return [NumberedListIndexingPlugin()];
  },

  parseHTML() {
    return [
      // Case for regular HTML list structure.
      // (e.g.: when pasting from other apps)
      {
        tag: "li",
        getAttrs: (element) => {
          if (typeof element === "string") {
            return false;
          }

          const parent = element.parentElement;

          if (parent === null) {
            return false;
          }

          if (parent.tagName === "OL") {
            return {};
          }

          return false;
        },
        node: "numberedListItem",
      },
      // Case for BlockNote list structure.
      // (e.g.: when pasting from blocknote)
      {
        tag: "p",
        getAttrs: (element) => {
          if (typeof element === "string") {
            return false;
          }

          const parent = element.parentElement;

          if (parent === null) {
            return false;
          }

          if (parent.getAttribute("data-content-type") === "numberedListItem") {
            return {};
          }

          return false;
        },
        priority: 300,
        node: "numberedListItem",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return createDefaultBlockDOMOutputSpec(
      this.name,
      // We use a <p> tag, because for <li> tags we'd need an <ol> element to
      // put them in to be semantically correct, which we can't have due to the
      // schema.
      "p",
      {
        ...(this.options.domAttributes?.blockContent || {}),
        ...HTMLAttributes,
      },
      this.options.domAttributes?.inlineContent || {}
    );
  },
});

export const NumberedListItem = {
  node: NumberedListItemBlockContent,
  propSchema: numberedListItemPropSchema,
  toInternalHTML: defaultBlockToHTML,
  toExternalHTML: defaultBlockToHTML,
} satisfies BlockSpec<
  "numberedListItem",
  typeof numberedListItemPropSchema,
  true
>;
