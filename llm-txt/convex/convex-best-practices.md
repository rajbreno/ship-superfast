# Best Practices

This is a list of best practices and common anti-patterns around using Convex. We recommend going through this list before broadly releasing your app to production. You may choose to try using all of these best practices from the start, or you may wait until you've gotten major parts of your app working before going through and adopting the best practices here.

## Await all Promises[​](#await-all-promises "Direct link to Await all Promises")

### Why?[​](#why "Direct link to Why?")

Convex functions use async / await. If you don't await all your promises (e.g. `await ctx.scheduler.runAfter`, `await ctx.db.patch`), you may run into unexpected behavior (e.g. failing to schedule a function) or miss handling errors.

### How?[​](#how "Direct link to How?")

We recommend the [no-floating-promises](https://typescript-eslint.io/rules/no-floating-promises/) eslint rule with TypeScript.

## Avoid `.filter` on database queries[​](#avoid-filter-on-database-queries "Direct link to avoid-filter-on-database-queries")

### Why?[​](#why-1 "Direct link to Why?")

Filtering in code instead of using the `.filter` syntax has the same performance, and is generally easier code to write. Conditions in `.withIndex` or `.withSearchIndex` are more efficient than `.filter` or filtering in code, so almost all uses of `.filter` should either be replaced with a `.withIndex` or `.withSearchIndex` condition, or written as TypeScript code.

Read through the [indexes documentation](/database/reading-data/indexes/indexes-and-query-perf.md) for an overview of how to define indexes and how they work.

### Examples[​](#examples "Direct link to Examples")

convex/messages.ts

TS

```
// ❌
const tomsMessages = ctx.db
  .query("messages")
  .filter((q) => q.eq(q.field("author"), "Tom"))
  .collect();

// ✅
// Option 1: Use an index
const tomsMessages = await ctx.db
  .query("messages")
  .withIndex("by_author", (q) => q.eq("author", "Tom"))
  .collect();

// Option 2: Filter in code
const allMessages = await ctx.db.query("messages").collect();
const tomsMessages = allMessages.filter((m) => m.author === "Tom");
```

### How?[​](#how-1 "Direct link to How?")

Search for `.filter` in your Convex codebase — a regex like `\.filter\(\(?q` will probably find all the ones on database queries.

Decide whether they should be replaced with a `.withIndex` condition — per [this section](/understanding/best-practices.md#only-use-collect-with-a-small-number-of-results), if you are filtering over a large (1000+) or potentially unbounded number of documents, you should use an index. If not using a `.withIndex` / `.withSearchIndex` condition, consider replacing them with a filter in code for more readability and flexibility.

See [this article](https://stack.convex.dev/complex-filters-in-convex) for more strategies for filtering.

### Exceptions[​](#exceptions "Direct link to Exceptions")

Using `.filter` on a paginated query (`.paginate`) has advantages over filtering in code. The paginated query will return the number of documents requested, including the `.filter` condition, so filtering in code afterwards can result in a smaller page or even an empty page. Using `.withIndex` on a paginated query will still be more efficient than a `.filter`.

## Only use `.collect` with a small number of results[​](#only-use-collect-with-a-small-number-of-results "Direct link to only-use-collect-with-a-small-number-of-results")

### Why?[​](#why-2 "Direct link to Why?")

All results returned from `.collect` count towards database bandwidth (even ones filtered out by `.filter`). It also means that if any document in the result changes, the query will re-run or the mutation will hit a conflict.

If there's a chance the number of results is large (say 1000+ documents), you should use an index to filter the results further before calling `.collect`, or find some other way to avoid loading all the documents such as using pagination, denormalizing data, or changing the product feature.

### Example[​](#example "Direct link to Example")

**Using an index:**

convex/movies.ts

TS

```
// ❌ -- potentially unbounded
const allMovies = await ctx.db.query("movies").collect();
const moviesByDirector = allMovies.filter(
  (m) => m.director === "Steven Spielberg",
);

// ✅ -- small number of results, so `collect` is fine
const moviesByDirector = await ctx.db
  .query("movies")
  .withIndex("by_director", (q) => q.eq("director", "Steven Spielberg"))
  .collect();
```

**Using pagination:**

convex/movies.ts

TS

```
// ❌ -- potentially unbounded
const watchedMovies = await ctx.db
  .query("watchedMovies")
  .withIndex("by_user", (q) => q.eq("user", "Tom"))
  .collect();

// ✅ -- using pagination, showing recently watched movies first
const watchedMovies = await ctx.db
  .query("watchedMovies")
  .withIndex("by_user", (q) => q.eq("user", "Tom"))
  .order("desc")
  .paginate(paginationOptions);
```

**Using a limit or denormalizing:**

convex/movies.ts

TS

```
// ❌ -- potentially unbounded
const watchedMovies = await ctx.db
  .query("watchedMovies")
  .withIndex("by_user", (q) => q.eq("user", "Tom"))
  .collect();
const numberOfWatchedMovies = watchedMovies.length;

// ✅ -- Show "99+" instead of needing to load all documents
const watchedMovies = await ctx.db
  .query("watchedMovies")
  .withIndex("by_user", (q) => q.eq("user", "Tom"))
  .take(100);
const numberOfWatchedMovies =
  watchedMovies.length === 100 ? "99+" : watchedMovies.length.toString();

// ✅ -- Denormalize the number of watched movies in a separate table
const watchedMoviesCount = await ctx.db
  .query("watchedMoviesCount")
  .withIndex("by_user", (q) => q.eq("user", "Tom"))
  .unique();
```

### How?[​](#how-2 "Direct link to How?")

Search for `.collect` in your Convex codebase (a regex like `\.collect\(` will probably find these). And think through whether the number of results is small. This function health page in the dashboard can also help surface these.

The [aggregate component](https://www.npmjs.com/package/@convex-dev/aggregate) or [database triggers](https://stack.convex.dev/triggers) can be helpful patterns for denormalizing data.

### Exceptions[​](#exceptions-1 "Direct link to Exceptions")

If you're doing something that requires loading a large number of documents (e.g. performing a migration, making a summary), you may want to use an action to load them in batches via separate queries / mutations.

## Check for redundant indexes[​](#check-for-redundant-indexes "Direct link to Check for redundant indexes")

### Why?[​](#why-3 "Direct link to Why?")

Indexes like `by_foo` and `by_foo_and_bar` are usually redundant (you only need `by_foo_and_bar`). Reducing the number of indexes saves on database storage and reduces the overhead of writing to the table.

convex/teams.ts

TS

```
// ❌
const allTeamMembers = await ctx.db
  .query("teamMembers")
  .withIndex("by_team", (q) => q.eq("team", teamId))
  .collect();
const currentUserId = /* get current user id from `ctx.auth` */
const currentTeamMember = await ctx.db
  .query("teamMembers")
  .withIndex("by_team_and_user", (q) =>
    q.eq("team", teamId).eq("user", currentUserId),
  )
  .unique();

// ✅
// Just don't include a condition on `user` when querying for results on `team`
const allTeamMembers = await ctx.db
  .query("teamMembers")
  .withIndex("by_team_and_user", (q) => q.eq("team", teamId))
  .collect();
const currentUserId = /* get current user id from `ctx.auth` */
const currentTeamMember = await ctx.db
  .query("teamMembers")
  .withIndex("by_team_and_user", (q) =>
    q.eq("team", teamId).eq("user", currentUserId),
  )
  .unique();
```

### How?[​](#how-3 "Direct link to How?")

Look through your indexes, either in your `schema.ts` file or in the dashboard, and look for any indexes where one is a prefix of another.

### Exceptions[​](#exceptions-2 "Direct link to Exceptions")

`.index("by_foo", ["foo"])` is really an index on the properties `foo` and `_creationTime`, while `.index("by_foo_and_bar", ["foo", "bar"])` is an index on the properties `foo`, `bar`, and `_creationTime`. If you have queries that need to be sorted by `foo` and then `_creationTime`, then you need both indexes.

For example, `.index("by_channel", ["channel"])` on a table of messages can be used to query for the most recent messages in a channel, but `.index("by_channel_and_author", ["channel", "author"])` could not be used for this since it would first sort the messages by `author`.

## Use argument validators for all public functions[​](#use-argument-validators-for-all-public-functions "Direct link to Use argument validators for all public functions")

### Why?[​](#why-4 "Direct link to Why?")

Public functions can be called by anyone, including potentially malicious attackers trying to break your app. [Argument validators](/functions/validation.md) (as well as return value validators) help ensure you're getting the traffic you expect.

### Example[​](#example-1 "Direct link to Example")

convex/messages.ts

TS

```
// ❌ -- could be used to update any document (not just `messages`)
export const updateMessage = mutation({
  handler: async (ctx, { id, update }) => {
    await ctx.db.patch(id, update);
  },
});

// ✅ -- can only be called with an ID from the messages table, and can only update
// the `body` and `author` fields
export const updateMessage = mutation({
  args: {
    id: v.id("messages"),
    update: v.object({
      body: v.optional(v.string()),
      author: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { id, update }) => {
    await ctx.db.patch(id, update);
  },
});
```

### How?[​](#how-4 "Direct link to How?")

Search for `query`, `mutation`, and `action` in your Convex codebase, and ensure that all of them have argument validators (and optionally return value validators). If you have `httpAction`s, you may want to use something like `zod` to validate that the HTTP request is the shape you expect.

## Use some form of access control for all public functions[​](#use-some-form-of-access-control-for-all-public-functions "Direct link to Use some form of access control for all public functions")

### Why?[​](#why-5 "Direct link to Why?")

Public functions can be called by anyone, including potentially malicious attackers trying to break your app. If portions of your app should only be accessible when the user is signed in, make sure all these Convex functions check that `ctx.auth.getUserIdentity()` is set.

You may also have specific checks, like only loading messages that were sent to or from the current user, which you'll want to apply in every relevant public function.

Favoring more granular functions like `setTeamOwner` over `updateTeam` allows more granular checks for which users can do what.

Access control checks should either use `ctx.auth.getUserIdentity()` or a function argument that is unguessable (e.g. a UUID, or a Convex ID, provided that this ID is never exposed to any client but the one user). In particular, don't use a function argument which could be spoofed (e.g. email) for access control checks.

### Example[​](#example-2 "Direct link to Example")

convex/teams.ts

TS

```
// ❌ -- no checks! anyone can update any team if they get the ID
export const updateTeam = mutation({
  args: {
    id: v.id("teams"),
    update: v.object({
      name: v.optional(v.string()),
      owner: v.optional(v.id("users")),
    }),
  },
  handler: async (ctx, { id, update }) => {
    await ctx.db.patch(id, update);
  },
});

// ❌ -- checks access, but uses `email` which could be spoofed
export const updateTeam = mutation({
  args: {
    id: v.id("teams"),
    update: v.object({
      name: v.optional(v.string()),
      owner: v.optional(v.id("users")),
    }),
    email: v.string(),
  },
  handler: async (ctx, { id, update, email }) => {
    const teamMembers = /* load team members */
    if (!teamMembers.some((m) => m.email === email)) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(id, update);
  },
});

// ✅ -- checks access, and uses `ctx.auth`, which cannot be spoofed
export const updateTeam = mutation({
  args: {
    id: v.id("teams"),
    update: v.object({
      name: v.optional(v.string()),
      owner: v.optional(v.id("users")),
    }),
  },
  handler: async (ctx, { id, update }) => {
    const user = await ctx.auth.getUserIdentity();
    if (user === null) {
      throw new Error("Unauthorized");
    }
    const isTeamMember = /* check if user is a member of the team */
    if (!isTeamMember) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(id, update);
  },
});

// ✅ -- separate functions which have different access control
export const setTeamOwner = mutation({
  args: {
    id: v.id("teams"),
    owner: v.id("users"),
  },
  handler: async (ctx, { id, owner }) => {
    const user = await ctx.auth.getUserIdentity();
    if (user === null) {
      throw new Error("Unauthorized");
    }
    const isTeamOwner = /* check if user is the owner of the team */
    if (!isTeamOwner) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(id, { owner: owner });
  },
});

export const setTeamName = mutation({
  args: {
    id: v.id("teams"),
    name: v.string(),
  },
  handler: async (ctx, { id, name }) => {
    const user = await ctx.auth.getUserIdentity();
    if (user === null) {
      throw new Error("Unauthorized");
    }
    const isTeamMember = /* check if user is a member of the team */
    if (!isTeamMember) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(id, { name: name });
  },
});
```

### How?[​](#how-5 "Direct link to How?")

Search for `query`, `mutation`, `action`, and `httpAction` in your Convex codebase, and ensure that all of them have some form of access control. [Custom functions](https://github.com/get-convex/convex-helpers/blob/main/packages/convex-helpers/README.md#custom-functions) like [`authenticatedQuery`](https://stack.convex.dev/custom-functions#modifying-the-ctx-argument-to-a-server-function-for-user-auth) can be helpful.

Some apps use Row Level Security (RLS) to check access to each document automatically whenever it's loaded, as described in [this article](https://stack.convex.dev/row-level-security). Alternatively, you can check access in each Convex function instead of checking access for each document.

Helper functions for common checks and common operations can also be useful -- e.g. `isTeamMember`, `isTeamAdmin`, `loadTeam` (which throws if the current user does not have access to the team).

## Only schedule and `ctx.run*` internal functions[​](#only-schedule-and-ctxrun-internal-functions "Direct link to only-schedule-and-ctxrun-internal-functions")

### Why?[​](#why-6 "Direct link to Why?")

Public functions can be called by anyone, including potentially malicious attackers trying to break your app, and should be carefully audited to ensure they can't be used maliciously. Functions that are only called within Convex can be marked as internal, and relax these checks since Convex will ensure that internal functions can only be called within Convex.

### How?[​](#how-6 "Direct link to How?")

Search for `ctx.runQuery`, `ctx.runMutation`, and `ctx.runAction` in your Convex codebase. Also search for `ctx.scheduler` and check the `crons.ts` file. Ensure all of these use `internal.foo.bar` functions instead of `api.foo.bar` functions.

If you have code you want to share between a public Convex function and an internal Convex function, create a helper function that can be called from both. The public function will likely have additional access control checks.

Alternatively, make sure that `api` from `_generated/api.ts` is never used in your Convex functions directory.

### Examples[​](#examples-1 "Direct link to Examples")

convex/teams.ts

TS

```
// ❌ -- using `api`
export const sendMessage = mutation({
  args: {
    body: v.string(),
    author: v.string(),
  },
  handler: async (ctx, { body, author }) => {
    // add message to the database
  },
});

// crons.ts
crons.daily(
  "send daily reminder",
  { hourUTC: 17, minuteUTC: 30 },
  api.messages.sendMessage,
  { author: "System", body: "Share your daily update!" },
);

// ✅ Using `internal`
import { MutationCtx } from './_generated/server';
async function sendMessageHelper(
  ctx: MutationCtx,
  args: { body: string; author: string },
) {
  // add message to the database
}

export const sendMessage = mutation({
  args: {
    body: v.string(),
  },
  handler: async (ctx, { body }) => {
    const user = await ctx.auth.getUserIdentity();
    if (user === null) {
      throw new Error("Unauthorized");
    }
    await sendMessageHelper(ctx, { body, author: user.name ?? "Anonymous" });
  },
});

export const sendInternalMessage = internalMutation({
  args: {
    body: v.string(),
    // don't need to worry about `author` being spoofed since this is an internal function
    author: v.string(),
  },
  handler: async (ctx, { body, author }) => {
    await sendMessageHelper(ctx, { body, author });
  },
});

// crons.ts
crons.daily(
  "send daily reminder",
  { hourUTC: 17, minuteUTC: 30 },
  internal.messages.sendInternalMessage,
  { author: "System", body: "Share your daily update!" },
);
```

## Use helper functions to write shared code[​](#use-helper-functions-to-write-shared-code "Direct link to Use helper functions to write shared code")

### Why?[​](#why-7 "Direct link to Why?")

Most logic should be written as plain TypeScript functions, with the `query`, `mutation`, and `action` wrapper functions being a thin wrapper around one or more helper function.

Concretely, most of your code should live in a directory like `convex/model`, and your public API, which is defined with `query`, `mutation`, and `action`, should have very short functions that mostly just call into `convex/model`.

Organizing your code this way makes several of the refactors mentioned in this list easier to do.

See the [TypeScript page](/understanding/best-practices/typescript.md) for useful types.

### Example[​](#example-3 "Direct link to Example")

**❌** This example overuses `ctx.runQuery` and `ctx.runMutation`, which is discussed more in the [Avoid sequential `ctx.runMutation` / `ctx.runQuery` from actions](/understanding/best-practices.md#avoid-sequential-ctxrunmutation--ctxrunquery-calls-from-actions) section.

convex/users.ts

TS

```
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userIdentity = await ctx.auth.getUserIdentity();
    if (userIdentity === null) {
      throw new Error("Unauthorized");
    }
    const user = /* query ctx.db to load the user */
    const userSettings = /* load other documents related to the user */
    return { user, settings: userSettings };
  },
});
```

convex/conversations.ts

TS

```
export const listMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, { conversationId }) => {
    const user = await ctx.runQuery(api.users.getCurrentUser);
    const conversation = await ctx.db.get(conversationId);
    if (conversation === null || !conversation.members.includes(user._id)) {
      throw new Error("Unauthorized");
    }
    const messages = /* query ctx.db to load the messages */
    return messages;
  },
});

export const summarizeConversation = action({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, { conversationId }) => {
    const messages = await ctx.runQuery(api.conversations.listMessages, {
      conversationId,
    });
    const summary = /* call some external service to summarize the conversation */
    await ctx.runMutation(api.conversations.addSummary, {
      conversationId,
      summary,
    });
  },
});
```

**✅** Most of the code here is now in the `convex/model` directory. The API for this application is in `convex/conversations.ts`, which contains very little code itself.

convex/model/users.ts

TS

```
import { QueryCtx } from '../_generated/server';

export async function getCurrentUser(ctx: QueryCtx) {
  const userIdentity = await ctx.auth.getUserIdentity();
  if (userIdentity === null) {
    throw new Error("Unauthorized");
  }
  const user = /* query ctx.db to load the user */
  const userSettings = /* load other documents related to the user */
  return { user, settings: userSettings };
}
```

convex/model/conversations.ts

TS

```
import { QueryCtx, MutationCtx } from '../_generated/server';
import * as Users from './users';

export async function ensureHasAccess(
  ctx: QueryCtx,
  { conversationId }: { conversationId: Id<"conversations"> },
) {
  const user = await Users.getCurrentUser(ctx);
  const conversation = await ctx.db.get(conversationId);
  if (conversation === null || !conversation.members.includes(user._id)) {
    throw new Error("Unauthorized");
  }
  return conversation;
}

export async function listMessages(
  ctx: QueryCtx,
  { conversationId }: { conversationId: Id<"conversations"> },
) {
  await ensureHasAccess(ctx, { conversationId });
  const messages = /* query ctx.db to load the messages */
  return messages;
}

export async function addSummary(
  ctx: MutationCtx,
  {
    conversationId,
    summary,
  }: { conversationId: Id<"conversations">; summary: string },
) {
  await ensureHasAccess(ctx, { conversationId });
  await ctx.db.patch(conversationId, { summary });
}

export async function generateSummary(
  messages: Doc<"messages">[],
  conversationId: Id<"conversations">,
) {
  const summary = /* call some external service to summarize the conversation */
  return summary;
}
```

convex/conversations.ts

TS

```
import * as Conversations from './model/conversations';

export const addSummary = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    summary: v.string(),
  },
  handler: async (ctx, { conversationId, summary }) => {
    await Conversations.addSummary(ctx, { conversationId, summary });
  },
});

export const listMessages = internalQuery({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, { conversationId }) => {
    return Conversations.listMessages(ctx, { conversationId });
  },
});

export const summarizeConversation = action({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, { conversationId }) => {
    const messages = await ctx.runQuery(internal.conversations.listMessages, {
      conversationId,
    });
    const summary = await Conversations.generateSummary(
      messages,
      conversationId,
    );
    await ctx.runMutation(internal.conversations.addSummary, {
      conversationId,
      summary,
    });
  },
});
```

## Use `runAction` only when using a different runtime[​](#use-runaction-only-when-using-a-different-runtime "Direct link to use-runaction-only-when-using-a-different-runtime")

### Why?[​](#why-8 "Direct link to Why?")

Calling `runAction` has more overhead than calling a plain TypeScript function. It counts as an extra function call with its own memory and CPU usage, while the parent action is doing nothing except waiting for the result. Therefore, `runAction` should almost always be replaced with calling a plain TypeScript function. However, if you want to call code that requires Node.js from a function in the Convex runtime (e.g. using a library that requires Node.js), then you can use `runAction` to call the Node.js code.

### Example[​](#example-4 "Direct link to Example")

convex/scrape.ts

TS

```
// ❌ -- using `runAction`
export const scrapeWebsite = action({
  args: {
    siteMapUrl: v.string(),
  },
  handler: async (ctx, { siteMapUrl }) => {
    const siteMap = await fetch(siteMapUrl);
    const pages = /* parse the site map */
    await Promise.all(
      pages.map((page) =>
        ctx.runAction(internal.scrape.scrapeSinglePage, { url: page }),
      ),
    );
  },
});
```

convex/model/scrape.ts

TS

```
import { ActionCtx } from '../_generated/server';

// ✅ -- using a plain TypeScript function
export async function scrapeSinglePage(
  ctx: ActionCtx,
  { url }: { url: string },
) {
  const page = await fetch(url);
  const text = /* parse the page */
  await ctx.runMutation(internal.scrape.addPage, { url, text });
}
```

convex/scrape.ts

TS

```
import * as Scrape from './model/scrape';

export const scrapeWebsite = action({
  args: {
    siteMapUrl: v.string(),
  },
  handler: async (ctx, { siteMapUrl }) => {
    const siteMap = await fetch(siteMapUrl);
    const pages = /* parse the site map */
    await Promise.all(
      pages.map((page) => Scrape.scrapeSinglePage(ctx, { url: page })),
    );
  },
});
```

### How?[​](#how-7 "Direct link to How?")

Search for `runAction` in your Convex codebase, and see if the function it calls uses the same runtime as the parent function. If so, replace the `runAction` with a plain TypeScript function. You may want to structure your functions so the Node.js functions are in a separate directory so it's easier to spot these.

## Avoid sequential `ctx.runMutation` / `ctx.runQuery` calls from actions[​](#avoid-sequential-ctxrunmutation--ctxrunquery-calls-from-actions "Direct link to avoid-sequential-ctxrunmutation--ctxrunquery-calls-from-actions")

### Why?[​](#why-9 "Direct link to Why?")

Each `ctx.runMutation` or `ctx.runQuery` runs in its own transaction, which means if they're called separately, they may not be consistent with each other. If instead we call a single `ctx.runQuery` or `ctx.runMutation`, we're guaranteed that the results we get are consistent.

### How?[​](#how-8 "Direct link to How?")

Audit your calls to `ctx.runQuery` and `ctx.runMutation` in actions. If you see multiple in a row with no other code between them, replace them with a single `ctx.runQuery` or `ctx.runMutation` that handles both things. Refactoring your code to use helper functions will make this easier.

### Example: Queries[​](#example-queries "Direct link to Example: Queries")

convex/teams.ts

TS

```
// ❌ -- this assertion could fail if the team changed between running the two queries
const team = await ctx.runQuery(internal.teams.getTeam, { teamId });
const teamOwner = await ctx.runQuery(internal.teams.getTeamOwner, { teamId });
assert(team.owner === teamOwner._id);
```

convex/teams.ts

TS

```
import * as Teams from './model/teams';
import * as Users from './model/users';

export const sendBillingReminder = action({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, { teamId }) => {
    // ✅ -- this will always pass
    const teamAndOwner = await ctx.runQuery(internal.teams.getTeamAndOwner, {
      teamId,
    });
    assert(teamAndOwner.team.owner === teamAndOwner.owner._id);
    // send a billing reminder email to the owner
  },
});

export const getTeamAndOwner = internalQuery({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, { teamId }) => {
    const team = await Teams.load(ctx, { teamId });
    const owner = await Users.load(ctx, { userId: team.owner });
    return { team, owner };
  },
});
```

### Example: Loops[​](#example-loops "Direct link to Example: Loops")

convex/teams.ts

TS

```
import * as Users from './model/users';

export const importTeams = action({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, { teamId }) => {
    // Fetch team members from an external API
    const teamMembers = await fetchTeamMemberData(teamId);

    // ❌ This will run a separate mutation for inserting each user,
    // which means you lose transaction guarantees like atomicity.
    for (const member of teamMembers) {
      await ctx.runMutation(internal.teams.insertUser, member);
    }
  },
});
export const insertUser = internalMutation({
  args: { name: v.string(), email: v.string() },
  handler: async (ctx, { name, email }) => {
    await Users.insert(ctx, { name, email });
  },
});
```

convex/teams.ts

TS

```
import * as Users from './model/users';

export const importTeams = action({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, { teamId }) => {
    // Fetch team members from an external API
    const teamMembers = await fetchTeamMemberData(teamId);

    // ✅ This action runs a single mutation that inserts all users in the same transaction.
    await ctx.runMutation(internal.teams.insertUsers, teamMembers);
  },
});
export const insertUsers = internalMutation({
  args: { users: v.array(v.object({ name: v.string(), email: v.string() })) },
  handler: async (ctx, { users }) => {
    for (const { name, email } of users) {
      await Users.insert(ctx, { name, email });
    }
  },
});
```

### Exceptions[​](#exceptions-3 "Direct link to Exceptions")

If you're intentionally trying to process more data than fits in a single transaction, like running a migration or aggregating data, then it makes sense to have multiple sequential `ctx.runMutation` / `ctx.runQuery` calls.

Multiple `ctx.runQuery` / `ctx.runMutation` calls are often necessary because the action does a side effect in between them. For example, reading some data, feeding it to an external service, and then writing the result back to the database.

## Use `ctx.runQuery` and `ctx.runMutation` sparingly in queries and mutations[​](#use-ctxrunquery-and-ctxrunmutation-sparingly-in-queries-and-mutations "Direct link to use-ctxrunquery-and-ctxrunmutation-sparingly-in-queries-and-mutations")

### Why?[​](#why-10 "Direct link to Why?")

While these queries and mutations run in the same transaction, and will give consistent results, they have extra overhead compared to plain TypeScript functions. Wanting a TypeScript helper function is much more common than needing `ctx.runQuery` or `ctx.runMutation`.

### How?[​](#how-9 "Direct link to How?")

Audit your calls to `ctx.runQuery` and `ctx.runMutation` in queries and mutations. Unless one of the exceptions below applies, replace them with a plain TypeScript function.

### Exceptions[​](#exceptions-4 "Direct link to Exceptions")

* If you're using components, these require `ctx.runQuery` or `ctx.runMutation`.
* If you want partial rollback on an error, you will want `ctx.runMutation` instead of a plain TypeScript function.

convex/messages.ts

TS

```
export const trySendMessage = mutation({
  args: {
    body: v.string(),
    author: v.string(),
  },
  handler: async (ctx, { body, author }) => {
    try {
      await ctx.runMutation(internal.messages.sendMessage, { body, author });
    } catch (e) {
      // Record the failure, but rollback any writes from `sendMessage`
      await ctx.db.insert("failures", {
        kind: "MessageFailed",
        body,
        author,
        error: `Error: ${e}`,
      });
    }
  },
});
```