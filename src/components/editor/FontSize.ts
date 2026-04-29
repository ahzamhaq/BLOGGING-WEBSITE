import { Extension } from "@tiptap/core";
import "@tiptap/extension-text-style";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      /** Set the font-size CSS value on the current textStyle mark */
      setFontSize: (size: string) => ReturnType;
      /** Remove font-size from the current textStyle mark */
      unsetFontSize: () => ReturnType;
    };
  }
}

/**
 * FontSize — extends TextStyle to carry a `fontSize` attribute.
 *
 * Works with @tiptap/extension-text-style ≥ 2.x.
 * Must be registered AFTER TextStyle in the extensions array.
 */
export const FontSize = Extension.create({
  name: "fontSize",

  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) =>
              (element as HTMLElement).style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) =>
          chain()
            .setMark("textStyle", { fontSize })
            .run(),

      unsetFontSize:
        () =>
        ({ chain }) =>
          chain()
            .setMark("textStyle", { fontSize: null })
            .removeEmptyTextStyle()
            .run(),
    };
  },
});
