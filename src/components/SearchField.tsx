import React, { ChangeEvent } from 'react'
import { cssStyles, styles } from 'styles'
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
      // [refactor] The `#search-field` id and its stylesheet rules were replaced by scoped Emotion
      // classes. The placeholder color in particular used to be an unscoped `input::placeholder`
      // rule, so it restyled every input on the Grafana page rather than just this one.
      <div className={cssStyles.searchField} style={styles.searchFieldStyle}>
        <input className={cssStyles.searchInput} placeholder="Search nodes/edges" style={styles.inputStyle(props.isDarkMode)} type="text" onChange={handleChange}/>
      </div>
    )
}
