"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { LocaleProvider } from "@/components/locale-provider";
import { MapsProvider } from "@/components/maps/maps-provider";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <LocaleProvider>
        <MapsProvider>{children}</MapsProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}
