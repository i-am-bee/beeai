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

import { useState } from 'react';
import Lottie from 'lottie-react';
import clsx from 'clsx';
import Logo from '#svgs/LogoBeeAI.svg';
import animationData from './LogoBeeAI.json';
import classes from './LogoBeeAI.module.scss';

export function LogoBeeAI() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={clsx(classes.container, { [classes.loaded]: loaded })}>
      <Logo className={classes.placeholder} />
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
