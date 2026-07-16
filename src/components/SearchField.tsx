import React, { ChangeEvent } from 'react'
import { styles } from 'styles'
import { Node } from 'types'

// [refactor] Typed the component props via this interface (was `props: any`).
interface SearchFieldProps {
  onQuery: (query: string) => void;
  nodeList: Node[];
  isDarkMode: boolean;
}

export default function SearchField(props: SearchFieldProps) {

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        props.onQuery(e.target.value)
    }

    return (
      <div id="search-field" style={styles.searchFieldStyle}>
        <input placeholder="Search nodes/edges" style={styles.inputStyle(props.isDarkMode)} type="text" onChange={handleChange}/>
      </div>
    )
}
