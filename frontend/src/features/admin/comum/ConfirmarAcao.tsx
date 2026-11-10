import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { type ReactNode } from "react";

export function ConfirmarAcao({
  titulo,
  descricao,
  textoConfirmar,
  onConfirmar,
  children,
}: {
  titulo: string;
  descricao?: string;
  textoConfirmar: string;
  onConfirmar: () => void;
  children: ReactNode;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent {...(descricao ? {} : { "aria-describedby": undefined })}>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          {descricao && <AlertDialogDescription>{descricao}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmar}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {textoConfirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
