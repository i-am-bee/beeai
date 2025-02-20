import { Container } from '@/components/layouts/Container';
import { getAgentTitle } from '@/modules/agents/utils';
import { ArrowDown } from '@carbon/icons-react';
import { IconButton } from '@carbon/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat, useChatMessages } from '../contexts';
import { AgentIcon } from './AgentIcon';
import classes from './Chat.module.scss';
import { InputBar } from './InputBar';
import { Message } from './Message';
import NewSession from './NewSession.svg';

export function Chat() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const { agent, onClear } = useChat();
  const messages = useChatMessages();

  const scrollToBottom = useCallback(() => {
    const scrollElement = scrollRef.current;

    if (!scrollElement) {
      return;
    }

    scrollElement.scrollTo({
      top: scrollElement.scrollHeight,
    });

    setIsScrolled(false);
  }, []);

  useEffect(() => {
    const bottomElement = bottomRef.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolled(!entry.isIntersecting);
      },
      { root: scrollRef.current },
    );

    if (bottomElement) {
      observer.observe(bottomElement);
    }

    return () => {
      if (bottomElement) {
        observer.unobserve(bottomElement);
      }
    };
  }, []);

  return (
    <div className={classes.root}>
      <Container size="sm" className={classes.holder}>
        <header className={classes.header}>
          <h1>
            <AgentIcon />
            {getAgentTitle(agent)}
          </h1>

          <IconButton kind="tertiary" size="sm" label="New session" onClick={onClear}>
            <NewSession />
          </IconButton>
        </header>

        <div className={classes.content} ref={scrollRef}>
          <div className={classes.scrollRef} ref={bottomRef} />

          <ol className={classes.messages} aria-label="messages">
            {messages.map((message) => (
              <Message key={message.key} message={message} />
            ))}
          </ol>
        </div>

        <div className={classes.bottom}>
          {isScrolled && (
            <IconButton
              label="Scroll to bottom"
              kind="secondary"
              size="sm"
              wrapperClasses={classes.toBottomButton}
              onClick={scrollToBottom}
              autoAlign
            >
              <ArrowDown />
            </IconButton>
          )}

          <InputBar
            onMessageSubmit={() => {
              requestAnimationFrame(() => {
                scrollToBottom();
              });
            }}
          />
        </div>
      </Container>
    </div>
  );
}
