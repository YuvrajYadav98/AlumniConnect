import {
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Mail,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth, getErrorMessage } from "../context/AuthContext";
import FormInput from "../components/FormInput";
import Button from "../components/Button";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect user back to the page they originally wanted
  const redirectTo = location.state?.from?.pathname || "/dashboard";

  const onSubmit = async (formData) => {
    setServerError("");

    try {
      await login(formData);

      // Navigate after successful login
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">

        {/* Decorative Background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[hsl(var(--accent)/.08)] blur-3xl" />

          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[hsl(var(--primary)/.08)] blur-3xl" />
        </div>

        {/* Login Card */}
        <section className="relative z-10 w-full max-w-md">
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[var(--shadow-md)] sm:p-8">

            {/* Header */}
            <div className="mb-8">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--accent))]">
                02 / Welcome back
              </p>

              <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[hsl(var(--foreground))]">
                Good to
                <br />

                <em className="not-italic text-[hsl(var(--accent))]">
                  see you.
                </em>
              </h1>

              <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                Sign in to stay close to the people and possibilities that make
                your college community matter.
              </p>
            </div>

            {/* Server Error */}
            {serverError && (
              <div
                className="mb-5 rounded-2xl border border-[hsl(var(--destructive)/.3)] bg-[hsl(var(--destructive)/.07)] px-4 py-3 text-[12px] leading-5 text-[hsl(var(--destructive))]"
                role="alert"
              >
                {serverError}
              </div>
            )}

            {/* Login Form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
              noValidate
            >
              {/* Email */}
              <div className="relative">
                <FormInput
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  error={errors.email}
                  registration={register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email address",
                    },
                  })}
                />

                {/* Email Icon */}
                <Mail className="pointer-events-none absolute right-3.5 top-[38px] h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              </div>

              {/* Password */}
              <div className="relative">
                <FormInput
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  autoComplete="current-password"
                  error={errors.password}
                  registration={register("password", {
                    required: "Password is required",
                  })}
                />

                {/* Password Icon */}
                <KeyRound className="pointer-events-none absolute right-11 top-[38px] h-4 w-4 text-[hsl(var(--muted-foreground))]" />

                {/* Show / Hide Password */}
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-2 top-[31px] grid h-8 w-8 place-items-center rounded-lg text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Logging in...
                  </span>
                ) : (
                  "Login"
                )}
              </Button>
            </form>

            {/* Register */}
            <p className="mt-6 text-center text-sm text-slate-500">
              Don't have an account?{" "}

              <Link
                to="/register"
                className="font-medium text-slate-800 hover:underline"
              >
                Register
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
