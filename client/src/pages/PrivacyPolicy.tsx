import type { ReactElement, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const LAST_UPDATED = "25 de agosto de 2026";
const CONTACT_EMAIL = "pedro.henrique.furtado.santos@gmail.com";

function Section({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold tracking-tight text-zinc-100">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-zinc-400">{children}</div>
    </section>
  );
}

export function PrivacyPolicy(): ReactElement {
  return (
    <div className="min-h-screen bg-navy-950 text-zinc-100">
      <header className="border-b border-zinc-800/80 px-5 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-zinc-400 transition hover:text-zinc-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <span className="text-sm font-semibold tracking-tight text-zinc-200">LifeSync</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-10 px-5 py-10 sm:px-6 sm:py-14">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Política de Privacidade
          </h1>
          <p className="mt-2 text-xs text-zinc-600">
            Última atualização: {LAST_UPDATED}
          </p>
        </div>

        <Section title="Quem somos">
          <p>
            O LifeSync é um aplicativo pessoal de organização de metas, hábitos, finanças,
            ideias e agenda, mantido por Pedro Henrique Furtado Santos. Esta política
            explica quais dados o aplicativo coleta, por que os coleta e o que você pode
            fazer a respeito.
          </p>
        </Section>

        <Section title="Dados que coletamos">
          <p>
            <strong className="font-medium text-zinc-300">Dados de conta:</strong> nome,
            e-mail e senha (armazenada apenas como hash criptográfico). São necessários
            para criar e autenticar sua conta.
          </p>
          <p>
            <strong className="font-medium text-zinc-300">Conteúdo que você cria:</strong>{" "}
            metas, hábitos, lançamentos financeiros, anotações do cofre de ideias e
            registros de diário. Esse conteúdo pertence a você e só é usado para exibir e
            processar as funcionalidades do aplicativo.
          </p>
          <p>
            <strong className="font-medium text-zinc-300">Dados do Google Agenda:</strong>{" "}
            se — e somente se — você conectar sua conta Google, o aplicativo passa a
            acessar os eventos da sua agenda para exibi-los, criá-los, editá-los e
            removê-los a seu pedido.
          </p>
        </Section>

        <Section title="Uso dos dados do Google">
          <p>
            A conexão com o Google usa o protocolo OAuth 2.0. Você autoriza o acesso na
            própria tela da Google e nós nunca vemos sua senha.
          </p>
          <p>
            O aplicativo solicita o escopo{" "}
            <code className="rounded bg-navy-900 px-1.5 py-0.5 text-xs text-zinc-300">
              https://www.googleapis.com/auth/calendar
            </code>{" "}
            para ler e gerenciar seus eventos, além de{" "}
            <code className="rounded bg-navy-900 px-1.5 py-0.5 text-xs text-zinc-300">
              openid
            </code>{" "}
            e{" "}
            <code className="rounded bg-navy-900 px-1.5 py-0.5 text-xs text-zinc-300">
              email
            </code>{" "}
            apenas para mostrar qual conta está conectada.
          </p>
          <p>
            Os eventos da sua agenda <strong className="font-medium text-zinc-300">não
            são copiados nem armazenados</strong> nos bancos de dados do LifeSync. Eles são
            consultados diretamente na API do Google no momento em que você abre a página
            de agenda e descartados assim que a tela é fechada.
          </p>
          <p>
            A única informação persistida dessa integração é o token de atualização
            (refresh token) que permite manter a conexão ativa. Ele é guardado cifrado com
            AES-256-GCM e é apagado imediatamente quando você desconecta a conta.
          </p>
        </Section>

        <Section title="Uso limitado (Google API Services)">
          <p>
            O uso e a transferência de informações recebidas das APIs do Google pelo
            LifeSync seguem a{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 underline underline-offset-2 transition hover:text-blue-300"
            >
              Política de Dados do Usuário dos Serviços de API do Google
            </a>
            , incluindo os requisitos de Uso Limitado.
          </p>
          <p>
            Em particular: não usamos dados do Google Agenda para publicidade, não os
            vendemos, não os transferimos a terceiros e não permitimos que pessoas leiam
            esses dados, salvo se você autorizar expressamente ou se houver exigência
            legal.
          </p>
        </Section>

        <Section title="Inteligência artificial">
          <p>
            Algumas funcionalidades opcionais usam modelos de linguagem da OpenAI — por
            exemplo, interpretar uma frase para sugerir um lançamento financeiro ou
            organizar uma anotação do cofre de ideias.
          </p>
          <p>
            Nesses casos, apenas o texto que você digitou naquela ação é enviado ao
            provedor. Dados do Google Agenda não são enviados para a OpenAI.
          </p>
        </Section>

        <Section title="Armazenamento e segurança">
          <p>
            Os dados ficam em bancos MongoDB hospedados em servidor privado. O tráfego
            entre seu navegador e o servidor é criptografado por HTTPS. Senhas são
            armazenadas apenas como hash e tokens de acesso a serviços externos são
            cifrados em repouso.
          </p>
        </Section>

        <Section title="Retenção e exclusão">
          <p>
            Seus dados são mantidos enquanto sua conta existir. Você pode desconectar a
            conta Google a qualquer momento pela página de Agenda, o que apaga
            imediatamente o token guardado — ou revogar o acesso diretamente em{" "}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 underline underline-offset-2 transition hover:text-blue-300"
            >
              myaccount.google.com/permissions
            </a>
            .
          </p>
          <p>
            Para excluir sua conta e todos os dados associados, basta enviar um pedido para
            o e-mail de contato abaixo.
          </p>
        </Section>

        <Section title="Seus direitos">
          <p>
            Você pode solicitar acesso, correção, portabilidade ou exclusão dos seus dados
            pessoais, conforme a Lei Geral de Proteção de Dados (LGPD). Os pedidos são
            atendidos pelo e-mail de contato.
          </p>
        </Section>

        <Section title="Alterações nesta política">
          <p>
            Se esta política mudar, a data de última atualização no topo desta página será
            revisada. Mudanças relevantes serão comunicadas dentro do aplicativo.
          </p>
        </Section>

        <Section title="Contato">
          <p>
            Dúvidas sobre privacidade podem ser enviadas para{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="break-all text-blue-400 underline underline-offset-2 transition hover:text-blue-300"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>
      </main>
    </div>
  );
}
