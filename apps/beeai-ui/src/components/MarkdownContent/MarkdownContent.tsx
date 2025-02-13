import Markdown from 'react-markdown';
import classes from './MarkdownContent.module.scss';
import clsx from 'clsx';
import { rehypeCarbonLists } from './plugins/rehypeCarbonLists';
import { PluggableList } from 'unified';

interface Props {
  children?: string;
  className?: string;
}

export function MarkdownContent({ className, children }: Props) {
  return (
    <Markdown rehypePlugins={REHYPE_PLUGINS} className={clsx(classes.root, className)}>
      {children}
    </Markdown>
  );
}

const REHYPE_PLUGINS = [rehypeCarbonLists] satisfies PluggableList;
