import Link from "next/link";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center p-8 text-center">
      <div className="space-y-4">
        <h1 className="text-5xl font-bold">404</h1>
        <p className="text-muted-foreground">This page could not be found.</p>
        <Link href="/"><Button>Go home</Button></Link>
      </div>
    </div>
  );
}
