import { useViewTransition } from '@/hooks/useViewTransition';
import { HTMLProps } from 'react';

interface Props extends Omit<HTMLProps<HTMLAnchorElement>, 'href'> {
  to: string;
}

export function TransitionLink({ to, children, ...props }: Props) {
  const { transitionTo } = useViewTransition();

  return (
    <a
      {...props}
      href={to}
      onClick={(e) => {
        if (to) {
          transitionTo(to);
        }
        e.preventDefault();
      }}
    >
      {children}
    </a>
  );
}
