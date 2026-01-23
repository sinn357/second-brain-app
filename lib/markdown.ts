import MarkdownIt from 'markdown-it'
import taskLists from 'markdown-it-task-lists'
import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  typographer: true,
})

markdown.enable(['table', 'strikethrough'])
markdown.use(taskLists, { enabled: true, label: true, labelAfter: true })

const turndown = new TurndownService({
  codeBlockStyle: 'fenced',
  headingStyle: 'atx',
  bulletListMarker: '-',
})

turndown.use(gfm)

export function isProbablyHtml(content: string) {
  return /<\/?[a-z][\s\S]*>/i.test(content)
}

export function markdownToHtml(content: string) {
  return markdown.render(content || '')
}

export function htmlToMarkdown(content: string) {
  const markdownContent = turndown.turndown(content || '')
  return markdownContent
    .replace(/\\\[\[/g, '[[')
    .replace(/\\\]\]/g, ']]')
}
