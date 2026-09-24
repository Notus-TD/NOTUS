import { ATUALIZADO_EM, Destaque, Secao, VERSAO_DOCUMENTOS } from "@/components/LegalPage";

export function PolicyContent() {
  return (
    <div className="space-y-10">
      <Secao titulo="1. Sobre esta política">
        <p>
          Esta política explica quais dados pessoais o NOTUS usa, para quê, por quanto tempo e
          quais são os seus direitos, conforme a Lei Geral de Proteção de Dados (LGPD — Lei nº
          13.709/2018). Versão {VERSAO_DOCUMENTOS}, atualizada em {ATUALIZADO_EM}.
        </p>
        <p>
          O NOTUS é um projeto acadêmico. O responsável pelos dados (controlador) é a escola que usa
          o sistema — neste protótipo, o Colégio Notus, uma escola fictícia.
        </p>
      </Secao>

      <Secao titulo="2. Quais dados usamos e por quê">
        <ul className="list-disc space-y-3 pl-6">
          <li>
            <Destaque>Conta de acesso</Destaque> (e-mail, senha e perfil): para você entrar no
            portal e ver apenas o que o seu perfil permite.
          </li>
          <li>
            <Destaque>Aluno</Destaque> (nome, e-mail, matrícula, data de nascimento e turma): para
            identificar o aluno e organizar a vida escolar.
          </li>
          <li>
            <Destaque>Responsável</Destaque> (nome, e-mail, CPF, telefone e endereço): para
            identificar o responsável legal, vinculá-lo aos alunos e permitir o contato da escola.
          </li>
          <li>
            <Destaque>Professor</Destaque> (e-mail e turmas em que leciona): para lançar notas,
            faltas e atividades.
          </li>
          <li>
            <Destaque>Dados acadêmicos</Destaque> (notas, boletins, frequência e atividades): para o
            acompanhamento escolar pelo aluno, pelo responsável e pelos professores.
          </li>
          <li>
            <Destaque>Registros de acesso</Destaque> (usuário, IP, data, hora e ação realizada):
            para segurança e para saber quem alterou notas, presenças e cadastros. Não registramos
            senhas.
          </li>
        </ul>
        <p>
          <Destaque>Base legal:</Destaque> o uso desses dados é necessário para a prestação do
          serviço educacional (Art. 7º, V) e para cumprir obrigações legais, como a guarda de
          registros escolares e de registros de acesso (Art. 7º, II). O aceite no primeiro acesso
          apenas confirma que você leu esta política e os Termos de Uso.
        </p>
        <p>
          Não coletamos dados sensíveis (como saúde ou biometria), localização, fotos ou dados
          financeiros.
        </p>
      </Secao>

      <Secao titulo="3. Crianças e adolescentes">
        <p>
          Os dados de alunos menores de idade são tratados sempre no melhor interesse do aluno (Art.
          14 da LGPD). As contas são criadas pela escola, o responsável vê apenas os alunos
          vinculados a ele, e as notas não são expostas a outros alunos nem usadas para publicidade.
        </p>
      </Secao>

      <Secao titulo="4. Quem acessa">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <Destaque>Aluno:</Destaque> os próprios dados.
          </li>
          <li>
            <Destaque>Responsável:</Destaque> os dados dos alunos vinculados a ele.
          </li>
          <li>
            <Destaque>Professor:</Destaque> os dados acadêmicos necessários para as suas aulas.
          </li>
          <li>
            <Destaque>Administração:</Destaque> cadastros, turmas e pedidos sobre dados pessoais.
          </li>
        </ul>
        <p>Essas permissões são verificadas pelo servidor em cada operação.</p>
      </Secao>

      <Secao titulo="5. Compartilhamento">
        <p>
          Não vendemos nem compartilhamos dados pessoais. Os dados ficam no servidor e no banco de
          dados do sistema, e os registros de acesso ficam em ferramentas de log (Loki e Grafana) na
          mesma infraestrutura. A única exceção é o Google Fonts, que fornece as fontes do site e
          recebe o seu IP ao carregar a página, podendo processá-lo fora do Brasil. Dados só são
          entregues a autoridades quando exigido por lei.
        </p>
      </Secao>

      <Secao titulo="6. Armazenamento no navegador">
        <p>
          Não usamos cookies. O navegador guarda apenas a sua sessão (apagada ao sair ou em até 1
          hora) e a indicação de que você já viu o aviso de privacidade.
        </p>
      </Secao>

      <Secao titulo="7. Por quanto tempo guardamos">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <Destaque>Cadastros:</Destaque> enquanto durar o vínculo com a escola. Depois, ou a
            pedido do titular, são anonimizados em até 30 dias.
          </li>
          <li>
            <Destaque>Dados acadêmicos:</Destaque> pelo prazo exigido pela legislação escolar.
          </li>
          <li>
            <Destaque>Registros de acesso:</Destaque> 6 meses (Marco Civil da Internet, Art. 15).
          </li>
        </ul>
      </Secao>

      <Secao titulo="8. Seus direitos">
        <p>
          Você (ou seu responsável legal) pode pedir: acesso aos seus dados, correção, informação
          sobre compartilhamento, anonimização ou eliminação, e uma cópia dos seus dados
          (portabilidade). Basta solicitar à secretaria da escola, que responde em até 15 dias.
          Alguns dados podem ser mantidos quando a lei exigir, como os registros escolares.
        </p>
      </Secao>

      <Secao titulo="9. Segurança e incidentes">
        <p>
          As senhas são guardadas com criptografia (hash), o acesso expira automaticamente e cada
          perfil só acessa o que precisa. Se houver um incidente de segurança com risco aos
          titulares, a escola comunica a ANPD e as pessoas afetadas.
        </p>
      </Secao>

      <Secao titulo="10. Alterações e contato">
        <p>
          Mudanças importantes nesta política serão avisadas no portal. Dúvidas ou pedidos sobre
          seus dados: secretaria da escola, pelo e-mail secretaria@colegionotus.com.br. Você também
          pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
        </p>
      </Secao>
    </div>
  );
}
