export const styles = {
    containerStyle: {
      width: "100%",
      height: "100%"
    } as React.CSSProperties,
    labelStyle: {
      width: "100%",
      height: "100%",
      "z-index": "10",
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
        "max-width": "200px",
        "border-radius": "5px",
        opacity: 0.9
      } as React.CSSProperties,
      text(zoom: boolean) {
        return {
          color: "black",
        "font-size": (zoom) ? "5px" : "10px",
        margin: "0",
        "font-weight": "100"
        }
      },
      preface: {
        "font-weight": "900"
      } as React.CSSProperties,
    }, 
    panelContainerStyle: {
      height: "100%",
      width: "100%"
    } as React.CSSProperties,
    searchFieldStyle: {
      display: "inline-block",
      margin: "0em 1em",
      "vertical-align": "middle",
    } as React.CSSProperties,
    inputStyle(isDarkMode: boolean) {
      return {
        width: "200px",
        height: "40px",
        background: (isDarkMode) ? "rgb(244 245 245 / 83%)" : "hsla(0, 0%, 0%, 1)",
        color: (isDarkMode) ? "black" : "white",
        "border-radius": "50px",
        padding: "1em"
      }
    },
    toolBarStyle: {
      top: "10px",
      right: 0,
      position: "absolute"
    } as React.CSSProperties,
    zoomButtonStyle(isDarkMode: boolean) {
      return {
        display: "inline-block",
        margin: "0em 1em",
        "vertical-align": "middle",
        "border-radius": "50px",
        "background-color": isDarkMode ? "rgba(244, 245, 245, 0.83)" : "black"
      }
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
