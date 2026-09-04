"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { username, password, redirect: false });
    if (res?.error) {
      setError("Username atau password salah");
      setLoading(false);
    } else {
      // Optimized: avoid extra /api/auth/session round-trip + avoid redundant refresh.
      // NextAuth JWT cookie is set; single push to "/" triggers src/app/page.tsx role redirect.
      router.push("/");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-900 to-zinc-700">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 h-12 w-12 rounded-xl bg-zinc-900 flex items-center justify-center text-white font-bold text-xl">D</div>
          <CardTitle className="text-2xl">DIKOPI POS</CardTitle>
          <p className="text-sm text-zinc-500">Financial Monitoring System</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Username</Label>
              <Input value={username} onChange={e=>setUsername(e.target.value)} placeholder="admin / kasir1" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full h-11 text-base">
              {loading ? "Masuk..." : "Masuk"}
            </Button>
            <div className="text-xs text-zinc-400 text-center space-y-1 pt-2">
              <p>Demo: admin / password123 (Admin)</p>
              <p>kasir1 / password123 (Cashier)</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
