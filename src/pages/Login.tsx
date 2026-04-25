import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/Spinner";

export default function Login() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submitCreds = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!email) errs.email = "Email requis";
    if (!password) errs.password = "Mot de passe requis";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      await api.post("/utilisateurs/login-otp", {
        email: email.trim(),
        mot_de_passe: password,
      });
      toast.success("Code OTP envoyé par email");
      setStep(2);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Échec de la connexion");
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return setErrors({ otp: "Code OTP requis" });
    setErrors({});
    setLoading(true);
    try {
      const data = await api.post<any>("/utilisateurs/verify-otp", { email, otp });
      const token = data?.token || data?.access_token || data?.accessToken;
      const user = data?.utilisateur || data?.user || data;
      if (!token) throw new Error("Aucun jeton reçu");

      const role = user?.role || data?.role;
      if (role && String(role).toUpperCase() !== "ADMIN") {
        localStorage.removeItem("token");
        toast.error("Accès refusé — réservé aux administrateurs");
        setLoading(false);
        return;
      }

      setSession(token, user || { email, role: "ADMIN" });
      toast.success("Bienvenue");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Code OTP invalide");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-stretch">
      <div className="hidden lg:flex lg:w-1/2 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary-glow" />
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-accent text-accent-foreground flex items-center justify-center font-bold text-xl">
              U
            </div>
            <div className="font-bold text-xl">Umrah Fly</div>
          </div>
          <div>
            <h2 className="text-4xl font-bold tracking-tight leading-tight">
              Gérez votre plateforme<br />de pèlerinage en toute simplicité.
            </h2>
            <p className="mt-4 text-primary-foreground/80 max-w-md">
              Outils d'administration pour superviser les utilisateurs, les douaas, les rituels et les notifications — tout au même endroit.
            </p>
          </div>
          <div className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} Umrah Fly Admin
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold">U</div>
            <div className="font-bold">Umrah Fly Admin</div>
          </div>

          {step === 1 ? (
            <>
              <h1 className="text-2xl font-bold tracking-tight">Connexion</h1>
              <p className="text-sm text-muted-foreground mt-1 mb-6">Saisissez vos identifiants administrateur.</p>
              <form onSubmit={submitCreds} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative mt-1.5">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email" type="email" autoComplete="email"
                      className={`pl-9 ${errors.email ? "border-destructive" : ""}`}
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com"
                    />
                  </div>
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                </div>

                <div>
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative mt-1.5">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password" type="password" autoComplete="current-password"
                      className={`pl-9 ${errors.password ? "border-destructive" : ""}`}
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
                </div>

                <Button type="submit" disabled={loading} className="w-full h-11">
                  {loading ? <Spinner className="text-primary-foreground" /> : (<>Continuer <ArrowRight size={16} className="ml-1" /></>)}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-accent-foreground bg-accent-soft px-3 py-2 rounded-lg w-fit mb-4">
                <ShieldCheck size={16} />
                <span className="text-xs font-medium">Vérification requise</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Saisir le code OTP</h1>
              <p className="text-sm text-muted-foreground mt-1 mb-6">
                Un code a été envoyé à <span className="font-medium text-foreground">{email}</span>
              </p>
              <form onSubmit={submitOtp} className="space-y-4">
                <div>
                  <Label htmlFor="otp">Code à usage unique</Label>
                  <Input
                    id="otp" inputMode="numeric" autoComplete="one-time-code"
                    className={`mt-1.5 tracking-widest text-center text-lg font-semibold ${errors.otp ? "border-destructive" : ""}`}
                    value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••••" maxLength={8}
                  />
                  {errors.otp && <p className="text-xs text-destructive mt-1">{errors.otp}</p>}
                </div>
                <Button type="submit" disabled={loading} className="w-full h-11">
                  {loading ? <Spinner className="text-primary-foreground" /> : "Vérifier et continuer"}
                </Button>
                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(""); }}
                  className="text-xs text-muted-foreground hover:text-foreground w-full text-center"
                >
                  ← Utiliser un autre compte
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
