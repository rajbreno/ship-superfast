import { defineApp } from "convex/server";
import r2 from "@convex-dev/r2/convex.config";
import pushNotifications from "@convex-dev/expo-push-notifications/convex.config";
import dodopayments from "@dodopayments/convex/convex.config";
import resend from "@convex-dev/resend/convex.config.js";
import agent from "@convex-dev/agent/convex.config";
import rag from "@convex-dev/rag/convex.config.js";
import persistentTextStreaming from "@convex-dev/persistent-text-streaming/convex.config.js";

const app = defineApp();
app.use(r2);
app.use(pushNotifications);
app.use(dodopayments);
app.use(resend);
app.use(agent);
app.use(rag);
app.use(persistentTextStreaming);

export default app;
