import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase, Mail, Lock, User, Eye, EyeOff, Loader2, CheckCircle2, Circle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [is2FAPending, setIs2FAPending] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [pendingAdminEmail, setPendingAdminEmail] = useState("");
  const [pendingAdminPassword, setPendingAdminPassword] = useState("");
  const [otp, setOtp] = useState("");

  const passwordRequirements = [
    { regex: /.{8,}/, text: "At least 8 characters" },
    { regex: /[A-Z]/, text: "At least 1 uppercase letter" },
    { regex: /[a-z]/, text: "At least 1 lowercase letter" },
    { regex: /[0-9]/, text: "At least 1 number" },
    { regex: /[\W_]/, text: "At least 1 special character" },
  ];

  const adminMagicLinkEmails = (import.meta.env.VITE_ADMIN_MAGIC_LINK_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  const isMagicLinkAdminAllowed = email && adminMagicLinkEmails.includes(email.trim().toLowerCase());

  const sendOtpEmail = async (to: string, code: string) => {
    if (!(window as any).Email?.send) {
      throw new Error("Email service not loaded. Ensure smtp.js is present in index.html");
    }

    await (window as any).Email.send({
      SecureToken: import.meta.env.VITE_SMTPJS_SECURE_TOKEN,
      To: to,
      From: import.meta.env.VITE_OTP_FROM,
      Subject: "Your HRMS admin login OTP",
      Body: `Your one-time code is ${code}. It expires in 5 minutes.`,
    });
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatedOtp) {
      toast({ title: "Error", description: "2FA code not generated", variant: "destructive" });
      return;
    }
    if (otp.trim() !== generatedOtp) {
      toast({ title: "Invalid 2FA code", description: "Please enter the correct code.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: pendingAdminEmail, password: pendingAdminPassword });
      if (error) throw error;

      setIs2FAPending(false);
      setGeneratedOtp(null);
      setOtp("");
      setPendingAdminEmail("");
      setPendingAdminPassword("");

      toast({ title: "2FA Success", description: "Admin login is now complete." });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!isLogin) {
        if (password !== confirmPassword) {
          toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
          setLoading(false);
          return;
        }
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!strongPasswordRegex.test(password)) {
          toast({
            title: "Weak Password",
            description: "Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      if (isLogin) {
        if (useMagicLink) {
          if (!isMagicLinkAdminAllowed) {
            throw new Error("Magic link login is allowed for admin accounts only.");
          }

          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: window.location.origin },
          });
          if (error) throw error;

          toast({
            title: "Magic link sent",
            description: `An authentication link has been sent to ${email}. Check your inbox to continue.`,
          });
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const userId = data.user?.id;
        if (!userId) throw new Error("User not found after login");

        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();

        if (roleError) throw roleError;

        const role = roleData?.role;
        if (role === "admin") {
          const code = Math.floor(100000 + Math.random() * 900000).toString();
          setGeneratedOtp(code);
          setPendingAdminEmail(email);
          setPendingAdminPassword(password);
          setIs2FAPending(true);

          await sendOtpEmail(email, code);
          await supabase.auth.signOut();

          toast({
            title: "Admin 2FA needed",
            description: "A 2FA code has been sent to your email. Enter it to complete login.",
          });

          setLoading(false);
          return;
        }

        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: "Account created",
          description: "Please check your email to verify your account before signing in.",
        });
        setIsLogin(true);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-50" />
        <div className="relative z-10 text-center space-y-6 max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-white">HRMS</h1>
          <p className="text-white/80 text-lg leading-relaxed">
            Modern Human Resource Management System for your organization. Streamline HR operations with ease.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {["Employee Management", "Leave Tracking", "Attendance", "Reports"].map((f) => (
              <div key={f} className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-sm text-white/90 font-medium">
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl text-foreground">HRMS</span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-heading font-bold text-foreground">
              {isLogin ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-muted-foreground mt-1">
              {isLogin ? "Sign in to your HR dashboard" : "Get started with your HR account"}
            </p>
          </div>

          <form onSubmit={is2FAPending ? handle2FASubmit : handleSubmit} className="space-y-5">
            {is2FAPending ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp">2FA Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>
                <p className="text-muted-foreground text-sm">
                  A one-time verification code has been sent to your email. Use it to complete login.
                </p>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Verify 2FA
                </Button>
              </>
            ) : (
              <>
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="fullName"
                        placeholder="John Smith"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                )}

                {isLogin && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <input
                        id="useMagicLink"
                        type="checkbox"
                        checked={useMagicLink}
                        disabled={!(isMagicLinkAdminAllowed && email.trim() !== "")}
                        onChange={(e) => setUseMagicLink(e.target.checked)}
                        className="h-4 w-4"
                      />
                     
                    </div>
                    {!isMagicLinkAdminAllowed && email.trim() !== "" && (
                      <p className="text-xs text-muted-foreground">
                        Magic link login is limited to admin accounts. Please sign in with your password.
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                {!useMagicLink && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9 pr-10"
                        required={!useMagicLink}
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {!isLogin && (
                      <div className="space-y-1.5 pt-1">
                        {passwordRequirements.map((req, index) => {
                          const isValid = req.regex.test(password);
                          return (
                            <div key={index} className="flex items-center text-xs">
                              {isValid ? (
                                <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-green-500" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                              )}
                              <span className={isValid ? "text-green-500 font-medium" : "text-muted-foreground"}>
                                {req.text}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-9 pr-10"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isLogin ? "Sign In" : "Create Account"}
                </Button>
              </>
            )}
          </form>

          {!is2FAPending ? (
            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          ) : (
            <p className="text-center text-sm text-muted-foreground">Enter the 2FA code to continue as admin.</p>
          )}
        </div>
      </div>
    </div>
  );
}
