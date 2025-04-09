/**
 * Copyright 2025 © BeeAI a Series of LF Projects, LLC
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

import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { mergeRefs } from 'react-merge-refs';
import { useIntersectionObserver } from 'usehooks-ts';

import { PlayButton } from './PlayButton';
import classes from './VideoBeeAI.module.scss';

export interface VideoBeeAIProps {
  src: string;
  type: string;
  poster: string;
}

export function VideoBeeAI({ src, type, poster }: VideoBeeAIProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playedOnce, setPlayedOnce] = useState(false);

  const play = (event: React.SyntheticEvent) => {
    if (playedOnce || !videoRef.current) {
      return;
    }

    event.preventDefault();
    setPlayedOnce(true);
    videoRef.current.play();
    videoRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  const { isIntersecting, ref: intersectionRef } = useIntersectionObserver({
    threshold: AUTOPLAY_INTERSECTION_THRESHOLD,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video || playedOnce) return;

    if (isIntersecting) {
      video
        .play()
        .catch((err) => console.error('Video play error:', err))
        .then(() => {
          setPlayedOnce(true);
        });
    } else {
      video.pause();
    }
  }, [isIntersecting, playedOnce]);

  return (
    <div className={clsx(classes.container, { [classes.playedOnce]: playedOnce })}>
      <div
        className={classes.videoContainer}
        tabIndex={playedOnce ? -1 : 0}
        onClick={play}
        onKeyUp={
          playedOnce
            ? undefined
            : (event) => {
                if (event.code === 'Enter' || event.code === 'Space') {
                  play(event);
                  event.currentTarget.blur();
                }
              }
        }
      >
        {!playedOnce && <PlayButton className={classes.play} />}
        <video
          ref={mergeRefs([videoRef, intersectionRef])}
          poster={poster}
          className={classes.video}
          controls={playedOnce}
          muted
        >
          <source src={src} type={type} />
        </video>
      </div>
    </div>
  );
}

const AUTOPLAY_INTERSECTION_THRESHOLD = 0.75;
