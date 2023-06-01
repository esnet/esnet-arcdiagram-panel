import React, { ChangeEvent } from 'react'
import { styles } from 'styles'

export default function SearchField(props: any) {

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        props.onQuery(e.target.value)
    }

    return (
      <div id="search-field" style={styles.searchFieldStyle}>
        <input placeholder="Search nodes/edges" style={styles.inputStyle(props.isDarkMode)} type="text" onChange={handleChange}/>
      </div>
    )
}
