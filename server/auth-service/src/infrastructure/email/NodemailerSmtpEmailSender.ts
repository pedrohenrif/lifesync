import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type {
  IEmailSender,
  PasswordResetMail,
} from "../../application/ports/IEmailSender.js";

export type SmtpConfig = {
  readonly host: string;
  readonly port: number;
  readonly user: string;
  readonly pass: string;
  readonly from: string;
};

export class NodemailerSmtpEmailSender implements IEmailSender {
  private readonly transporter: Transporter | null;
  private readonly from: string;
  readonly isConfigured: boolean;

  constructor(config: SmtpConfig) {
    this.isConfigured = config.user.length > 0 && config.pass.length > 0;
    this.from = config.from;
    this.transporter = this.isConfigured
      ? nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: config.port === 465,
          auth: {
            user: config.user,
            pass: config.pass,
          },
        })
      : null;
  }

  async sendPasswordResetCode(mail: PasswordResetMail): Promise<void> {
    if (this.transporter === null) {
      throw new Error("SMTP is not configured");
    }

    await this.transporter.sendMail({
      from: this.from,
      to: mail.to,
      subject: "Seu código para redefinir a senha no LifeSync",
      text: [
        "Você pediu para redefinir a senha no LifeSync.",
        "",
        `Código: ${mail.code}`,
        "",
        "Ele vale por 10 minutos e só pode ser usado uma vez.",
        "Se você não pediu isso, ignore este e-mail.",
      ].join("\n"),
    });
  }
}
