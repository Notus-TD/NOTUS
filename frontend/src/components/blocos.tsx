import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Versão "simples" dos componentes Card, usada nas telas logadas (admin, professor, aluno e
 * responsável). Mesma interface do shadcn (Card, CardHeader, CardTitle, CardDescription,
 * CardContent), mas sem caixa, borda, sombra nem padding: cada bloco vira uma seção separada
 * por espaço, com título em Sora.
 *
 * Exceção: um bloco marcado com cor de borda (ex.: border-destructive, border-primary) indica
 * situação (erro, sucesso). Ele ganha uma barra de 4px à esquerda nessa cor, para a informação
 * não se perder sem a caixa.
 */

const temCorDeBorda = (className?: string) =>
  !!className && /\bborder-(destructive|primary|success|warning)/.test(className);

const Card = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <section
      ref={ref}
      className={cn(
        "text-foreground",
        className,
        temCorDeBorda(className) ? "rounded-none border-0 border-l-4 pl-5" : "border-0",
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("mb-5 flex flex-col gap-1", className, "p-0")} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("font-display text-xl font-semibold leading-tight text-foreground", className)}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-muted-foreground", className, "text-sm")} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn(className, "p-0")} {...props} />,
);
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
