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
      text: {
        color: "black",
        "font-size": "10px",
        margin: "0",
        "font-weight": "100"
      } as React.CSSProperties,
      preface: {
        "font-weight": "900"
      } as React.CSSProperties,
    } 
}