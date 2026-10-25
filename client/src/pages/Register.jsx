import {
  ArrowRight,
  Eye,
  EyeOff,
  IdCard,
  KeyRound,
  LoaderCircle,
  Mail,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, getErrorMessage } from "../context/AuthContext";
import FormInput from "../components/FormInput";
import Button from "../components/Button";



export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ mode: "onBlur", defaultValues: { role: "student" } });

  const password = watch("password");

  const onSubmit = async (formData) => {
    setServerError("");
    try {
      // confirmPassword only exists for client-side validation;
      // the backend never needs it.
      const { confirmPassword, ...payload } = formData;
      await registerUser(payload);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
      <main className="min-h-screen bg-background text-foreground">
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6">

        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[hsl(var(--accent)/.08)] blur-3xl" />

          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[hsl(var(--primary)/.08)] blur-3xl" />

          <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[hsl(var(--accent)/.035)] blur-3xl" />
        </div>

     {/* Register Card */}
        <section className="relative z-10 w-full max-w-xl">
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[var(--shadow-md)] sm:p-8">

            {/* Header */}
            <div className="mb-8">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--accent))]">
                01 / Join the thread
              </p>

              <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">
                Make room
                <br />
                <em className="not-italic text-[hsl(var(--accent))]">
                  for more.
                </em>
              </h1>

              <p className="mt-3 max-w-lg text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                Create your place in the AlumniConnect community. A simple
                profile is all it takes to begin.
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

      <form onSubmit={handleSubmit(onSubmit)}  className="space-y-4"  noValidate>
        <FormInput
          label="Full Name"
          placeholder="Jane Doe"
          error={errors.name}
          registration={register("name", {
            required: "Name is required",
            minLength: { value: 2, message: "Name must be at least 2 characters" },
          })}
        />

        <FormInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email}
          registration={register("email", {
            required: "Email is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Enter a valid email address",
            },
          })}
        />

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            I am a
          </label>
          <select
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
            {...register("role", { required: true })}
          >
            <option value="student">Student</option>
            <option value="alumni">Alumni</option>
          </select>
          <p className="mt-1 text-xs text-slate-400">
            Alumni accounts require admin approval before full access is granted.
          </p>
        </div>

        <FormInput
          label="Password"
          type="password"
          placeholder="At least 6 characters"
          error={errors.password}
          registration={register("password", {
            required: "Password is required",
            minLength: { value: 6, message: "Password must be at least 6 characters" },
          })}
        />

        <FormInput
          label="Confirm Password"
          type="password"
          placeholder="Re-enter your password"
          error={errors.confirmPassword}
          registration={register("confirmPassword", {
            required: "Please confirm your password",
            validate: (value) => value === password || "Passwords do not match",
          })}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full mt-2">
          {isSubmitting ? "Creating account..." : "Register"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link to="/login" className="text-slate-800 font-medium hover:underline">
          Login
        </Link>
      </p>
      </div>
    </section>
      </div>
    </main>
  );
}
