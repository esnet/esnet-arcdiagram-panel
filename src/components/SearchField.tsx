import React, { ChangeEvent } from 'react'
import { styles } from 'styles'

export default function SearchField(props: any) {

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        props.onQuery(e.target.value)
    }

    return (
      <div style={styles.searchFieldStyle}>
        <input style={styles.inputStyle} type="text" name="name" onChange={handleChange}/>
      </div>
    )
}
