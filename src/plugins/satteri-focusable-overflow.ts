import type { SatteriProcessorOptions } from "@astrojs/markdown-satteri";

type HastPlugin = NonNullable<SatteriProcessorOptions["hastPlugins"]>[number];

const focusableOverflowPlugin = {
  name: "focusable-overflow",
  element: {
    filter: ["pre", "table"],
    visit(node, context) {
      context.setProperty(node, "tabIndex", 0);
    },
  },
} satisfies HastPlugin;

export default focusableOverflowPlugin;
