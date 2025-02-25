import { auth } from "@/auth";

import SignOut from "./components/buttons/SignOut";
import SignIn from "./components/buttons/SignIn";

export default async function Home() {
  const session = await auth();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <div className="absolute top-5 right-5 flex items-center gap-4">
          {session?.user ? (
            <div className="flex items-center gap-4">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt="User Avatar"
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span>{session.user.name}</span>
              <SignOut />
            </div>
          ) : (
            <SignIn />
          )}
        </div>

        <h1 className="text-6xl font-bold mb-8 text-center">
          Temi OS 
        </h1>

      </div>
    </main>
  );
}

function Card({
  title,
  description,
  link
}: {
  title: string;
  description: string;
  link: string;
}) {
  return (
    <a
      href={link}
      className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-foreground/30"
      target="_blank"
      rel="noopener noreferrer"
    >
      <h2 className="mb-3 text-2xl font-semibold">
        {title}{' '}
        <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
          -&gt;
        </span>
      </h2>
      <p className="m-0 max-w-[30ch] text-sm opacity-50">
        {description}
      </p>
    </a>
  );
}
