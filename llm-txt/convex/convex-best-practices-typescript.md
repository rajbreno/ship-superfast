# TypeScript

Convex provides end-to-end type support when Convex functions are written in [TypeScript](https://www.typescriptlang.org/).

You can gradually add TypeScript to a Convex project: the following steps provide progressively better type support. For the best support you'll want to complete them all.

**Example:** [TypeScript and Schema](https://github.com/get-convex/convex-demos/tree/main/typescript)

## Writing Convex functions in TypeScript[​](#writing-convex-functions-in-typescript "Direct link to Writing Convex functions in TypeScript")

The first step to improving type support in a Convex project is to writing your Convex functions in TypeScript by using the `.ts` extension.

If you are using [argument validation](/functions/validation.md), Convex will infer the types of your functions arguments automatically:

convex/sendMessage.ts

```
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export default mutation({
  args: {
    body: v.string(),
    author: v.string(),
  },
  // Convex knows that the argument type is `{body: string, author: string}`.
  handler: async (ctx, args) => {
    const { body, author } = args;
    await ctx.db.insert("messages", { body, author });
  },
});
```

Otherwise you can annotate the arguments type manually:

convex/sendMessage.ts

```
import { internalMutation } from "./_generated/server";

export default internalMutation({
  // To convert this function from JavaScript to
  // TypeScript you annotate the type of the arguments object.
  handler: async (ctx, args: { body: string; author: string }) => {
    const { body, author } = args;
    await ctx.db.insert("messages", { body, author });
  },
});
```

This can be useful for [internal functions](/functions/internal-functions.md) accepting complicated types.

If TypeScript is installed in your project `npx convex dev` and `npx convex deploy` will typecheck Convex functions before sending code to the Convex backend.

Convex functions are typechecked with the `tsconfig.json` in the Convex folder: you can modify some parts of this file to change typechecking settings, or delete this file to disable this typecheck.

You'll find most database methods have a return type of `Promise<any>` until you add a schema.

## Adding a schema[​](#adding-a-schema "Direct link to Adding a schema")

Once you [define a schema](/database/schemas.md) the type signature of database methods will be known. You'll also be able to use types imported from `convex/_generated/dataModel` in both Convex functions and clients written in TypeScript (React, React Native, Node.js etc.).

The types of documents in tables can be described using the [`Doc`](/generated-api/data-model.md#doc) type from the generated data model and references to documents can be described with parametrized [Document IDs](/database/document-ids.md).

convex/messages.ts

```
import { query } from "./_generated/server";

export const list = query({
  args: {},
  // The inferred return type of `handler` is now `Promise<Doc<"messages">[]>`
  handler: (ctx) => {
    return ctx.db.query("messages").collect();
  },
});
```

## Type annotating server-side helpers[​](#type-annotating-server-side-helpers "Direct link to Type annotating server-side helpers")

When you want to reuse logic across Convex functions you'll want to define helper TypeScript functions, and these might need some of the provided context, to access the database, authentication and any other Convex feature.

Convex generates types corresponding to documents and IDs in your database, `Doc` and `Id`, as well as `QueryCtx`, `MutationCtx` and `ActionCtx` types based on your schema and declared Convex functions:

convex/helpers.ts

```
// Types based on your schema
import { Doc, Id } from "./_generated/dataModel";
// Types based on your schema and declared functions
import {
  QueryCtx,
  MutationCtx,
  ActionCtx,
  DatabaseReader,
  DatabaseWriter,
} from "./_generated/server";
// Types that don't depend on schema or function
import {
  Auth,
  StorageReader,
  StorageWriter,
  StorageActionWriter,
} from "convex/server";

// Note that a `MutationCtx` also satisfies the `QueryCtx` interface
export function myReadHelper(ctx: QueryCtx, id: Id<"channels">) {
  /* ... */
}

export function myActionHelper(ctx: ActionCtx, doc: Doc<"messages">) {
  /* ... */
}
```

### Inferring types from validators[​](#inferring-types-from-validators "Direct link to Inferring types from validators")

Validators can be reused between [argument validation](/functions/validation.md) and [schema validation](/database/schemas.md). You can use the provided [`Infer`](/api/modules/values.md#infer) type to get a TypeScript type corresponding to a validator:

convex/helpers.ts

```
import { Infer, v } from "convex/values";

export const courseValidator = v.union(
  v.literal("appetizer"),
  v.literal("main"),
  v.literal("dessert"),
);

// The corresponding type can be used in server or client-side helpers:
export type Course = Infer<typeof courseValidator>;
// is inferred as `'appetizer' | 'main' | 'dessert'`
```

### Document types without system fields[​](#document-types-without-system-fields "Direct link to Document types without system fields")

All documents in Convex include the built-in `_id` and `_creationTime` fields, and so does the generated `Doc` type. When creating or updating a document you might want use the type without the system fields. Convex provides [`WithoutSystemFields`](/api/modules/server.md#withoutsystemfields) for this purpose:

convex/helpers.ts

```
import { MutationCtx } from "./_generated/server";
import { WithoutSystemFields } from "convex/server";
import { Doc } from "./_generated/dataModel";

export async function insertMessageHelper(
  ctx: MutationCtx,
  values: WithoutSystemFields<Doc<"messages">>,
) {
  // ...
  await ctx.db.insert("messages", values);
  // ...
}
```

## Writing frontend code in TypeScript[​](#writing-frontend-code-in-typescript "Direct link to Writing frontend code in TypeScript")

All Convex JavaScript clients, including React hooks like [`useQuery`](/api/modules/react.md#usequery) and [`useMutation`](/api/modules/react.md#usemutation) provide end to end type safety by ensuring that arguments and return values match the corresponding Convex functions declarations. For React, install and configure TypeScript so you can write your React components in `.tsx` files instead of `.jsx` files.

Follow our [React](/quickstart/react.md) or [Next.js](/quickstart/nextjs.md) quickstart to get started with Convex and TypeScript.

### Type annotating client-side code[​](#type-annotating-client-side-code "Direct link to Type annotating client-side code")

When you want to pass the result of calling a function around your client codebase, you can use the generated types `Doc` and `Id`, just like on the backend:

src/App.tsx

```
import { Doc, Id } from "../convex/_generated/dataModel";

function Channel(props: { channelId: Id<"channels"> }) {
  // ...
}

function MessagesView(props: { message: Doc<"messages"> }) {
  // ...
}
```

You can also declare custom types inside your backend codebase which include `Doc`s and `Id`s, and import them in your client-side code.

You can also use `WithoutSystemFields` and any types inferred from validators via `Infer`.

#### Using inferred function return types[​](#using-inferred-function-return-types "Direct link to Using inferred function return types")

Sometimes you might want to annotate a type on the client based on whatever your backend function returns. Beside manually declaring the type (on the backend or on the frontend), you can use the generic `FunctionReturnType` and `UsePaginatedQueryReturnType` types with a function reference:

src/Components.tsx

```
import { FunctionReturnType } from "convex/server";
import { UsePaginatedQueryReturnType } from "convex/react";
import { api } from "../convex/_generated/api";

export function MyHelperComponent(props: {
  data: FunctionReturnType<typeof api.myFunctions.getSomething>;
}) {
  // ...
}

export function MyPaginationHelperComponent(props: {
  paginatedData: UsePaginatedQueryReturnType<
    typeof api.myFunctions.getSomethingPaginated
  >;
}) {
  // ...
}
```

## Turning `string`s into valid document IDs[​](#turning-strings-into-valid-document-ids "Direct link to turning-strings-into-valid-document-ids")

See [Serializing IDs](/database/document-ids.md#serializing-ids).

## Required TypeScript version[​](#required-typescript-version "Direct link to Required TypeScript version")

Convex requires TypeScript version [5.0.3](https://www.npmjs.com/package/typescript/v/5.0.3) or newer.

Related posts from

<!-- -->

[![Stack](/img/stack-logo-dark.svg)![Stack](/img/stack-logo-light.svg)](https://stack.convex.dev/)