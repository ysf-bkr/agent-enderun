# 🎨 Corporate Frontend and Responsive Standards

This document defines the UI/UX standards for projects managed by Agent Enderun. All interfaces must comply with "Mobile-First", "Fluid Responsive", and "Cross-Device Adaptive" principles.

## 1. Design System: Panda CSS & Tailwind Integration
- **Zero UI Library:** Heavy external UI libraries like Ant Design or MUI are not used. All styles are written with type-safe **Panda CSS** or structured **Tailwind CSS**.
- **Token Usage:** Colors, spacing, and font sizes must be managed via the `token()` function or standard CSS variables.
- **Responsive Syntax:** Object-based responsive syntax is mandatory:
  ```typescript
  css({
    width: { base: '100%', md: '50%', lg: '33.33%' },
    padding: { base: '4', md: '8' }
  })
  ```

## 2. Mobile-First and Fluid Design
- **Mobile-First Approach:** Styles must always be written for the smallest screen size (`base`), then expanded to larger screens using `sm`, `md`, `lg`, `xl`, and `2xl` breakpoints.
- **Fluid Grid & Flexbox:** Layouts should not be restricted by fixed widths. `flex-wrap` and CSS Grid (`grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`) are preferred.
- **Fluid Typography:** Font sizes should scale dynamically based on screen width:
  ```css
  font-size: clamp(1rem, 2vw + 0.5rem, 2rem);
  ```
- **Container Bounds:** The main body of the page must have responsive padding and a maximum width limit (standard of `1280px` or `1440px`).

## 3. Viewport Safety
- **Overflow Guard:** Horizontal scrollbars are strictly forbidden. `box-sizing: border-box` must be applied to all elements, and widths must be restricted with `max-width: 100%`.
- **Dynamic Viewport Units:** To avoid issues with mobile browser address bars, use `dvh` (Dynamic Viewport Height) and `dvw` instead of `vh` and `vw`.
- **Touch Targets:** Clickable elements (buttons, links, inputs) on mobile devices must have a minimum size of `44px x 44px`.

## 4. Component Governance
- **Atomic Design:** UI components must be collected under `apps/web/src/components/ui/`.
- **Page Isolation:** Reusable atomic components should be preferred over defining styles within page files.
- **Image Optimization:** Use the `picture` tag or `srcset` for responsive images, and support `@2x` resolutions for retina displays. SVGs must always be scalable via `viewBox`.

## 5. Accessibility and Performance
- **WCAG AA:** All color contrasts and keyboard navigation structures must comply with WCAG AA standards.
- **Lighthouse Score:** A score of 90+ for performance, accessibility, and SEO should be targeted for all pages.
