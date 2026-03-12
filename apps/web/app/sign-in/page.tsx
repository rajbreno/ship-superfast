"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/components/providers/session-provider";
import { APP_NAME } from "@/lib/config";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mail01Icon,
} from "@hugeicons/core-free-icons";

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const { isSignedIn } = useSession();
  const router = useRouter();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
      router.replace("/dashboard");
    }
  }, [isSignedIn, router]);

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      await signIn("google", { redirectTo: "/dashboard" });
    } catch (error) {
      console.error("Sign in error:", error);
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    try {
      setIsEmailLoading(true);
      await signIn("resend", formData);
      setEmailSent(true);
    } catch (error) {
      console.error("Email sign in error:", error);
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left side - Image */}
      <div className="relative hidden bg-zinc-950 lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/login-bg.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-80"
        />
        <div className="relative flex h-full flex-col justify-between p-10">
          <div className="flex items-center gap-2 text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/light logo.png" alt={APP_NAME} className="h-8 w-auto object-contain" />
            <span className="text-lg font-semibold">{APP_NAME}</span>
          </div>
          <div className="max-w-md">
            <blockquote className="text-lg text-white">
              &quot;Build cross-platform apps in record time. Auth, storage,
              payments, email, AI, and push notifications. All wired up.&quot;
            </blockquote>
          </div>
        </div>
      </div>

      {/* Right side - Sign in form */}
      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <div className="flex flex-col items-center gap-3 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/brand-logo.png" alt={APP_NAME} className="h-8 w-auto object-contain" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your account
            </p>
          </div>

          <Button
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full"
            size="lg"
          >
            {isGoogleLoading ? <Spinner /> : "Sign in with Google"}
          </Button>

          <div className="flex w-full items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          {emailSent ? (
            <Card size="sm" className="w-full text-center">
              <CardContent className="flex justify-center">
                <HugeiconsIcon
                  icon={Mail01Icon}
                  strokeWidth={1.5}
                  className="h-8 w-8 text-primary"
                />
              </CardContent>
              <CardHeader className="items-center">
                <CardTitle>Check your email</CardTitle>
                <CardDescription>
                  We sent a sign-in link to your inbox.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEmailSent(false)}
                >
                  Use a different email
                </Button>
              </CardContent>
            </Card>
          ) : (
            <form
              onSubmit={handleEmailSignIn}
              className="flex w-full flex-col gap-3"
            >
              <Input
                name="email"
                type="email"
                placeholder="Email"
                required
                disabled={isEmailLoading}
              />
              <Button
                type="submit"
                variant="outline"
                className="w-full"
                size="lg"
                disabled={isEmailLoading}
              >
                {isEmailLoading ? <Spinner /> : "Sign in with Email"}
              </Button>
            </form>
          )}

          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2">
              Terms of Service
            </Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
