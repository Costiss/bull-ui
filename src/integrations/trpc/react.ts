import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { TRPCRouter } from "src/integrations/trpc/router";

export const { TRPCProvider, useTRPC } = createTRPCContext<TRPCRouter>();
