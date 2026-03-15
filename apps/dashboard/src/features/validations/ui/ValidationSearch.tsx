import { useState, type FormEvent } from "react";
import { Search, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { useCedulaValidation } from "../model/use-cedula-validation";
import { ValidationResultCard } from "./ValidationResultCard";

export function ValidationSearch() {
  const [nac, setNac] = useState<"V" | "E">("V");
  const [cedula, setCedula] = useState("");
  const { result, validate, reset } = useCedulaValidation();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (cedula.trim().length >= 5) {
      validate(nac, cedula.trim());
    }
  };

  const handleReset = () => {
    reset();
    setCedula("");
    setNac("V");
  };

  const isLoading = result.state === "loading";

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Search Form */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-xl border border-border bg-card shadow-sm p-1.5"
      >
        {/* Nationality selector */}
        <select
          value={nac}
          onChange={(e) => setNac(e.target.value as "V" | "E")}
          disabled={isLoading}
          className="h-10 pl-3 pr-2 rounded-lg border-0 bg-muted text-foreground text-sm font-semibold focus:ring-2 focus:ring-ring focus:outline-none cursor-pointer disabled:opacity-50"
          aria-label="Tipo de nacionalidad"
          id="validation-nac"
        >
          <option value="V">V</option>
          <option value="E">E</option>
        </select>

        {/* Divider */}
        <span className="text-border text-lg select-none">·</span>

        {/* Cedula input */}
        <input
          id="validation-cedula"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={9}
          value={cedula}
          onChange={(e) => setCedula(e.target.value.replace(/\D/g, ""))}
          placeholder="Número de cédula"
          disabled={isLoading}
          required
          className="flex-1 h-10 px-3 bg-transparent text-sm text-foreground placeholder:text-muted-foreground border-0 focus:outline-none disabled:opacity-50"
          aria-label="Número de cédula de identidad"
        />

        {/* Submit */}
        {result.state !== "idle" && result.state !== "loading" ? (
          <button
            type="button"
            onClick={handleReset}
            className="h-10 w-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Nueva búsqueda"
            title="Nueva búsqueda"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        ) : null}

        <button
          type="submit"
          disabled={isLoading || cedula.length < 5}
          className="h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Verificar cédula"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {isLoading ? "Consultando..." : "Verificar"}
          </span>
        </button>
      </form>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 animate-pulse space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-muted" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-5 w-48 rounded bg-muted" />
            </div>
          </div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-3 py-2">
              <div className="h-4 w-4 rounded bg-muted mt-1 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-2.5 w-16 rounded bg-muted" />
                <div className="h-4 w-40 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {result.state === "error" && (
        <div className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 flex items-start gap-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">
              {result.status === 404
                ? "Cédula no encontrada"
                : "Error en la consulta"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {result.message}
            </p>
          </div>
        </div>
      )}

      {/* Success state */}
      {result.state === "success" && (
        <ValidationResultCard data={result.data} />
      )}
    </div>
  );
}
