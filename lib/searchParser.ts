export interface ParsedQuery {
  text: string
  tags: string[]
  paths: string[]
  files: string[]
}

export function parseSearchQuery(query: string): ParsedQuery {
  const result: ParsedQuery = { text: '', tags: [], paths: [], files: [] }

  const operatorRegex = /(tag|path|file):(\S+)/gi
  let match: RegExpExecArray | null
  let remaining = query

  while ((match = operatorRegex.exec(query)) !== null) {
    const [full, operator, value] = match
    remaining = remaining.replace(full, '')

    switch (operator.toLowerCase()) {
      case 'tag':
        result.tags.push(value)
        break
      case 'path':
        result.paths.push(value)
        break
      case 'file':
        result.files.push(value)
        break
      default:
        break
    }
  }

  result.text = remaining.trim()
  return result
}
