import { useState } from "react";
import api from "../lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggleButton } from "@/components/ui/theme-toggle-button";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post("/login", { email, password });
      const { token } = res.data;
      localStorage.setItem("token", token);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen relative">
      {/* Create account link at top right */}
      <div className="absolute top-6 right-6 mr-12">
        <a
          href="/register"
          className="text-sm font-medium text-gray-500 hover:underline"
        >
          Want to create an account with us?
        </a>
        <ThemeToggleButton />
      </div>

      {/* Left Side */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-black text-white p-8 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/imgs/baku.webp"
            alt="Track background"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-black/50 to-black"></div>
        </div>

        {/* Top content */}
        <div className="relative flex flex-col space-y-6 z-10">
          <img
            src="/imgs/gpgt_logo_light.svg"
            className="w-72"
            alt="Grand Prix Logo"
          />
          <h2 className="font-grandprix text-4xl font-bold leading-tight mt-8">
            Tailor-made Motorsport Travel
          </h2>
          <p className="text-lg text-gray-300 max-w-md">
            Welcome to the Grand Prix Grand Tours Pricing Portal — your gateway
            to exclusive F1, MotoGP, and motorsport travel experiences.
          </p>
        </div>

        {/* Bottom quote */}
        <div className="relative text-sm text-gray-400 mt-8 z-10">
          <p className="italic">
            "Travel faster. Dream bigger. Experience motorsport like never
            before."
          </p>
          <p className="mt-4 font-semibold">Grand Prix Grand Tours</p>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 p-8">
        <div className="w-full max-w-md space-y-6">
          <h1 className="text-2xl font-bold text-center">
            Sign in to your account
          </h1>
          <p className="text-center text-gray-500 text-sm">
            Enter your email and password to access your account
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
            <Input
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
            {error && <div className="text-primary text-sm">{error}</div>}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-4">
            By signing in, you agree to our{" "}
            <a href="/terms" className="underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export { Login };
