import clsx from 'clsx';
import Markdown from 'react-markdown';
import { PluggableList } from 'unified';
import classes from './MarkdownContent.module.scss';

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

const REHYPE_PLUGINS = [] satisfies PluggableList;
