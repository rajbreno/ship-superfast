# @convex-dev/persistent-text-streaming

Stream text like AI chat to the browser in real-time while also efficiently storing it to the database.

## Install

```bash
npm install @convex-dev/persistent-text-streaming
```

## Links

- [npm package](https://www.npmjs.com/package/%40convex-dev%2Fpersistent-text-streaming)
- [GitHub repository](https://github.com/get-convex/persistent-text-streaming)
- [Convex Components Directory](https://www.convex.dev/components/persistent-text-streaming)

**Author:** get-convex

**Category:** AI

**Version:** 0.3.0  
**Weekly downloads:** 13,867

---

> Stream AI-generated text to users in real-time while automatically persisting it to your Convex database for efficient storage and retrieval.

## Benefits

- Stream text chunks to the browser as they're generated without blocking database writes
- Automatically persist streaming content to Convex with built-in deduplication and ordering
- Handle connection interruptions gracefully with resumable streaming from last saved state
- Reduce perceived latency by showing content immediately while ensuring data consistency

## Use cases

### how to stream AI chat responses while saving to database

Persistent Text Streaming handles both real-time streaming and database persistence simultaneously. It streams text chunks to your frontend as they arrive from your AI provider while queuing database writes in the background, ensuring users see responses immediately without losing data if connections fail.

### stream OpenAI GPT responses to React with database storage

The component integrates with OpenAI's streaming API and Convex mutations to display chat responses in real-time. It provides React hooks that consume streaming text while automatically batching and persisting chunks to your Convex database with proper ordering and deduplication.

### handle streaming text with connection failures and resume

Persistent Text Streaming tracks streaming progress in your Convex database, allowing interrupted streams to resume from the last successfully saved chunk. If a user's connection drops, they can reconnect and continue receiving the stream from where it left off without losing content.

## FAQ

**Q: Does this work with any AI streaming API?**

Persistent Text Streaming works with any text streaming source that provides chunks sequentially, including OpenAI, Anthropic, and other AI APIs. The component handles the streaming protocol while you provide the text generation logic through Convex actions or mutations.

**Q: How does it handle database write performance during streaming?**

The component batches text chunks and uses optimized Convex mutations to minimize database writes while maintaining real-time streaming performance. It queues chunks in memory and persists them efficiently without blocking the streaming UI updates.

**Q: Can users see partial responses if the stream is interrupted?**

Yes, Persistent Text Streaming saves chunks to your Convex database as they arrive, so users always see the content generated before any interruption. When reconnecting, they'll see the previously streamed content and continue from where the stream stopped.

**Q: Does this component handle multiple concurrent streams?**

Persistent Text Streaming supports multiple concurrent streams by using unique stream identifiers stored in your Convex database. Each stream maintains its own state, progress tracking, and persistence queue without interfering with other active streams.

---

This Convex component enables persistent text streaming. It provides a React hook for streaming text from HTTP actions while simultaneously storing the data in the database. This persistence allows the text to be accessed after the stream ends or by other users.

The most common use case is for AI chat applications. The example app (found in the example directory) is a just such a simple chat app that demonstrates use of the component.

## Resources

- [npm package](https://www.npmjs.com/package/%40convex-dev%2Fpersistent-text-streaming)
- [GitHub repository](https://github.com/get-convex/persistent-text-streaming)
- [Convex Components Directory](https://www.convex.dev/components/persistent-text-streaming)
- [Convex documentation](https://docs.convex.dev)


---

[![Convex Component](https://www.convex.dev/components/badge/persistent-text-streaming)](https://www.convex.dev/components/persistent-text-streaming)