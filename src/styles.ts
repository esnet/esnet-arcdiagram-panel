// [refactor] All CSS keys in this file were converted from kebab-case (e.g. "z-index",
// "border-radius") to camelCase, and the proper `CSSProperties` type is now imported instead
// of relying on the global `React` namespace. Verified output-identical (React normalizes both
// forms); the only change is the removal of React's dev-time "Unsupported style property" warnings.
import { CSSProperties } from 'react';
import { css } from '@emotion/css';

// [refactor] The former `styles.css` stylesheet was removed: Grafana's plugin validator rejects
// direct CSS imports (`code-rules-no-direct-css-imports`). Its rules were split by whether they
// need a pseudo-selector — the plain ones moved into the inline `CSSProperties` objects below
// (`panelContainerStyle`, `canvasStyle`), the `:hover`/`::placeholder` ones into the Emotion
// classes in `cssStyles`. `css` from '@emotion/css' is the primitive Grafana's own `useStyles2`
// is built on; the banned API is Emotion's <Global> component, which we do not use.
//
// This also scopes styling that used to leak: the old rules keyed off bare ids (`#canvas`,
// `#zoom-button`, `#search-field`) that collided between panel instances on a shared dashboard,
// and the placeholder rules were unscoped element selectors restyling every input on the page.
export const cssStyles = {
  // Was `#zoom-button:hover`. The `!important` is load-bearing: the button's base
  // `backgroundColor` comes from the inline `zoomButtonStyle()` below, and an inline declaration
  // outranks a normal class rule.
  zoomButton: css({
    '&:hover': {
      transform: 'translateY(-8px)',
      backgroundColor: 'grey !important',
    },
  }),
  // Was `#search-field` + `#search-field:hover`.
  searchField: css({
    transition: 'all 250ms',
    '&:hover': {
      transform: 'translateY(-8px)',
    },
  }),
  // Was `#search-field input` (+ `:hover`, + the placeholder rules). The six placeholder rules
  // (`input::placeholder` plus five vendor-prefixed variants) collapse into the standard
  // `::placeholder`; the resolved color is unchanged, since CSS `grey` *is* #808080. Emotion's
  // prefixer still emits `::-webkit-input-placeholder` alongside it, so Chrome/Safari coverage is
  // not lost. The `opacity: 1` that accompanied the old `-moz-placeholder` rules is dropped —
  // it existed to undo Firefox's pre-v52 default placeholder opacity, which no longer applies.
  searchInput: css({
    transition: 'all 250ms',
    '&:hover': {
      backgroundColor: 'rgb(195, 188, 188) !important',
    },
    '&::placeholder': {
      color: '#808080',
    },
  }),
};

// Hoisted so `canvasStyle` can extend it (an object literal cannot reference its own `styles.*`).
const containerStyle: CSSProperties = {
  width: "100%",
  height: "100%"
};

export const styles = {
    containerStyle,
    // Was the `#canvas` rule. Arc.tsx's zoom effect sets this element's `transform` imperatively
    // via `handleZoom()` (utils.ts); that is a different property from `transformOrigin`/
    // `transition`, so the inline values coexist and React never clobbers the transform.
    canvasStyle: {
      ...containerStyle,
      overflow: "hidden",
      transformOrigin: "-50px -50px",
      transition: "transform 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) 0s"
    } as CSSProperties,
    labelStyle: {
      width: "100%",
      height: "100%",
      zIndex: 10,
    } as CSSProperties,
    buttonStyle: {
      width: "30px",
      height: "30px",
      top: 0,
      position: "absolute"
    } as CSSProperties,
    toolTipStyle: {
      box: {
        position: "absolute",
        left: "",
        top: "",
        width: "auto",
        height: "auto",
        background: "white",
        padding: "1em",
        margin: "1em",
        maxWidth: "300px",
        borderRadius: "5px",
        opacity: 0.9
      } as CSSProperties,
      text(fontSize: number, color: string): CSSProperties {
        return {
          // [refactor] Color is passed in from the theme (props.textColor =
          // theme.colors.text.primary) instead of being hard-coded "black". The tooltip now
          // renders inside Grafana's <VizTooltipContainer>, whose background is themed (dark in
          // dark mode), so black text was unreadable. The themed color is readable in both modes.
          color,
          fontSize: `${fontSize}px`,
          margin: "0",
          fontWeight: 100
        }
      },
      preface: {
        fontWeight: 900
      } as CSSProperties,
    },
    // `overflow` was `#scroll-box` in the removed stylesheet.
    panelContainerStyle: {
      height: "100%",
      width: "100%",
      overflow: "scroll"
    } as CSSProperties,
    searchFieldStyle: {
      display: "inline-block",
      margin: "0em 1em",
      verticalAlign: "middle",
    } as CSSProperties,
    inputStyle(isDarkMode: boolean): CSSProperties {
      return {
        width: "200px",
        height: "40px",
        background: (isDarkMode) ? "rgb(244 245 245 / 83%)" : "hsla(0, 0%, 0%, 1)",
        color: (isDarkMode) ? "black" : "white",
        padding: "1em",
        borderRadius: "30px"
      }
    },
    toolBarStyle: {
      top: "10px",
      right: 0,
      position: "absolute"
    } as CSSProperties,
    zoomButtonWrapper: {
      margin: "0em 1em",
      verticalAlign: "middle",
      display: "inline-block"
    } as CSSProperties,
    zoomButtonStyle(isDarkMode: boolean, position: number): CSSProperties {
      const borderRadius = "30px", padding = "5px"
      const styles: CSSProperties = {
        display: "inline-block",
        backgroundColor: isDarkMode ? "rgba(244, 245, 245, 0.83)" : "black",
        border: "1px solid rgba(0, 0, 0, 0.1)",
        cursor: "pointer",
        transition: "all 250ms",
        borderTopLeftRadius: "0px",
        borderBottomLeftRadius: "0px",
        borderTopRightRadius: "0px",
        borderBottomRightRadius: "0px",
        paddingLeft: padding,
        paddingRight: padding
      }
      if(position === 0) {
        styles.borderTopLeftRadius = borderRadius
        styles.borderBottomLeftRadius = borderRadius
        styles.paddingLeft = padding
      } else if (position === 2) {
        styles.borderTopRightRadius = borderRadius
        styles.borderBottomRightRadius = borderRadius
        styles.paddingRight = padding
      }
      return styles
    },
    zoomIcon(isDarkMode: boolean): CSSProperties {
      return {
        height: "40px",
        width: "40px",
        padding: "0.3em",
        filter: isDarkMode ? "invert(0)" : "invert(1)",
        animation: "inAnimation 0.5s ease-in"
      }
    },
}
