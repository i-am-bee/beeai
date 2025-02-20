import { routes } from '@/utils/router';
import { UIEventHandler, useCallback, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { ToTopButton } from '../ToTopButton/ToTopButton';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import classes from './AppLayout.module.scss';

const SCROLLED_OFFSET = 48;

export function AppLayout() {
  const mainRef = useRef<HTMLElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const { pathname } = useLocation();
  const isHomeRoute = pathname === routes.home();
  const isAgentsRoute = pathname === routes.agents();

  const handleScroll: UIEventHandler = useCallback((event) => {
    const { scrollTop } = event.currentTarget;

    setIsScrolled(scrollTop > SCROLLED_OFFSET);
  }, []);

  const handleToTopClick = useCallback(() => {
    const mainElement = mainRef.current;

    if (mainElement) {
      mainElement.scrollTo({ top: 0 });
    }
  }, []);

  return (
    <div className={classes.root}>
      <AppHeader className={classes.header} showCommunityNav={!isHomeRoute} />

      <main ref={mainRef} className={classes.main} onScroll={handleScroll}>
        <Outlet />

        {isAgentsRoute && isScrolled && <ToTopButton onClick={handleToTopClick} />}
      </main>

      {isHomeRoute && <AppFooter className={classes.footer} />}
    </div>
  );
}
