export function MensagemErro({ carga }: { carga: { status: number; mensagem: string } }) {
  return (
    <p className="text-base font-semibold text-destructive">
      {carga.status === 403 ? "Sem acesso para este perfil." : carga.mensagem}
    </p>
  );
}
