import { TagSkeleton } from '@carbon/react';
import { ReactElement } from 'react';
import classes from './TagsList.module.scss';

interface Props {
  tags: ReactElement[];
}

export function TagsList({ tags }: Props) {
  return (
    <ul className={classes.root}>
      {tags.map((tag, idx) => (
        <li key={idx}>{tag}</li>
      ))}
    </ul>
  );
}

interface SkeletonProps {
  length?: number;
}

TagsList.Skeleton = function TagsListSkeleton({ length = 1 }: SkeletonProps) {
  return (
    <div className={classes.root}>
      {Array.from({ length }).map((_, idx) => (
        <TagSkeleton key={idx} />
      ))}
    </div>
  );
};
