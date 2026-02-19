import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Mail } from "lucide-react"
import { login } from "@/lib/api"

export default function Login() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem('visor_token');
        if (token) {
            window.location.href = "/";
        }
    }, []);



    const [error, setError] = useState("")

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        const result = await login(email, password);

        if (result.success) {
            window.location.href = "/";
        } else {
            setError(result.error || "Error de credenciales");
        }
        setLoading(false)
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#09090b] text-white p-4 font-sans selection:bg-primary/30">
            {/* Background Decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full" />
            </div>

            <Card className="w-full max-w-md shadow-2xl border-white/5 bg-[#18181b]/50 backdrop-blur-xl relative z-10 sm:rounded-2xl">
                <CardHeader className="space-y-2 pb-8 text-center">
                    <div className="mx-auto w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-primary/40 shadow-[0_0_20px_rgba(132,204,22,0.2)]">
                        <Lock className="h-8 w-8 text-primary shrink-0" />
                    </div>
                    <CardTitle className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
                        Visor de Leads
                    </CardTitle>
                    <CardDescription className="text-gray-400 font-medium">
                        Acceso Corporativo <span className="text-primary/80">urbani.cl</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-semibold text-gray-300 ml-1">
                                Correo Electrónico
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="email"
                                    placeholder="ejemplo@urbani.cl"
                                    type="email"
                                    className="pl-10 h-12 bg-black/30 border-white/10 text-white placeholder:text-gray-600 focus:ring-primary/50 focus:border-primary transition-all rounded-xl"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-semibold text-gray-300 ml-1">
                                Contraseña
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10 h-12 bg-black/30 border-white/10 text-white placeholder:text-gray-600 focus:ring-primary/50 focus:border-primary transition-all rounded-xl"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        {error && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center">
                                {error}
                            </div>
                        )}
                        <Button
                            className="w-full h-12 bg-primary hover:bg-[#a3e635] text-black font-bold text-lg rounded-xl transition-all shadow-[0_0_15px_rgba(132,204,22,0.3)] hover:shadow-[0_0_25px_rgba(132,204,22,0.5)] active:scale-[0.98]"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "Autenticando..." : "Ingresar al Panel"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col items-center gap-4 pt-4 pb-8">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                        Lead Management System v2.0
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
