import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <div className="flex w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm glass-border rounded-2xl p-1 shadow-2xl shadow-white">
        <Card className="liquid-glass text-white">
          <CardHeader>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription className="text-white/80">
              We've sent you a confirmation link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              Please check your email and click the confirmation link to
              activate your account.
            </p>
            <Button asChild className="w-full">
              <Link href="/auth/login">Back to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
