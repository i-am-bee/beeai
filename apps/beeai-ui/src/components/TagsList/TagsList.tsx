import { TagSkeleton } from '@carbon/react';
import clsx from 'clsx';
import { ReactElement } from 'react';
import classes from './TagsList.module.scss';

interface Props {
  tags: ReactElement[];
  className?: string;
}

export function TagsList({ tags, className }: Props) {
  return (
    <ul className={clsx(classes.root, className)}>
      {tags.map((tag, idx) => (
        <li key={idx}>{tag}</li>
      ))}
    </ul>
  );
}

interface SkeletonProps {
  length?: number;
  className?: string;
}

TagsList.Skeleton = function TagsListSkeleton({ length = 1, className }: SkeletonProps) {
  return (
    <div className={clsx(classes.root, className)}>
      {Array.from({ length }).map((_, idx) => (
        <TagSkeleton key={idx} />
      ))}
    </div>
  );
};
