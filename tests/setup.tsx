import "@testing-library/jest-dom";
import { vi } from "vitest";
import React, { type ReactNode } from "react";
import "fake-indexeddb/auto";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock framer-motion as a pass-through
vi.mock("framer-motion", () => ({
  motion: {
    div: (() => {
      const Div = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ children, ...props }, ref) => (
        <div {...props} ref={ref}>{children}</div>
      ));
      Div.displayName = 'MotionDiv';
      return Div;
    })(),
    span: (() => {
      const Span = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(({ children, ...props }, ref) => (
        <span {...props} ref={ref}>{children}</span>
      ));
      Span.displayName = 'MotionSpan';
      return Span;
    })(),
    header: (() => {
      const Header = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(({ children, ...props }, ref) => (
        <header {...props} ref={ref}>{children}</header>
      ));
      Header.displayName = 'MotionHeader';
      return Header;
    })(),
  },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
