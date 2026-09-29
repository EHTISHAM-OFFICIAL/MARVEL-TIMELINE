import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "https://esm.unpkg.com/react@18.3.1";
import { createRoot } from "https://esm.unpkg.com/react-dom@18.3.1/client";
import htm from "https://esm.unpkg.com/htm@3.1.1";

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
