import { ATUALIZADO_EM, Destaque, Secao, VERSAO_DOCUMENTOS } from "@/components/LegalPage";

export function TermsContent() {
  return (
    <div className="space-y-10">
      <Secao titulo="1. Aceitação e versão">
        <p>
          Estes Termos de Uso definem as regras para utilizar o NOTUS. Eles são aceitos no primeiro
          acesso ao portal e valem para todos os perfis. Versão {VERSAO_DOCUMENTOS}, atualizada em{" "}
          {ATUALIZADO_EM}.
        </p>
        <p>
          O tratamento de dados pessoais é explicado na Política de Privacidade, que complementa
          estes Termos e não é substituída por eles.
        </p>
      </Secao>

      <Secao titulo="2. O serviço">
        <p>
          O NOTUS é um portal de gestão escolar que permite acompanhar matrícula, turmas,
          disciplinas, notas, boletins, frequência, atividades e entregas, e a comunicação entre a
          escola, os alunos e os responsáveis, incluindo avisos automáticos enviados aos
          responsáveis pelo WhatsApp.
        </p>
        <p>
          O NOTUS é um projeto acadêmico, e o Colégio Notus é uma instituição fictícia usada para
          demonstração. As informações exibidas no portal não substituem documentos oficiais
          emitidos pela secretaria, como histórico escolar e declarações.
        </p>
      </Secao>

      <Secao titulo="3. Quem pode usar">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            O portal é destinado a alunos, responsáveis, professores e à administração da escola.
            As contas são criadas pela própria escola; não há cadastro aberto ao público.
          </li>
          <li>
            Alunos menores de idade utilizam o portal representados por seus responsáveis legais,
            que respondem por eles perante a escola. Ao aceitar estes Termos e a Política de
            Privacidade, o responsável o faz em seu nome e em nome dos alunos menores vinculados a
            ele.
          </li>
          <li>
            O acesso depende de vínculo ativo com a escola e é encerrado quando esse vínculo
            termina.
          </li>
        </ul>
      </Secao>

      <Secao titulo="4. Conta e senha">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            No primeiro acesso, é obrigatório trocar a senha inicial por uma senha pessoal com pelo
            menos 8 caracteres.
          </li>
          <li>
            A conta é pessoal e intransferível. Não compartilhe sua senha nem permita que outra
            pessoa use sua conta.
          </li>
          <li>
            Por segurança, a sessão expira automaticamente em até 1 hora. Em computadores
            compartilhados, saia da conta ao terminar.
          </li>
          <li>
            Se suspeitar que outra pessoa acessou sua conta, avise imediatamente a secretaria.
          </li>
        </ul>
      </Secao>

      <Secao titulo="5. Perfis e permissões">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <Destaque>Aluno:</Destaque> consulta as próprias notas, boletins, frequência,
            atividades e entregas.
          </li>
          <li>
            <Destaque>Responsável:</Destaque> acompanha os alunos vinculados a ele e, após aceitar
            estes Termos e a Política de Privacidade, recebe pelo WhatsApp avisos de faltas,
            boletins fechados e novas atividades. As mensagens são automáticas e não recebem
            respostas; para deixar de recebê-las, basta pedir à secretaria.
          </li>
          <li>
            <Destaque>Professor:</Destaque> lança notas, faltas, aulas e atividades das turmas e
            disciplinas em que leciona.
          </li>
          <li>
            <Destaque>Administração:</Destaque> cadastra alunos, responsáveis, turmas e
            disciplinas e atende pedidos relacionados a dados pessoais.
          </li>
        </ul>
        <p>
          Cada perfil acessa apenas o necessário para a sua função. Tentar acessar dados de outro
          perfil ou de outro aluno é proibido e fica registrado.
        </p>
      </Secao>

      <Secao titulo="6. Responsabilidades do usuário">
        <ul className="list-disc space-y-2 pl-6">
          <li>Usar o portal apenas para fins escolares;</li>
          <li>
            Manter a senha em sigilo e seus dados de contato atualizados junto à secretaria,
            incluindo o celular usado para os avisos pelo WhatsApp;
          </li>
          <li>
            No caso de professores, lançar notas, faltas e atividades de forma correta e
            responsável;
          </li>
          <li>Informar à secretaria qualquer erro nos dados exibidos.</li>
        </ul>
      </Secao>

      <Secao titulo="7. Condutas proibidas">
        <ul className="list-disc space-y-2 pl-6">
          <li>Acessar ou tentar acessar contas, dados ou funções de outros usuários;</li>
          <li>Alterar notas, faltas ou registros sem autorização;</li>
          <li>Copiar, divulgar ou expor dados de alunos, responsáveis ou professores;</li>
          <li>
            Tentar burlar os mecanismos de segurança, sobrecarregar o sistema ou explorar falhas;
          </li>
          <li>Usar o portal para fins comerciais, ofensivos ou ilegais.</li>
        </ul>
      </Secao>

      <Secao titulo="8. Responsabilidades da escola">
        <p>
          A escola e a equipe do NOTUS se comprometem a manter medidas de segurança adequadas,
          corrigir dados incorretos quando informadas, atender aos direitos dos titulares
          previstos na Política de Privacidade e comunicar incidentes de segurança relevantes.
          Estes Termos não retiram direitos garantidos por lei aos usuários.
        </p>
      </Secao>

      <Secao titulo="9. Conteúdo e propriedade intelectual">
        <p>
          Notas, frequência, atividades e demais registros acadêmicos são lançados pela escola e
          pelos professores, que são responsáveis pelo seu conteúdo. A marca, o código e a
          interface do NOTUS pertencem aos seus autores e não podem ser copiados ou reutilizados
          sem autorização.
        </p>
      </Secao>

      <Secao titulo="10. Disponibilidade, manutenção e suporte">
        <p>
          O portal pode ficar indisponível temporariamente por manutenção, atualização ou falhas
          técnicas. Sempre que possível, as manutenções programadas serão avisadas com
          antecedência. Dúvidas e problemas de acesso devem ser encaminhados à secretaria.
        </p>
      </Secao>

      <Secao titulo="11. Suspensão e encerramento da conta">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            A conta pode ser suspensa em caso de uso indevido ou suspeita de acesso não autorizado,
            até que a situação seja esclarecida.
          </li>
          <li>
            Com o fim do vínculo com a escola, o acesso é encerrado e os dados passam a seguir os
            prazos de retenção e descarte da Política de Privacidade.
          </li>
          <li>
            O uso indevido pode resultar, além da suspensão, em medidas disciplinares previstas no
            regimento da escola e nas responsabilidades previstas em lei.
          </li>
        </ul>
      </Secao>

      <Secao titulo="12. Alterações nestes Termos">
        <p>
          Estes Termos podem ser atualizados para refletir mudanças no portal ou na legislação.
          Mudanças relevantes serão comunicadas no próprio portal antes de entrarem em vigor.
        </p>
      </Secao>

      <Secao titulo="13. Legislação aplicável e contato">
        <p>
          Estes Termos são regidos pelas leis brasileiras, em especial a Lei Geral de Proteção de
          Dados (Lei nº 13.709/2018), o Marco Civil da Internet (Lei nº 12.965/2014) e o Estatuto da
          Criança e do Adolescente (Lei nº 8.069/1990). Dúvidas: secretaria@colegionotus.com.br ·
          (11) 4002-8922.
        </p>
      </Secao>
    </div>
  );
}
