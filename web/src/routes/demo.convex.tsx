import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Suspense } from "react";

import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/demo/convex")({
  component: App,
});

function Products() {
  const products = useQuery(api.products.get);

  return (
    <ul>
      {(products || []).map((p) => (
        <li key={p._id}>
          {p.clerkUserId} - {p.name} - {p.email}
        </li>
      ))}
    </ul>
  );
}

function App() {
  return (
    <div className="p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <h1>Products</h1>
        <Products />
      </Suspense>
    </div>
  );
}
