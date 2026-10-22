import { AuthError, CredentialsSignin } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { adminCallbackPath } from "@/lib/safe-redirect";
import { Button, Input, Label, Card } from "@/components/ui";

/** Keeps the callbackUrl across a failed attempt. */
function loginErrorUrl(error: string, redirectTo: string) {
  const params = new URLSearchParams({ error });
  if (redirectTo !== "/admin") params.set("callbackUrl", redirectTo);
  return `/admin/login?${params}`;
}

async function loginAction(formData: FormData) {
  "use server";
  const redirectTo = adminCallbackPath(formData.get("callbackUrl"));
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo,
    });
  } catch (err) {
    if (err instanceof CredentialsSignin && err.code === "throttled") {
      redirect(loginErrorUrl("throttled", redirectTo));
    }
    if (err instanceof AuthError) {
      redirect(loginErrorUrl("1", redirectTo));
    }
    throw err;
  }
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { error, callbackUrl } = await searchParams;

  return (
    <main className="mx-auto flex max-w-md flex-col justify-center px-4 py-20">
      <Card className="p-6">
        <h1 className="text-2xl font-bold text-charcoal">Admin Login</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Sign in to manage tournaments and view registrants.
        </p>
        <form action={loginAction} className="mt-6 space-y-4">
          <input type="hidden" name="callbackUrl" value={adminCallbackPath(callbackUrl)} />
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error === "throttled"
                ? "Too many failed attempts. Wait a few minutes and try again."
                : "Invalid email or password."}
            </p>
          )}
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
      </Card>
    </main>
  );
}
