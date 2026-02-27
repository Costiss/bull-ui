import { createTRPCReact } from "@trpc/react-query";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { TRPCRouter } from "src/integrations/trpc/router";

export const { TRPCProvider, useTRPC } = createTRPCContext<TRPCRouter>();
export const trpc = createTRPCReact<TRPCRouter>();
