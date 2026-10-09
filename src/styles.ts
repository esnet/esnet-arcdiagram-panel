export const styles = {
    containerStyle: {
      width: "100%",
      height: "100%"
    } as React.CSSProperties,
    labelStyle: {
      width: "100%",
      height: "100%",
      "zIndex": "10",
    } as React.CSSProperties,
    buttonStyle: {
      width: "30px",
      height: "30px",
      top:0,
      position: "absolute"
    } as React.CSSProperties,
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
        "maxWidth": "300px",
        "borderRadius": "5px",
        opacity: 0.9
      } as React.CSSProperties,
      text(fontSize: number) {
        return {
          color: "black",
        "fontSize": `${fontSize}px`,
        margin: "0",
        "fontWeight": "100"
        }
      },
      preface: {
        "fontWeight": "900"
      } as React.CSSProperties,
    }, 
    panelContainerStyle: {
      height: "100%",
      width: "100%"
    } as React.CSSProperties,
    searchFieldStyle: {
      display: "inline-block",
      margin: "0em 1em",
      "verticalAlign": "middle",
    } as React.CSSProperties,
    inputStyle(isDarkMode: boolean) {
      return {
        width: "200px",
        height: "40px",
        background: (isDarkMode) ? "rgb(244 245 245 / 83%)" : "hsla(0, 0%, 0%, 1)",
        color: (isDarkMode) ? "black" : "white",
        padding: "1em",
        "borderRadius": "30px"
      }
    },
    toolBarStyle: {
      top: "10px",
      right: 0,
      position: "absolute"
    } as React.CSSProperties,
    zoomButtonWrapper: {
      margin: "0em 1em",
      "verticalAlign": "middle",
      display: "inline-block"
    } as React.CSSProperties,
    zoomButtonStyle(isDarkMode: boolean, position: number) {
      let styles, borderRadius = "30px", padding = "5px"
      styles = {
        display: "inline-block",
        "backgroundColor": isDarkMode ? "rgba(244, 245, 245, 0.83)" : "black",
        "border": "1px solid rgba(0, 0, 0, 0.1)",
        "cursor": "pointer",
        "transition": "all 250ms",
        "borderTopLeftRadius": "0px",
        "borderBottomLeftRadius": "0px",
        "borderTopRightRadius": "0px",
        "borderBottomRightRadius": "0px",
        "paddingLeft": padding,
        "paddingRight": padding
      }
      if(position === 0) {
        styles["borderTopLeftRadius"] = borderRadius
        styles["borderBottomLeftRadius"] = borderRadius
        styles["paddingLeft"] = padding
      } else if (position === 2) {
        styles["borderTopRightRadius"] = borderRadius
        styles["borderBottomRightRadius"] = borderRadius
        styles["paddingRight"] = padding
      }
      return styles
    },
    zoomIcon(isDarkMode: boolean) {
      return {
        height: "40px",
        width: "40px",
        padding: "0.3em",
        filter: isDarkMode ? "invert(0)" : "invert(1)",
        animation: "inAnimation 0.5s ease-in"
      }
    },
}
