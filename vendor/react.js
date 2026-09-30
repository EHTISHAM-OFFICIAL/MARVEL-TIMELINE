import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "https://esm.sh/react@18.3.1?target=es2020&minify";

import { createRoot } from "https://esm.sh/react-dom@18.3.1/client?target=es2020&minify";

import htm from "https://esm.sh/htm@3.1.1?target=es2020&minify";

const html = htm.bind(React.createElement);

const render = (node, container) => createRoot(container).render(node);

export {
  html,
  render,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
};
