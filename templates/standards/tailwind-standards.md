# 🌊 Corporate Tailwind CSS Standards

This document defines the rules required to maintain code quality and design discipline in projects using Tailwind CSS.

## 1. Design Discipline and Constraints
- **No Arbitrary Values:** The use of arbitrary values like `h-[123px]` or `bg-[#fafafa]` is forbidden. All values must be fed from the theme in `tailwind.config.ts`.
- **Utility-First, Not Utility-Only:** Class structures that become too complex should be managed with `@apply` or by dividing them into components (Atomic Design).
- **Prettier Plugin:** `prettier-plugin-tailwindcss` must be used for class ordering.

## 2. Responsive and Mobile-First
- **Mobile-First:** Styles should be written for mobile first, then expanded with `sm:`, `md:`, and `lg:` prefixes.
- **Consistency:** Consistent breakpoint usage across the project (standard Tailwind breakpoints) is mandatory.

## 3. Clean Code and Organization
- **Clean Templates:** If there are more than 10 Tailwind classes in HTML/JSX, these classes should be organized with tools like `cva` (Class Variance Authority) or `clsx`/`tailwind-merge`.
- **Component Isolation:** UI components must be collected under `apps/web/src/components/ui/`, and each component must contain its own Tailwind classes.

## 4. Performance and Accessibility
- **JIT Mode:** Just-in-Time mode should always be used.
- **Contrast:** WCAG AA standards must be complied with when choosing theme colors.
