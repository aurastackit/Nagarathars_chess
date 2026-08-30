import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { Button, Input, Label, Card } from "@/components/ui";

async function loginAction(formData: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      redirect("/admin/login?error=1");
    }
    throw err;
  }
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex max-w-md flex-col justify-center px-4 py-20">
      <Card className="p-6">
        <h1 className="text-2xl font-bold text-navy">Admin Login</h1>
        <p className="mt-1 text-sm text-foreground/60">Sign in to manage tournaments and view registrants.</p>
        <form action={loginAction} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {error && <p className="text-sm text-red-600">Invalid email or password.</p>}
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
      </Card>
    </main>
  );
}
