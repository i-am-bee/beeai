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

import { MainContent } from '@/layouts/MainContent';
import { GettingStarted, type VideoBeeAIProps } from '@i-am-bee/beeai-ui';
import poster from '../images/VideoBeeAIPoster.webp';

export default function Home() {
  return (
    <MainContent>
      <GettingStarted video={video} />
    </MainContent>
  );
}

const video: VideoBeeAIProps = {
  src: 'https://github.com/user-attachments/assets/10640dbd-631c-42d8-a246-9b7a72eddb5b',
  type: 'video/mp4',
  poster: poster.src,
};
