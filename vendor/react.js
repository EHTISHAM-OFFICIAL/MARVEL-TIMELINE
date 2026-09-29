import React, * as ReactExports from "https://esm.unpkg.com/react@18.3.1";
import { createRoot } from "https://esm.unpkg.com/react-dom@18.3.1/client";
import htm from "https://esm.unpkg.com/htm@3.1.1";

const html = htm.bind(React.createElement);

export const render = (node, container) => createRoot(container).render(node);
export { React };
export * from "https://esm.unpkg.com/react@18.3.1";
