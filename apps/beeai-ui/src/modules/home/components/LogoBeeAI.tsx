/**
 * Copyright 2025 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Logo from '#svgs/LogoBeeAI.svg';
import clsx from 'clsx';
import { lazy, useState } from 'react';
import animationData from './LogoBeeAI.json';
import classes from './LogoBeeAI.module.scss';

// Needs to be lazily loaded due to an error when used with Next.js https://github.com/Gamote/lottie-react/issues/123
const Lottie = lazy(() => import('lottie-react'));

export function LogoBeeAI() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={clsx(classes.container, { [classes.loaded]: loaded })}>
      <div className={classes.placeholder}>
        <Logo />
      </div>

      <Lottie
        className={classes.animation}
        animationData={animationData}
        loop={false}
        onDOMLoaded={() => {
          setLoaded(true);
        }}
      />
    </div>
  );
}
