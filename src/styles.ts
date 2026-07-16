// [refactor] All CSS keys in this file were converted from kebab-case (e.g. "z-index",
// "border-radius") to camelCase, and the proper `CSSProperties` type is now imported instead
// of relying on the global `React` namespace. Verified output-identical (React normalizes both
// forms); the only change is the removal of React's dev-time "Unsupported style property" warnings.
import { CSSProperties } from 'react';

export const styles = {
    containerStyle: {
      width: "100%",
      height: "100%"
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
    panelContainerStyle: {
      height: "100%",
      width: "100%"
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
