import { visit } from 'unist-util-visit'

export function remarkCustomDirectives() {
  return (tree: any) => {
    visit(tree, (node) => {
      if (
        node.type === 'textDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'containerDirective'
      ) {
        if (node.name !== 'youtube' && node.name !== 'twitter') {
          const data = node.data || (node.data = {})
          const tagName = node.type === 'textDirective' ? 'span' : 'div'
          
          data.hName = tagName
          data.hProperties = {
            ...node.attributes,
            className: ['directive', `directive-${node.name}`, ...(node.attributes?.className || [])].join(' ')
          }

          if (node.type === 'containerDirective') {
            const title = node.attributes?.title || node.name.charAt(0).toUpperCase() + node.name.slice(1)
            
            // 检查是否已注入
            const hasInjectedTitle = node.children.length > 0 && 
              node.children[0].data?.hProperties?.className === 'directive-title'

            if (!hasInjectedTitle) {
              node.children.unshift({
                type: 'paragraph',
                data: {
                  hName: 'div',
                  hProperties: { className: 'directive-title' }
                },
                children: [{ type: 'text', value: title }]
              })
            }
          }
        }
      }
    })
  }
}

