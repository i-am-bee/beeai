import { Root } from 'hast';
import { visit } from 'unist-util-visit';

export function rehypeCarbonLists() {
  // we cannot use `usePrefix` obviously but this doesn't change anyway
  const prefix = 'cds';
  return (tree: Root) => {
    visit(tree, (node, _, parent) => {
      if (node.type !== 'element') return;

      if (node.tagName === 'li') {
        node.properties.className = `${prefix}--list__item`;
      }

      if (node.tagName === 'ul' || node.tagName === 'ol') {
        let className = node.tagName === 'ul' ? `${prefix}--list--unordered` : `${prefix}--list--ordered--native`;
        const isNested = parent?.type === 'element' && parent.tagName === 'li';
        if (isNested) {
          className += ` ${prefix}--list--nested`;
        }
        node.properties.className = className;
      }
    });
  };
}
